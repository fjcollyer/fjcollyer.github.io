// main.js

// Constants for game logic
const COLUMNS = 7;
const ROWS = 6;
const PIECE_RADIUS = 6;
const BOARD_OFFSET = new THREE.Vector3(-49.8, 21, -52);
const DISTANCE_BETWEEN_PIECES = new THREE.Vector3(16.65, 13.68, 0);
const dropSpeed = 4;
const DROP_HEIGHT = 100;

// Game state
let board = Array(COLUMNS).fill().map(() => Array(ROWS).fill(null));
let currentColor = new THREE.Color(0xff0000);
let activePieces = [];
let gameRunning = true;

// Basic three.js setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 100, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
pointLight.position.set(0, 50, 50);
scene.add(pointLight);

let controls;

const loader = new THREE.GLTFLoader();
loader.load(
  'models/connect4.gltf',
  function (gltf) {
    gltf.scene.traverse(function(node) {
      if (node.isMesh) {
        node.material = new THREE.MeshStandardMaterial({
          color: 0xC0C0C0, // Silver
          metalness: 0.8, 
          roughness: 0.2
        });
      }
    });

    scene.add(gltf.scene);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(gltf.scene.position.x, gltf.scene.position.y, gltf.scene.position.z);
  },
  function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    console.log('An error happened', error);
  }
);

// Before using in onMouseClick
let mouse = new THREE.Vector2();
let raycaster = new THREE.Raycaster();
function onMouseClick(event) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(buttonGroup.children);

  for (let i = 0; i < intersects.length; i++) {
    // Call the dropPiece function with the cube's column number
    dropPiece(intersects[i].object.userData.column);
  }
}
window.addEventListener('click', onMouseClick, false);

// Create a group for all buttons
const buttonGroup = new THREE.Group();

// Create the 3D object cube buttons
for (let i = 0; i < COLUMNS; i++) {
  const geometry = new THREE.BoxGeometry(10, 10, 10);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cubeButton = new THREE.Mesh(geometry, material);
  cubeButton.position.x = BOARD_OFFSET.x + i * DISTANCE_BETWEEN_PIECES.x;
  cubeButton.position.y = BOARD_OFFSET.y + DROP_HEIGHT; // Above the board
  cubeButton.position.z = BOARD_OFFSET.z + 3 * DISTANCE_BETWEEN_PIECES.z;
  cubeButton.userData = { column: i }; // Store column number in the cube's userData
  buttonGroup.add(cubeButton);
}
scene.add(buttonGroup);

let drops = Array(COLUMNS).fill(0);

// Check for a win condition
function checkWin() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      if (board[col][row] !== null) {
        let color = board[col][row].material.color;

        // Check horizontal
        if (col <= COLUMNS - 4 && 
            board[col+1][row] !== null && color.equals(board[col+1][row].material.color) && 
            board[col+2][row] !== null && color.equals(board[col+2][row].material.color) && 
            board[col+3][row] !== null && color.equals(board[col+3][row].material.color)) {
          return true;
        }

        // Check vertical
        if (row <= ROWS - 4 && 
            board[col][row+1] !== null && color.equals(board[col][row+1].material.color) && 
            board[col][row+2] !== null && color.equals(board[col][row+2].material.color) && 
            board[col][row+3] !== null && color.equals(board[col][row+3].material.color)) {
          return true;
        }

        // Check diagonal /
        if (col <= COLUMNS - 4 && row >= 3 && 
            board[col+1][row-1] !== null && color.equals(board[col+1][row-1].material.color) && 
            board[col+2][row-2] !== null && color.equals(board[col+2][row-2].material.color) && 
            board[col+3][row-3] !== null && color.equals(board[col+3][row-3].material.color)) {
          return true;
        }

        // Check diagonal \
        if (col <= COLUMNS - 4 && row <= ROWS - 4 && 
            board[col+1][row+1] !== null && color.equals(board[col+1][row+1].material.color) && 
            board[col+2][row+2] !== null && color.equals(board[col+2][row+2].material.color) && 
            board[col+3][row+3] !== null && color.equals(board[col+3][row+3].material.color)) {
          return true;
        }
      }
    }
  }

  return false;
}


// Drop a piece into a column
function dropPiece(column) {
  if (!gameRunning) {
    alert("Game over! Refresh the page to play again.");
    return;
  }

  // Check if the column is full
  if (drops[column] === ROWS) {
    alert("This column is full!");
    return;
  }

  // Create the new game piece
  const geometry = new THREE.CylinderGeometry(PIECE_RADIUS, PIECE_RADIUS, 1, 32);
  const material = new THREE.MeshBasicMaterial({
    color: currentColor
  });

  const piece = new THREE.Mesh(geometry, material);

  // Calculate the position of the new piece
  piece.position.copy(BOARD_OFFSET);
  piece.position.x += column * DISTANCE_BETWEEN_PIECES.x;
  piece.position.y += DROP_HEIGHT;
  piece.rotation.x = Math.PI / 2;

  // Add the piece to the scene and the active pieces list
  scene.add(piece);
  activePieces.push({ piece, column });

  // Alternate the color for the next piece
  currentColor = currentColor.equals(new THREE.Color(0xff0000)) ? new THREE.Color(0x0000ff) : new THREE.Color(0xff0000); 

  // Update the color of cube buttons
  for(let i = 0; i < buttonGroup.children.length; i++) {
    buttonGroup.children[i].material.color.set(currentColor);
  }
}

// Make dropPiece globally accessible to button onclick handlers
window.dropPiece = dropPiece;

const animate = function () {
  requestAnimationFrame(animate);

  if (controls) {
    controls.update();
  }

  // Move active pieces down
  for (let i = 0; i < activePieces.length; i++) {
    let { piece, column } = activePieces[i];
    let targetY = BOARD_OFFSET.y + drops[column] * DISTANCE_BETWEEN_PIECES.y;
    if (piece.position.y > targetY) {
      piece.position.y -= dropSpeed;
      if (piece.position.y < targetY) {
        piece.position.y = targetY;
      }
    } else {
      // The piece has reached its target position
      board[column][drops[column]] = piece;
      drops[column]++;
      activePieces.splice(i, 1);
      i--;

      if (checkWin()) {
        console.log("Game over!");
        console.log(board);
        alert("Game over! " + (currentColor.equals(new THREE.Color(0xff0000)) ? "Blue" : "Red") + " wins!");
        gameRunning = false;
      }
    }
  }

  renderer.render(scene, camera);
};

animate();
