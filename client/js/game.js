var socket = io();
var user = Math.random();

var score = 0;


var scoretext = document.createElement('div');
scoretext.style.position = 'absolute';
//text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
scoretext.style.width = 200;
scoretext.style.height = 200;
scoretext.style.color = "white";
scoretext.innerHTML = "Score: " + score;
scoretext.style.top = 20 + 'px';
scoretext.style.left = 20 + 'px';
document.body.appendChild(scoretext);

function getDistance(mesh1, mesh2) { 
  var dx = mesh1.position.x - mesh2.position.x; 
  var dy = mesh1.position.y - mesh2.position.y; 
  var dz = mesh1.position.z - mesh2.position.z; 
  return Math.sqrt(dx*dx+dy*dy+dz*dz); 
}

var i;

var scene = new THREE.Scene;

var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000 );
camera.position.z = 5;
camera.position.y = -5;

var renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
renderer.setSize( window.innerWidth * 0.8, window.innerHeight * 0.8);
document.body.appendChild( renderer.domElement );

var ambient = new THREE.AmbientLight( 0x404040, 2 ); // soft white light
scene.add( ambient );

//Create a PointLight and turn on shadows for the light
var light = new THREE.PointLight( 0xffffff, 0.5, 100 );
light.position.set(1, -2, 3);
light.castShadow = true;            // default false
scene.add( light );

//Set up shadow properties for the light
light.shadow.mapSize.width = 1024;  // default
light.shadow.mapSize.height = 1024; // default
light.shadow.camera.near = 0.5;       // default
light.shadow.camera.far = 1000      // default


// Ground
var ground_material = new THREE.MeshLambertMaterial({color: 0xaaaaaa});
var ground = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 0.1), ground_material);
ground.position.z = -0.2;
ground.receiveShadow = true;
scene.add( ground );


//createCoin();


var players = {};

selfCreated = false;

PLAYER_LIST = [];

var socketId;

socket.on('createPlayers', function(data){
	socketId = data.id;
	for (var i in data.list){
		console.log(data.list[i])
		var cube_material = new THREE.MeshLambertMaterial({color:"red"});
		if (data.list[i].id == data.id){
			cube_material = new THREE.MeshLambertMaterial({color:"blue"});
		}
		var cube = new THREE.Mesh(new THREE.CubeGeometry(0.3, 0.3, 0.3), cube_material);
		cube.castShadow = true;
		cube.player = true
		cube.position.x = data.list[i].x;
		cube.position.y = data.list[i].y;
		cube.position.z = 0;
		cube.playerID = data.list[i].id;
		console.log(data.list[i].id)
		players[data.list.id] = cube;
		if (data.list[i].id == data.id){
			cube.special = true;
		}
		scene.add(cube);
		console.log('aaa')
	}
});


socket.on('newPlayer', function(data){
	if (data.id !== socketId) {
	var cube_material = new THREE.MeshLambertMaterial({color:"red"});
	var cube = new THREE.Mesh(new THREE.CubeGeometry(0.3, 0.3, 0.3), cube_material);
	cube.castShadow = true;
	cube.player = true
	cube.position.x = data.x;
	cube.position.y = data.y;
	cube.position.z = 0;
	cube.playerID = data.id;
	console.log(data.id)
	players[data.id] = cube;
	scene.add(cube);
	}
});


socket.on('usergone', function(data){
	console.log(data.left_user)
	for (var i in players){
		if (players[i].playerID === data.left_user){
			scene.remove(players[i]);
		}
	}
	scene.traverse(function(node) {
		if (node instanceof THREE.Mesh){
			if (node.player === true){
				if (node.playerID === data.left_user){
					scene.remove(node);
				}
			}
		}
	});
})


socket.on('newPositions', function(data){
	scene.traverse(function(node) {
		if (node instanceof THREE.Mesh){
			if (node.player === true && node.special !== true){
				for (var i in data){
					if (data[i].id === node.playerID){
							node.position.x = data[i].x;
							node.position.y = data[i].y;
					}						
				}
			}
		}
	});
})
	var coin;

socket.on('createCoin', function(data){
	var coin_material = new THREE.MeshLambertMaterial({color: 0xFFFF00});
	var coin_geometry =	new THREE.CylinderGeometry(0.2, 0.2, 0.05, 30, 1, false, 0, 2 * Math.PI);
	coin = new THREE.Mesh(coin_geometry, coin_material);
	coin.position.x = data.x;
	coin.position.y = data.y;
	coin.position.z = 0.2;
	ascend(coin);
	coin.cube = true;
	coin.rotationspeed.z = 0.05;
	coin.castShadow = true;
	coin.coin = true;
	scene.add( coin );
})

socket.on('coinGrabbed', function(data){
	coin.position.x = data.x;
	coin.position.y = data.y;
})



var keys = [];
keys.up = false;
keys.left = false;
keys.right = false;
keys.down = false;
keys.jump = false;



function ascend(self){
	self.speed = [];
	self.speed.x = 0;
	self.speed.y = 0;
	self.speed.z = 0;
	self.rotationspeed = [];
	self.rotationspeed.x = 0;
	self.rotationspeed.y = 0;
	self.rotationspeed.z = 0;
}


