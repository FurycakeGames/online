var username = window.location.search.substring(10, window.location.search.length);

console.log(username);

var socket = io();

var socketId;

socket.on('emitSocketId', function(data){
	socketId = data;	
})

socket.emit('setUsername', username);

var scoretext = document.createElement('div');
scoretext.style.position = 'absolute';
//text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
scoretext.style.width = 200;
scoretext.style.height = 200;
scoretext.style.color = "white";
refreshScoreTable();
scoretext.style.top = 50 + 'px';
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
light.shadow.mapSize.width = 256;  // default
light.shadow.mapSize.height = 256; // default
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

socket.on('createPlayers', function(data){
	for (var i in data.list){
		console.log(data.list[i])
		var cube_material = new THREE.MeshLambertMaterial({color:"red"});
		if (data.list[i].id == data.id){
			cube_material = new THREE.MeshLambertMaterial({color:"blue"});
		}
		var cube = new THREE.Mesh(new THREE.CubeGeometry(0.3, 0.3, 0.3), cube_material);
		cube.castShadow = true;
		cube.player = true
		cube.score = data.list[i].score;
		cube.position.x = data.list[i].x;
		cube.position.y = data.list[i].y;
		cube.position.z = 0;
		cube.speedZ = 0;
		cube.playerID = data.list[i].id;
		console.log(data.list[i].id)
		players[data.list.id] = cube;
		if (data.list[i].id == data.id){
			cube.special = true;
		}
		scene.add(cube);
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
	cube.speedZ = 0;
	cube.playerID = data.id;
	console.log(data.id)
	players[data.id] = cube;
	scene.add(cube);
	}
});


socket.on('usergone', function(data){
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
//							createjs.Tween.get(node.position).to({x: data[i].x}, 1000/30)
//							createjs.Tween.get(node.position).to({y: data[i].y}, 1000/30)
//							createjs.Tween.get(node.position).to({z: data[i].z}, 1000/30)
							node.position.x = data[i].x;
							node.position.y = data[i].y;
							node.position.z = data[i].z;
					}						
				}
			}
		}
	});
})


socket.on('enemyPositions', function(data){
	scene.traverse(function(node) {
		if (node instanceof THREE.Mesh){
			for (var i in data){
				if (data[i].id === node.enemyID){
						node.position.x = data[i].x;
						node.position.y = data[i].y;
						node.position.z = data[i].z;
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
	coin.cube = true;
	coin.castShadow = true;
	coin.coin = true;
	scene.add(coin);
})

socket.on('coinGrab', function(data){
	console.log(data);
	refreshScoreTable(data);

//	if (score === 25){
//		score = 0;
//		socket.emit('resetGame');
//	}
//	scoretext.innerHTML = "COINS: " + score;
})


socket.on('createEnemies', function(data){
	for (var i in data){
		var enemy = new THREE.Mesh(new THREE.CubeGeometry(0.5, 0.5, 0.5), new THREE.MeshNormalMaterial());
		enemy.castShadow = true;
		enemy.enemy = true;
		enemy.position.x = data[i].x;
		enemy.position.y = data[i].y;
		enemy.position.z = data[i].z;
		enemy.enemyID = data[i].id;
		scene.add(enemy);
	}
});


socket.on('newEnemy', function(data){
	var enemy = new THREE.Mesh(new THREE.CubeGeometry(0.5, 0.5, 0.5), new THREE.MeshNormalMaterial());
	enemy.castShadow = true;
	enemy.enemy = true;
	enemy.position.x = data.x;
	enemy.position.y = data.y;
	enemy.position.z = data.z;
	enemy.enemyID = data.id;
	scene.add(enemy);
})

function refreshScoreTable(data){
	var text = 'SCORES: <br /><br />';
	for (var i in data){
		if (data[i].id === socketId){
			text += data[i].username + ': ' + data[i].score + '<br />'
		}
	}
	for (var i in data){
		if (data[i].id !== socketId){
			text += data[i].username + ': ' + data[i].score + '<br />'
		}
	}
	scoretext.innerHTML = text;
}

socket.on('coinGrabbed', function(data){
//	createjs.Tween.get(coin.position).to({x: data.x}, 1000)
//	createjs.Tween.get(coin.position).to({y: data.y}, 1000)
	coin.position.x = data.x;
	coin.position.y = data.y;
})

var keys = [];
keys.up = false;
keys.left = false;
keys.right = false;
keys.down = false;
keys.jump = false;

socket.on('deleteEnemies', function(data){	
	scene.traverse(function(node) {
		if (node.enemy) {
			setTimeout(function(){
				scene.remove(node);
			}, 1)
		}
	})
})



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
	if (keyCode == 90) {
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
	if (keyCode == 90) {
		scene.traverse(function(node) {
			if (node.special === true){
				if (keys.jump == false && node.position.z == 0){
					node.speedZ = 0.15;
					keys.jump = true;
				}
			}
		})
	}
};

function jumping() {
	scene.traverse(function(node) {
		if (node instanceof THREE.Mesh){
			if (node.special){
//				node.position.z += node.speed.z * dt;
			}
		}
	});
};


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
	if (coin){
		coin.rotation.z += 0.05 * dt;
	}

	scene.traverse(function(node) {
		if (node.special === true){
			if (keys.left){
				node.position.x = Math.max(node.position.x - 0.05 * dt, -2.4);
			}
			if (keys.right){
				node.position.x = Math.min(node.position.x + 0.05 * dt, 2.4);
			}
			if (keys.down){
				node.position.y = Math.max(node.position.y - 0.05 * dt, -2.4);
			}
			if (keys.up){
				node.position.y = Math.min(node.position.y + 0.05 * dt, 2.4);
			}

			//jumping
			node.position.z += node.speedZ * dt;
			if (node.position.z > 0){
				node.speedZ = node.speedZ - 0.01 * dt;
			}
			if (node.position.z < 0){
				node.position.z = 0;
			}
			socket.emit('changePosition', {x: node.position.x, y: node.position.y, z: node.position.z, id: socketId})
		}
	});

	scene.traverse(function(node) {
		if (node instanceof THREE.Mesh){
			if (node.enemy){
				scene.traverse(function(nodo){
					if (nodo.special === true && getDistance(node, nodo) < 0.4){
						socket.emit('playerDeath', socketId)
						scene.remove(nodo)
					}
				})
			}
		}
	});


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
	update();
	jumping();

//	updateMovement();
};
animate();
