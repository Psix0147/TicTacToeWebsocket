window.onload = () => {
	main();
}

let stat;
var main = function () {
	var socket = new WebSocket("ws://45.141.101.210:15500");
	var myFigure;
	var board = document.getElementById('board');

	board.innerHTML += '<div id="statusBar">statusBar</div>';
	board.innerHTML += '<div id="gameBoard"></div>';
	board.innerHTML += '<div id="informationTable">informationTable</div>';

	var gameBoard = document.getElementById('gameBoard');
	for (var i = 0; i<9; i++)
		gameBoard.innerHTML += '<button class="Button"></button>';
	
	var gameButtons = document.getElementsByClassName('Button');
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
		if(JSON.parse(event.data).figure){
			myFigure = JSON.parse(event.data).figure;
		}
		if(JSON.parse(event.data).stat){
			stat = JSON.parse(event.data).stat;
			updateStat(gameButtons);
		}
	}
}


function sendClick(socket, figure, figNum){
	socket.send(JSON.stringify({"stat": stat, "turn":figure+figNum}));
}

function updateStat(fields){
	for (let i=0; i<fields.length; i++)
		fields[i].innerHTML = stat.fields[i]
}
