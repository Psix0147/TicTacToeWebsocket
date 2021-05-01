
var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var WebSocket = require('ws');

var wss, serversServer, wsConnectToServer;



wsConnectToServer = new WebSocket("ws://37.194.14.20:16505");
console.log("hey huy")

wsConnectToServer.on('open', function open() {
	wsConnectToServer.on('message', (data)=>{
		if(JSON.parse(data)){
			stat = JSON.parse(data).stat;
			turnCounter = JSON.parse(data).turnCounter;
			currentTurn = JSON.parse(data).currentTurn;
			clientId = JSON.parse(data).clientId;
			activePlayersId = JSON.parse(data).activePlayersId;
			flagGameAlready = JSON.parse(data).flagGameAlready
		}
		console.log(data);
	})
	wsConnectToServer.on('close', ()=>{
		wss = new WebSocket.Server({ port: 16501 });
		appListen();
		GameLogic();
		//serversServer = new WebSocket.Server({ port: 16505 });
	});
});

let GameStat = {
	p1fig:'',
	p2fig:'',
	fields:['','','','','','','','','']
}
var turnCounter;
var clients = [];
var clientId = 1;
var activePlayers = [];
var activePlayersId = [];
var flagGameAlready = false;
var arr = ["X", "O"];
var currentTurn;
function arrayRandElement() {
	var rand = Math.floor(Math.random() * arr.length);
	console.log(arr[rand]);
	return arr[rand];
}
	let stat;

function GameLogic(){
	wss.on('connection', function connection(ws) {

		ws.send(JSON.stringify({'command': "getYourId"}));

		ws.on('message', (data)=>{
			console.log(data);
			//console.log(activePlayersId);
			if(JSON.parse(data).myId){
				console.log('this' + activePlayersId)
				ws.clientId = JSON.parse(data).myId
				clients.push(ws);
				console.log(activePlayersId)
				if(activePlayersId.indexOf(ws.clientId) != -1){
					if (!activePlayers[0]){
						activePlayers[0] = ws;
					}
					else if(!activePlayers[1]){
						activePlayers[1] = ws;
					}
					console.log("client id: " + ws.clientId);
					updateStat(stat, activePlayers);
					ws.removeAllListeners('message');
					message(ws, activePlayers);
				}
			}else{
				clients.push(ws);
				clients[clients.length-1].clientId = clientId;
	
				if (!activePlayers[0]){
					activePlayers[0] = ws;
					activePlayersId[0] = ws.clientId;
				}
				else if(!activePlayers[1]){
					activePlayers[1] = ws;
					activePlayersId[1] = ws.clientId;
				}
				message(ws, activePlayers);
				clientId++;

			}
			
		})

		
		ws.on('close', function() {
			console.log("user left");
			delete clients[clients.indexOf(ws)]
			if(activePlayers.indexOf(ws)){
				delete activePlayers[activePlayers.indexOf(this.ws)];
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

		

		if (activePlayers[0] && activePlayers[1] && !flagGameAlready){
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
				"stat": stat
			}));

		turnCounter=0;
	}

	function message(client, players){
		console.log("message");
		if (client){
			if (activePlayers.indexOf(client) != -1){
				client.on('message', (data) => {	
					console.log(data);
					if (JSON.parse(data).command == "updateStat"){
						if(isValidate(JSON.parse(data))){
							updateStat(JSON.parse(data).stat, players);
							turnCounter++;
						}
					}
					//client.send('accept');
				});
			}else{
				client.on('message', (data) => {
						client.send(JSON.stringify({'command': 'waitForGame'}));
						console.log(data)
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

	function updateStat(dataStat, players){
		let validTurnCheck;
		stat = dataStat;
		if (turnCounter%2==0){	
			validTurnCheck = 'X'
		}else{
			validTurnCheck = 'O'
		}

		console.log("len "+ players.length);

		for (let player of players){
			if (player){
				console.log("updated");
				if (turnCounter%2==0){
					player.send(JSON.stringify({
						"turn": "X",
						"command": "updateStat",
						"stat": stat
					}));
				} else {
					player.send(JSON.stringify({
						"turn": "O",
						"command": "updateStat",
						"stat": stat
					}));
				}
				if(cheekWinner()){
					player.send(JSON.stringify({
						"command":"Winner",
						"winner": validTurnCheck
					}));
				}
				if(isDraw()){
					player.send(JSON.stringify({
						"command":"Draw"
					}));
				}
			}
		}
		
		
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
}

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
	res.render('index');
});




function appListen(){
	app.listen(16155, function() {
		console.log('Work on port: 16155');
	});
}
