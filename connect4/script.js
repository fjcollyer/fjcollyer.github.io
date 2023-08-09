const API_ENDPOINT = "https://connect4-app-service-kooxolstma-lz.a.run.app";
const board = Array(6).fill(null).map(() => Array(7).fill(0));

let currentPlayer;
let isUsersTurn;
let firstPlayer = "user";

function startGame(firstPlayer) {
    for (let row of board) {
        for (let i = 0; i < row.length; i++) {
            row[i] = 0;
        }
    }
    if (firstPlayer === "ai") {
        currentPlayer = 1;
        isUsersTurn = false;
        document.getElementById("aiMove").disabled = false;
        updateQValues();
    }
    else if (firstPlayer === "user"){
        currentPlayer = -1;
        isUsersTurn = true;
        document.getElementById("aiMove").disabled = true;
    }
    updateTurnMessage();
    resetQValuesDisplay();
    renderBoard();
}

function updateQValues() {
    fetch(`${API_ENDPOINT}/get_q_values`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: board })
    })
    .then(response => response.json())
    .then(data => {
        const qValues = data.q_values;
        let maxQValue = -Infinity;
        let minQValue = Infinity;
        let maxIndex = -1;
        let minIndex = -1;

        // Find the highest and lowest Q-values and their indices
        qValues.forEach((value, index) => {
            if (value > maxQValue) {
                maxQValue = value;
                maxIndex = index;
            }
            if (value < minQValue) {
                minQValue = value;
                minIndex = index;
            }
        });

        // Update text and color for each cell
        qValues.forEach((value, index) => {
            const cell = document.querySelector(`[data-col="${index}"]`);
            cell.textContent = value.toFixed(2);
            if (index === maxIndex) {
                cell.style.color = "green";
            } else if (index === minIndex) {
                cell.style.color = "red";
            } else {
                cell.style.color = "black"; // default color for other cells
            }
        });
    });
}

function resetQValuesDisplay() {
  for (let i = 0; i < 7; i++) {
      document.querySelector(`[data-col="${i}"]`).textContent = "-";
  }
}

function renderBoard() {
    for (let i = 0; i < 6; i++) {
        const rowElement = document.querySelector(`.row[data-row="${i}"]`);
        rowElement.innerHTML = '';
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('div');
            if (board[i][j] === 0) {
                cell.className = 'empty';
            } else if (board[i][j] === 1) {
                cell.className = 'ai';
            } else {
                cell.className = 'player';
            }
            rowElement.appendChild(cell);
        }
    }
    checkGameOver();
}

function checkGameOver() {
  if (hasGameEnded(board)) {
      isUsersTurn = false; 
      document.getElementById("aiMove").disabled = true; 
      const statusMessageElement = document.getElementById("statusMessage");
      statusMessageElement.textContent = "Game Over!";
  }
}

document.querySelector('.board').addEventListener('click', (event) => {
    if (!isUsersTurn) return;  // Prevents player from making a move if it's not their turn

    const column = [...event.target.parentElement.children].indexOf(event.target);
    for (let i = 5; i >= 0; i--) {
        if (board[i][column] === 0) {
            board[i][column] = -1;
            isUsersTurn = false;  // Set it to AI's turn
            updateTurnMessage();
            updateQValues();
            document.getElementById("aiMove").disabled = false;
            renderBoard(); // Last thing to do is render the board
            return;
        }
    }
});

function performAiMove() {
    if (isUsersTurn) return;  // Prevents AI from making a move if it's not its turn
    resetQValuesDisplay();
    console.log("AI's turn, passing it this board:");
    // make copy of board for logging purposes
    let boardCopy = [];
    for (let i = 0; i < board.length; i++) {
        boardCopy[i] = board[i].slice();
    }
    console.log(boardCopy);
    fetch(`${API_ENDPOINT}/get_action`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: board, epsilon: 0 })
    })
    .then(response => response.json())
    .then(data => {
        const action = data.action;
        console.log(`AI chose column ${action}`);
        for (let i = 5; i >= 0; i--) {
            if (board[i][action] === 0) {
                board[i][action] = 1;
                break;
            }
        }
        isUsersTurn = true;  // Set it back to player's turn
        updateTurnMessage();
        document.getElementById("aiMove").disabled = true;
        renderBoard();
    });
}

function hasGameEnded(board) {
  return checkHorizontalWin(board) || checkVerticalWin(board) || checkDiagonalWin(board) || checkDraw(board);
}

function checkHorizontalWin(board) {
  for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 4; col++) {
          let cellValue = board[row][col];
          if (cellValue !== 0 &&
              cellValue === board[row][col + 1] &&
              cellValue === board[row][col + 2] &&
              cellValue === board[row][col + 3]) {
              return true;
          }
      }
  }
  return false;
}

function checkVerticalWin(board) {
  for (let col = 0; col < 7; col++) {
      for (let row = 0; row < 3; row++) {
          let cellValue = board[row][col];
          if (cellValue !== 0 &&
              cellValue === board[row + 1][col] &&
              cellValue === board[row + 2][col] &&
              cellValue === board[row + 3][col]) {
              return true;
          }
      }
  }
  return false;
}

function checkDiagonalWin(board) {
  // Check from top-left to bottom-right
  for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
          let cellValue = board[row][col];
          if (cellValue !== 0 &&
              cellValue === board[row + 1][col + 1] &&
              cellValue === board[row + 2][col + 2] &&
              cellValue === board[row + 3][col + 3]) {
              return true;
          }
      }
  }
  
  // Check from top-right to bottom-left
  for (let row = 0; row < 3; row++) {
      for (let col = 3; col < 7; col++) {
          let cellValue = board[row][col];
          if (cellValue !== 0 &&
              cellValue === board[row + 1][col - 1] &&
              cellValue === board[row + 2][col - 2] &&
              cellValue === board[row + 3][col - 3]) {
              return true;
          }
      }
  }
  
  return false;
}

function checkDraw(board) {
  for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
          if (board[row][col] === 0) {
              return false;  // There's still an empty cell
          }
      }
  }
  return true;  // No empty cells found
}

function updateTurnMessage() {
  const statusMessageElement = document.getElementById("statusMessage");
  if (isUsersTurn) {
      statusMessageElement.textContent = "Your turn!";
  } else {
      statusMessageElement.textContent = "AI's turn!";
  }
}

startGame(firstPlayer);