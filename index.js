var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var WebSocket = require('ws');
const { start } = require('repl');

let GameStat = {
	p1fig:'',
	p2fig:'',
	fields:['','','','','','','','','']
}
var turnCounter;
var clients = [];


var wss;
var Server = ()=>{
	 wss = new WebSocket.Server({ port: 15500 });
} 
Server();

var clientId = 1;
var activePlayers = [];
var flagGameAlready = false;
var arr = ["X", "O"];
function arrayRandElement() {
	var rand = Math.floor(Math.random() * arr.length);
	console.log(arr[rand]);
    return arr[rand];
}

wss.on('connection', function connection(ws) {
	console.log("user come")
	clients.push(ws);
	clients[clients.length-1].clientId = clientId;
	if (!activePlayers[0]){
		activePlayers[0] = ws;
	}
	else if(!activePlayers[1])
		activePlayers[1] = ws;
	clientId++;
	//console.log(activePlayers);
	//ws.send('something');
	
	ws.on('close', function() {
		console.log("user left");
		delete clients[clients.indexOf(ws)]
		delete activePlayers[activePlayers.indexOf(ws)];
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
		
	});
	message(ws, activePlayers);
	if (activePlayers[0] && activePlayers[1] && !flagGameAlready){
		startGame(activePlayers);
		flagGameAlready = true;
	}
});
let stat;
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
			"command": "startGame",
			"figure": player.figure,
			"stat": stat
		}));

	turnCounter=0;
}

function message(client, players){
	if (client){
		if (activePlayers.indexOf(client) != -1){
			client.on('message', (data) => {	
				if (JSON.parse(data).command = "updateStat"){
					if(JSON.parse(data)){
						updateStat(JSON.parse(data), players);
					}
				}
				//client.send('accept');
			});
		}else{
			client.on('message', (data) => {
					client.send(JSON.stringify({'command': 'Wait For Game'}));
					//console.log(client.clientId + "|" + data)
			});
		}
	}
}

function isValidate(data){
	if (turnCounter%2!=0)
		data.
	return true;
}

function updateStat(data, players){
	stat = data.stat;
	for (let player of players){
		player.send(JSON.stringify({
			"command": "updateStat",
			"stat": stat
		}));
	}
	turnCounter++;
}

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');


app.get('/', function(req, res) {
	res.render('index');
});



app.listen(15155, function() {
	console.log('Work on port: 15155');
});

