window.onload = () => {
	main();
}

let myId;
let stat;
var socket;
var gameButtons;
var myFigure;

var main = function () {
	socket = new WebSocket("ws://37.194.14.20:16501");
	console.log(socket);
	
	var board = document.getElementById('board');
	board.innerHTML = "";
	board.innerHTML += '<div id="statusBar">Ожидание оппонента</div>';
	board.innerHTML += '<div id="gameBoard"></div>';
	board.innerHTML += '<div id="informationTable"></div>';

	var gameBoard = document.getElementById('gameBoard');
	for (var i = 0; i<9; i++)
		gameBoard.innerHTML += '<button class="Button"></button>';
	
	

	message(socket);
	close(socket);
	
}
function isOpen(ws) { return ws.readyState === ws.OPEN }


function sendNewGame(socket, buttonSendNewGame){
	console.log(socket.readyState);
	if (!isOpen(socket)) return;
	socket.send(JSON.stringify({command: "newGame"}));
	buttonSendNewGame.setAttribute('disabled', true);
}

function sendClick(socket, figure, figNum){
	console.log(socket.readyState);
	console.log(figure, figNum);
	if (!isOpen(socket)) return;
	socket.send(JSON.stringify({command: "updateStat", "stat": stat, "turn":figure+' '+figNum}));
}

function message(socket){
	gameButtons = document.getElementsByClassName('Button');
	for (let i = 0; i < gameButtons.length; i++){
		gameButtons[i].onclick = () => {
			//console.log(stat);
			stat.fields[i] = myFigure;
			sendClick(socket, myFigure, i);
			//gameButtons[i].innerHTML=myFigure;
		}
	}
	socket.onmessage = (event)=>{
		console.log(JSON.parse(event.data));
		if(JSON.parse(event.data).command == "startGame"){
			let informationTable = document.getElementById('informationTable');
			myFigure = JSON.parse(event.data).figure;
			informationTable.innerHTML = "Ваша фигура: " + myFigure;
			myId = JSON.parse(event.data).yourId;
		}
		if(JSON.parse(event.data).command == "getYourId"){
			console.log(JSON.stringify({'myId': myId}));
			socket.send(JSON.stringify({'myId': myId}));
		}
		if(JSON.parse(event.data).stat){
			let statusBar = document.getElementById('statusBar');
			statusBar.innerHTML = "Сейчас ход " + JSON.parse(event.data).turn;
			stat = JSON.parse(event.data).stat;
			updateStat(gameButtons);
		}
		
		if(JSON.parse(event.data).command == "Winner"){
			let statusBar = document.getElementById('statusBar');
			if(JSON.parse(event.data).winner == "X"){
				statusBar.innerHTML = "Победили крестики";
				console.log(statusBar);
			} else if (JSON.parse(event.data).winner == "O") {
				statusBar.innerHTML = "Победили нолики";
				console.log(statusBar);
			}
		}
		if((JSON.parse(event.data).command == "Draw") || (JSON.parse(event.data).command == "Winner")){
			let statusBar = document.getElementById('statusBar');
			if (JSON.parse(event.data).command == "Draw") {
				statusBar.innerHTML = "Ничья";
			} else {
				if(JSON.parse(event.data).winner == "X"){
					statusBar.innerHTML = "Победили крестики";
				} else if (JSON.parse(event.data).winner == "O") {
					statusBar.innerHTML = "Победили нолики";
				}
			}
			board.innerHTML += '<div id = "buttonDiv"><button id="sendNewGame">Начать новую игру</button></div>'
			let buttonSendNewGame = document.getElementById("sendNewGame");
			let buttonDiv = document.getElementById("buttonDiv");
			buttonSendNewGame.onclick = () => {
				sendNewGame(socket, buttonSendNewGame);
				buttonDiv.innerHTML = "";
			}
		}
		if(JSON.parse(event.data).command == "waitForGame"){
			let statusBar = document.getElementById('statusBar');
			statusBar.innerHTML = "Пожалуйста, подождите";
		}
	}
}

function close(socket){
	socket.onclose = (event)=>{
		btns = document.getElementsByClassName('Button');
		for( let btn of btns ) {
			btn.setAttribute('disabled', true);
		}
		let statusBar = document.getElementById('statusBar');
		statusBar.innerHTML = "Восстановление подключения";
		setTimeout(()=>{
			try {
				socket = new WebSocket("ws://37.194.14.20:16501");
				
				//socket.removeListener("message");
				message(socket);
				//close(socket);
				socket.send("its okay")
			} catch (err){
				if (err){
					console.log(err)
					statusBar.innerHTML = "Сервер недоступен";
				}
			}
		}, 5000);
	 }
}

function updateStat(fields){
	for (let i=0; i<fields.length; i++){
		fields[i].innerHTML = stat.fields[i]
		if(fields[i].innerHTML){
			fields[i].disabled = true
		}else{
			fields[i].disabled = false;
		}
	}
}


