import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "es-module-shims";

const gamePanel = document.getElementById("game-panel");
const startGameButton = document.getElementById("start-game");
const volumeControl = document.getElementById("volume");
const resetGameButton = document.getElementById("reset-game");
const homeButton = document.getElementById("home-button");
let isGameRunning = false; // Flag to track if the game is running

resetGameButton.style.display = "none";
homeButton.style.display = "none";

homeButton.addEventListener("click", () => {
  returnToHome();
});

function returnToHome() {
  resetGame();
  gamePanel.style.display = "block"; // Show the game panel
  resetGameButton.style.display = "none"; // Hide the reset button
  homeButton.style.display = "none"; // Hide the home button
  isGameRunning = false; // Set game state to stopped
}

resetGameButton.addEventListener("click", () => {
  resetGame();
});

function resetGame() {
  // Reset cube position and velocity to initial state
  cube.position.set(0, 0, 0); // Cube position reset
  cube.velocity = { x: 0, y: -0.01, z: 0 }; // Cube velocity reset to stop movement

  // Reset key states to prevent unintended movement
  keys.a.pressed = false;
  keys.d.pressed = false;
  keys.s.pressed = false;
  keys.w.pressed = false;

  // Clear enemies
  enemies.forEach((enemy) => {
    scene.remove(enemy);
  });
  enemies.length = 0;

  // Reset other variables
  frames = 0;
  spawnRate = 200;

  // Restart the game loop if not running
  if (!isGameRunning) {
    isGameRunning = true;
    animate(); // Start the game loop
  }
}

let gameStarted = false; // Added flag to track if the game has started

startGameButton.addEventListener("click", () => {
  gamePanel.style.display = "none"; // Hide the game panel
  resetGameButton.style.display = "block"; // Show reset button
  homeButton.style.display = "block"; // Show home button
  isGameRunning = true; // Set game to running state
  animate(); // Start the game loop
});

volumeControl.addEventListener("input", (event) => {
  const volume = event.target.value;
  console.log(`Volume set to: ${volume}`);
  // Adjust game audio here if necessary
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
//camera.position.set(4.61, 2.74, 8);X Y Z

camera.position.set(0, 2.74, 8);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

class Box extends THREE.Mesh {
  constructor({
    width,
    height,
    depth,
    color = "#00ff00",
    velocity = {
      x: 0,
      y: 0,
      z: 0,
    },
    position = {
      x: 0,
      y: 0,
      z: 0,
    },
    zAcceleration = false,
  }) {
    super(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshStandardMaterial({ color })
    );

    this.width = width;
    this.height = height;
    this.depth = depth;

    this.position.set(position.x, position.y, position.z);

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;

    this.velocity = velocity;
    this.gravity = -0.002;

    this.zAcceleration = zAcceleration;
  }

  updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2;
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth / 2;
    this.back = this.position.z - this.depth / 2;
  }

  update(ground) {
    this.updateSides();

    if (this.zAcceleration) this.velocity.z += 0.0003;

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
  }

  applyGravity(ground) {
    this.velocity.y += this.gravity;

    // this is where we hit the ground
    if (
      boxCollision({
        box1: this,
        box2: ground,
      })
    ) {
      const friction = 0.5;
      this.velocity.y *= friction;
      this.velocity.y = -this.velocity.y;
    } else this.position.y += this.velocity.y;
  }
}

function boxCollision({ box1, box2 }) {
  const xCollision = box1.right >= box2.left && box1.left <= box2.right;
  const yCollision =
    box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
  const zCollision = box1.front >= box2.back && box1.back <= box2.front;

  return xCollision && yCollision && zCollision;
}

const cube = new Box({
  width: 1,
  height: 1,
  depth: 1,
  velocity: {
    x: 0,
    y: -0.01,
    z: 0,
  },
  position: {
    x: 0, // Keep the X-axis at 0
    y: 0, // Keep the Y-axis at 0
    z: 0, // Move the cube 5 units backward along the Z-axis
  },
});
cube.castShadow = true;
scene.add(cube);

const ground = new Box({
  width: 10,
  height: 0.5,
  depth: 80,
  color: "#0369a1",
  position: {
    x: 0,
    y: -2,
    z: 0,
  },
});

ground.receiveShadow = true;
scene.add(ground);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.y = 3;
light.position.z = 1;
light.castShadow = true;
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

camera.position.z = 5;
console.log(ground.top);
console.log(cube.bottom);

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  w: {
    pressed: false,
  },
};

window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = true;
      break;
    case "KeyD":
      keys.d.pressed = true;
      break;
    case "KeyS":
      keys.s.pressed = true;
      break;
    case "KeyW":
      keys.w.pressed = true;
      break;
    case "Space":
      cube.velocity.y = 0.08;
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyA":
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
    case "KeyS":
      keys.s.pressed = false;
      break;
    case "KeyW":
      keys.w.pressed = false;
      break;
  }
});

const enemies = [];

let frames = 0;
let spawnRate = 200;
function animate() {
  if (!isGameRunning) return; // Exit if the game is not running

  const animationId = requestAnimationFrame(animate);

  renderer.render(scene, camera);

  // Movement code
  cube.velocity.x = 0;
  cube.velocity.z = 0;
  if (keys.a.pressed) cube.velocity.x = -0.05;
  else if (keys.d.pressed) cube.velocity.x = 0.05;

  if (keys.s.pressed) cube.velocity.z = 0.05;
  else if (keys.w.pressed) cube.velocity.z = -0.05;

  cube.update(ground);
  enemies.forEach((enemy, index) => {
    enemy.update(ground);

    // Check for collision
    if (
      boxCollision({
        box1: cube,
        box2: enemy,
      })
    ) {
      cancelAnimationFrame(animationId); // Stop the game
      isGameRunning = false;
      alert("Game Over!"); // Show a game-over message
      resetGameButton.style.display = "block"; // Show reset button
    }
  });

  // Spawn enemies
  if (frames % spawnRate === 0) {
    if (spawnRate > 20) spawnRate -= 20;

    const enemy = new Box({
      width: 1,
      height: 1,
      depth: 1,
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: -40,
      },
      velocity: {
        x: 0,
        y: 0,
        z: 0.005,
      },
      color: "red",
      zAcceleration: true,
    });
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
  }

  frames++;
}

// cube.position.y += -0.01
// cube.rotation.x += 0.01
// cube.rotation.y += 0.01

animate();
