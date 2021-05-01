var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var WebSocket = require('ws');

var wss, serversServer;

wss = new WebSocket.Server({ port: 16501 });
serversServer = new WebSocket.Server({ port: 16505 });

let subServers = [];

serversServer.on('connection', function connection(ws) {
	subServers.push(ws);
	subServersSendData();
});
let stat;
let GameStat = {
	p1fig:'',
	p2fig:'',
	fields:['','','','','','','','','']
}
var turnCounter = 1;
var clients = [];
var clientId = 1;
var activePlayers = [];
var activePlayersId = [];
var flagGameAlready = false;
var currentTurn;
var arr = ["X", "O"];
function arrayRandElement() {
	var rand = Math.floor(Math.random() * arr.length);
	console.log(arr[rand]);
    return arr[rand];
}

wss.on('connection', function connection(ws) {
	console.log("user come" + clientId)
	clients.push(ws);
	clients[clients.length-1].clientId = clientId;
	if (!activePlayers[0]){
		activePlayers[0] = ws;
	}
	else if(!activePlayers[1]){
		activePlayers[1] = ws;
	}
	clientId++;


	ws.on('close', function() {
		console.log("user left");
		delete clients[clients.indexOf(ws)]
		if(activePlayers.indexOf(this.ws)){
			console.log(ws.clientId);
			delete activePlayers[activePlayers.indexOf(ws)];
			delete activePlayersId[activePlayersId.indexOf(ws.clientId)];
			for (let client of clients){
				if (client){
					if (activePlayers.indexOf(client) == -1){
						if (!activePlayers[0])
							activePlayers[0] = client;
						else if(!activePlayers[1])
							activePlayers[1] = client;
							//return
						}
					client.removeAllListeners('message');
					message(client, activePlayers);
					flagGameAlready = false;
				}
			}
		}
	});
	message(ws, activePlayers);
	subServersSendData();
	if (activePlayers[0] && activePlayers[1] && !flagGameAlready){

		activePlayersId[0] = activePlayers[0].clientId;
		activePlayersId[1] = activePlayers[1].clientId;
		startGame(activePlayers);
		flagGameAlready = true;

	}
});

function startGame(players){
	stat = GameStat;
	players[0].figure = arrayRandElement()
	
	if (players[0].figure == 'X')
		players[1].figure = 'O';
	else
		players[1].figure = 'X';
	
	stat.p1fig = players[0].figure;
	stat.p2fig = players[1].figure;

	for (let player of players)
		player.send(JSON.stringify({
			"turn": "X",
			"command": "startGame",
			"figure": player.figure,
			"stat": stat,
			"yourId": player.clientId
		}));

	turnCounter=0;
	subServersSendData();
}

function message(client, players){
	if (client){
		if (activePlayers.indexOf(client) != -1){
			client.on('message', (data) => {	
				console.log(data);
				if (JSON.parse(data).command == "updateStat"){
					if(isValidate(JSON.parse(data))){
						console.log(data);
						updateStat(JSON.parse(data), players);
						subServersSendData();
					}
				}
				if (JSON.parse(data).command == "newGame"){
					startGame(players);
				}
			});
		}else{
			client.on('message', (data) => {
					client.send(JSON.stringify({'command': 'waitForGame'}));
					subServersSendData();
					//console.log(client.clientId + "|" + data)
			});
		}
	}
}

function isValidate(data){
	let validTurn = data.turn.split(' ');
	
	console.log(stat.fields[validTurn[1]]);
	if (stat.fields[validTurn[1]] != 'X' && stat.fields[validTurn[1]] != 'O'){
		if (turnCounter%2==0){	
			console.log(validTurn);
			if (validTurn[0] == 'X')
				return true;
		}
		if (turnCounter%2==1){
			console.log(validTurn);
			if (validTurn[0] == 'O')
				return true;
		}
	}
	return false
}

function updateStat(data, players){
	stat = data.stat;
	let validTurn = data.turn.split(' ');
	currentTurn = validTurn[0];
	for (let player of players){
		if (turnCounter%2==1){
			player.send(JSON.stringify({
				"turn": "X",
				"command": "updateStat",
				"stat": stat
			}));
			subServersSendData();
		} else {
			player.send(JSON.stringify({
				"turn": "O",
				"command": "updateStat",
				"stat": stat
			}));
			subServersSendData();
		}
		if(cheekWinner()){
			player.send(JSON.stringify({
				"command":"Winner",
				"winner": currentTurn
			}));
			subServersSendData();
		}
		if(isDraw()){
			player.send(JSON.stringify({
				"command":"Draw"
			}));
			subServersSendData();
		}
	}
	
	turnCounter++;
}

function isDraw(){
	for (field of stat.fields){
		if (!field)
			return false;
	}
	return true;
}
function cheekWinner(){
	if (stat.fields[0] && stat.fields[0] == stat.fields[1] && stat.fields[0] == stat.fields[2]){
		return true;
	} else if (stat.fields[0] && stat.fields[0] == stat.fields[3] && stat.fields[0] == stat.fields[6]){
		return true;
	} else if (stat.fields[1] && stat.fields[1] == stat.fields[4] && stat.fields[1] == stat.fields[7]){
		return true;
	} else if (stat.fields[2] && stat.fields[2] == stat.fields[5] && stat.fields[2] == stat.fields[8]){
		return true;
	} else if (stat.fields[3] && stat.fields[3] == stat.fields[4] && stat.fields[3] == stat.fields[5]){
		return true;
	} else if (stat.fields[4] && stat.fields[4] == stat.fields[0] && stat.fields[4] == stat.fields[8]){
		return true;
	} else if (stat.fields[4] && stat.fields[4] == stat.fields[2] && stat.fields[4] == stat.fields[6]){
		return true;
	} else if (stat.fields[6] && stat.fields[6] == stat.fields[7] && stat.fields[6] == stat.fields[8]){
		return true;
	}
	return false;
}

function subServersSendData(){
	for (let serv of subServers){
		//console.log(clients);
		serv.send(JSON.stringify({
			'stat': stat,
			'turnCounter': turnCounter,
			//'clients': clients,
			'clientId': clientId,
			'activePlayersId': activePlayersId,
			'flagGameAlready': flagGameAlready
		}));
	}
}
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
	res.render('index');
});





app.listen(16155, function() {
	console.log('Work on port: 16155');
});