function createEnemy(){
	var enemy_geometry = new THREE.CubeGeometry(0.5, 0.5, 0.5);
	var enemy_material = new THREE.MeshNormalMaterial();
	var enemy = new THREE.Mesh(enemy_geometry, enemy_material);
	ascend(enemy);
	scene.add(enemy);
	i = Math.ceil(Math.random() * 3)
	switch(i) {
    case 3:
			enemy.position.y = 10;
			enemy.position.x = Math.random() * 5 - 2.5;
			enemy.speed.y = -0.05 * Math.random() - 0.03;
      break;
    case 2:
			enemy.position.x = -10;
			enemy.position.y = Math.random() * 5 - 2.5;
			enemy.speed.x = 0.05 * Math.random() + 0.03;
       break;
    case 1:
			enemy.position.x = 10;
			enemy.position.y = Math.random() * 5 - 2.5;
			enemy.speed.x = -0.05 * Math.random() - 0.03;
	}

	enemy.position.z = 0.1
	enemy.cube = true;
	enemy.receiveShadow = true;
	enemy.castShadow = true;
	enemy.enemy = true;
}

//			createEnemy();
//			createEnemy();
//			createEnemy();





document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event) {
	var keyCode = event.which;
	if (keyCode == 38) {
		keys.up = false;
//		socket.emit('keyPress', {inputId: 'up', state: false})
	}
	if (keyCode == 40) {
		keys.down = false;
//		socket.emit('keyPress', {inputId: 'down', state: false})
	}
	if (keyCode == 37) {
		keys.left = false;
//		socket.emit('keyPress', {inputId: 'left', state: false})
	}
	if (keyCode == 39) {
		keys.right = false;
//		socket.emit('keyPress', {inputId: 'right', state: false})
	}
	if (keyCode == 32) {
			keys.jump = false;
	}
};

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
	var keyCode = event.which;
	if (keyCode == 38) {
		keys.up = true;
//		socket.emit('keyPress', {inputId: 'up', state: true})
	}
	if (keyCode == 40) {
		keys.down = true;
//		socket.emit('keyPress', {inputId: 'down', state: true})
	}
	if (keyCode == 37) {
		keys.left = true;
//		socket.emit('keyPress', {inputId: 'left', state: true})
	}
	if (keyCode == 39) {
		keys.right = true;
//		socket.emit('keyPress', {inputId: 'right', state: true})
	}
	if (keyCode == 32) {
		if (keys.jump == false && cube.position.z == 0){
				cube.speed.z = 0.15;
				keys.jump = true;
		}
	}
};

function jumping() {
};

function movement(){
	scene.traverse(function(node) {
		if (node instanceof THREE.Mesh){
			if (node.cube){
				node.position.x += node.speed.x;
				node.position.y += node.speed.y;
				node.position.z += node.speed.z;
				node.rotation.x += node.rotationspeed.x;
				node.rotation.y += node.rotationspeed.y;
				node.rotation.z += node.rotationspeed.z;
			}
		}
	});
}

var lastUpdate = Date.now();
//var myInterval = setInterval(tick, 0);

function getDeltaTime(){
	var now = Date.now()
	var interval = (now - lastUpdate) / (1000 / 60);
	lastUpdate = now;
	return interval
}

var dt

function update(){

	dt = getDeltaTime();

	scene.traverse(function(node) {
		if (node.special === true){
			if (keys.left){
				node.position.x -= 0.05 * dt;
			}
			if (keys.right){
				node.position.x += 0.05 * dt;
			}
			if (keys.up){
				node.position.y += 0.05 * dt;
			}
			if (keys.down){
				node.position.y -= 0.05 * dt;
			}
			if (keys.down || keys.right || keys.up || keys.left){
				socket.emit('changePosition', {x: node.position.x, y: node.position.y, id: socketId})
			}
		}
	});
/*
	scene.traverse(function(node) {
		if (node instanceof THREE.Mesh){
			if (node.enemy){
				if (node.position.x < -12 || node.position.x > 12 || node.position.y < -12){
					scene.remove(node)
					createEnemy()
				}
				if (getDistance(node, cube) < 0.4){
					scene.remove(cube)
					scoretext.innerHTML = "x.x moristeS, Score: " + score;
				}
			}
			if (node.coin){
				if (getDistance(node, cube) < 0.4){
					score += 1;
					scoretext.innerHTML = "Score: " + score;
					scene.remove(node);
					createCoin();
					createEnemy();
				}
			}

		}
	});
*/

}


function animate() {

	requestAnimationFrame( animate );
	renderer.render( scene, camera );
//	camera.lookAt(cube.position );
//	camera.rotation.z = 0;
//	camera.lookAt(ground.position);
	for (var i in players){
		scene.traverse(function(node) {
			if (node instanceof THREE.Mesh){
				if (node.special === true){
					camera.lookAt(node.position);
					camera.rotation.z = 0;
				}
			}
		});
	}

	movement();
	update();
	jumping();

//	updateMovement();
};
animate();
