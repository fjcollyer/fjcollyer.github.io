const API_ENDPOINT = "https://connect4-app-service-kooxolstma-lz.a.run.app";
const board = Array(6).fill(null).map(() => Array(7).fill(0));

let currentPlayer;
let isUsersTurn;
let firstPlayer = "user"; // Alternate between "user" and "ai" to change who goes first
let bestAiAction = null;

function startGame() {
    resetQValuesDisplay();
    if (firstPlayer === "ai") {
        firstPlayer = "user";
    } else {
        firstPlayer = "ai";
    }
    bestAiAction = null;
    for (let row of board) {
        for (let i = 0; i < row.length; i++) {
            row[i] = 0;
        }
    }
    if (firstPlayer === "ai") {
        currentPlayer = 1;
        isUsersTurn = false;
        updateQValues(); // also enables the aiMove button
    }
    else if (firstPlayer === "user"){
        currentPlayer = -1;
        isUsersTurn = true;
        document.getElementById("aiMove").disabled = true;
        updateTurnMessage();
    }
    renderBoard();
}

function updateQValues() {
    // Display the status 
    const statusMessageElement = document.getElementById("statusText");
    statusMessageElement.innerHTML = 'AI evaluating position <span style="font-size: 0.5em; display: inline-block; vertical-align: middle;">🔄</span>';

    fetch(`${API_ENDPOINT}/get_q_values`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://fjcollyer.github.io/'

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

        // Update the bestAiAction to be used in the aiMove function
        bestAiAction = maxIndex;

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
        // Set the aiMove button to enabled after the Q-values are updated 
        document.getElementById("aiMove").disabled = false;
        updateTurnMessage();
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
}

document.querySelector('.board').addEventListener('click', (event) => {
    if (!isUsersTurn) return;  // Prevents player from making a move if it's not their turn

    // Check if the clicked target is a valid cell
    if (!event.target.classList.contains('empty') && 
        !event.target.classList.contains('ai') && 
        !event.target.classList.contains('player')) {
        return;
    }

    const column = [...event.target.parentElement.children].indexOf(event.target);
    for (let i = 5; i >= 0; i--) {
        if (board[i][column] === 0) {
            board[i][column] = -1;
            if (hasGameEnded(board)) {
                isUsersTurn = false;
                document.getElementById("aiMove").disabled = true;
                const statusMessageElement = document.getElementById("statusText");
                statusMessageElement.textContent = "Game Over!";
                renderBoard();
                return;
            }
            isUsersTurn = false;  // Set it to AI's turn
            updateTurnMessage();
            updateQValues(); // also sets the aiMove button to enabled
            renderBoard(); // Last thing to do is render the board
            return;
        }
    }
});

function performAiMove() {
    if (isUsersTurn || bestAiAction === null) return;  // Prevents AI from making a move if it's not its turn or there's no stored action
    resetQValuesDisplay();

    // Display the status
    const statusMessageElement = document.getElementById("statusText");
    statusMessageElement.innerHTML = 'AI is making a move <span style="font-size: 0.5em; display: inline-block; vertical-align: middle;">🔄</span>';


    console.log("AI's turn, passing it this board:");
    // make copy of board for logging purposes
    let boardCopy = [];
    for (let i = 0; i < board.length; i++) {
        boardCopy[i] = board[i].slice();
    }
    console.log(boardCopy);

    // Use the best action we stored
    const action = bestAiAction;

    let moveMade = false;

    for (let i = 5; i >= 0; i--) {
        if (board[i][action] === 0) {
            board[i][action] = 1;
            moveMade = true;
            break;
        }
    }

    if (!moveMade) {
        isUsersTurn = false;
        document.getElementById("aiMove").disabled = true;
        const statusMessageElement = document.getElementById("statusText");
        statusMessageElement.textContent = "Game Over! AI made an invalid move.";
        renderBoard();
        return;
    }

    if (hasGameEnded(board)) {
        isUsersTurn = false;
        document.getElementById("aiMove").disabled = true;
        const statusMessageElement = document.getElementById("statusText");
        statusMessageElement.textContent = "Game Over!";
        renderBoard();
        return;
    }
    // Reset the bestAiAction
    bestAiAction = null;

    isUsersTurn = true;  // Set it back to player's turn
    document.getElementById("aiMove").disabled = true;
    // Uupdate the turn message once data is processed
    updateTurnMessage();
    renderBoard();
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
    const statusMessageElement = document.getElementById("statusText");
    if (!statusMessageElement) {
        console.log("No status message element found");
        return;
    }
    if (isUsersTurn) {
        statusMessageElement.textContent = "Your turn!";
    } else {
        statusMessageElement.textContent = "AI's turn!";
    }
}

startGame(firstPlayer);