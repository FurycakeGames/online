var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log('Server started.')

function checkDistance(a, b){
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  var dz = a.z - b.z;
  return Math.sqrt(dx*dx+dy*dy+dz*dz);
}

var SOCKET_LIST = {};
var PLAYER_LIST = {};
var ENEMY_LIST = {};

var Player = function(id){
	var self = {
		x:Math.random() * 5 - 2.5,
		y:Math.random() * 5 - 2.5,
		z: 0,
		id: id,
		score: 0
	}
	return self;
}

var Enemy = function(id){
	var self = {
		x:0,
		y:0,
		z:0.1,
		speedX:0,
		speedY:0,
		speedZ:0,
		id:id,
	}
	self.resetPosition = function(){
		var i = Math.ceil(Math.random() * 3);
		switch(i) {
			case 3:
				self.y = 10;
				self.x = Math.random() * 5 - 2.5;
				self.speedY = -0.07 * Math.random() - 0.05;
				self.speedX = 0;
				break;
			case 2:
				self.x = -10;
				self.y = Math.random() * 5 - 2.5;
				self.speedX = 0.07 * Math.random() + 0.05;
				self.speedY = 0;
				break;
			case 1:
				self.x = 10;
				self.y = Math.random() * 5 - 2.5;
				self.speedX = -0.07 * Math.random() - 0.05;
				self.speedY = 0;
		}		
	}
	self.resetPosition();

	self.updatePosition = function(){
		self.x += self.speedX;
		self.y += self.speedY;
		self.z += self.speedZ;
		if (self.x > 11 || self.y > 11 || self.x < -11){
			self.resetPosition();
		}
	}

	return self;
}

var Coin = function(){
	var self = {
		x:Math.random() * 4 - 2,
		y:Math.random() * 4 - 2,
		z: 0,
	}
	self.checkCollision = function(){
		for (var i in PLAYER_LIST){
		  if (checkDistance(PLAYER_LIST[i], self) < 0.3){
		  	self.x = Math.random() * 4 - 2;
		  	self.y = Math.random() * 4 - 2;
				return true;
			}
		}
	}
	return self;
}

var coin = Coin();

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	var socket_id = socket.id;
	SOCKET_LIST[socket.id] = socket;

	var player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;

	socket.emit('createCoin', coin);

	console.log('socket connection ' + socket.id);

	var createPlayers = {
		list: PLAYER_LIST,
		id: socket.id,
	};

	socket.emit('createPlayers', createPlayers);

	socket.emit('createEnemies', ENEMY_LIST);

	socket.broadcast.emit('newPlayer', player);

	socket.on('changePosition', function(data){
		PLAYER_LIST[data.id].x = data.x;
		PLAYER_LIST[data.id].y = data.y;
		PLAYER_LIST[data.id].z = data.z;
	});

	socket.on('keyPress', function(data){
		if (data.inputId === 'left'){
			player.pressingLeft = data.state;
		}
		if (data.inputId === 'right'){
			player.pressingRight = data.state;
		}
		if (data.inputId === 'up'){
			player.pressingUp = data.state;
		}
		if (data.inputId === 'down'){
			player.pressingDown = data.state;
		}
	})

	socket.on('playerDeath', function(data){
		socket.broadcast.emit('usergone', {'left_user': data});
	})

  socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
		console.log('disconnected ' + socket_id)
		socket.broadcast.emit('usergone', {'left_user': socket_id});
  })
});


setInterval(function(){
	var pack = [];
	for (var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
//		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			z:player.z,
			id:player.id
		});
	}

	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}

	for (var i in ENEMY_LIST){

		var enemy = ENEMY_LIST[i];
		enemy.updatePosition();
		pack.push({
			x:enemy.x,
			y:enemy.y,
			z:enemy.z,
			id:enemy.id,
		});
	}

	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('enemyPositions', pack);
	}

	if (coin.checkCollision()){
		socket.broadcast.emit('coinGrabbed', coin);
		var enemy = Enemy(Math.random());
		ENEMY_LIST[enemy.id] = enemy;
		socket.broadcast.emit('newEnemy', enemy);
	}
}, 1000/30);