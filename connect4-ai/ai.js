// ai.js

// Initialize the game board state
let state = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, -1, 1, 0, 0],
];

async function getAIMove() {
  try {
    let response = await fetch('http://localhost:5000/get_action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state: state
      })
    });

    let data = await response.json();
    let action = data.action;

    // This function is a placeholder. Implement its logic in main.js
    updateState(action);
  } catch (error) {
    console.error("There was an error fetching the AI's move:", error);
  }
}

async function getAIQValues() {
  try {
      let response = await fetch('http://localhost:5000/get_q_values', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              state: state
          })
      });

      let data = await response.json();
      let qValues = data.q_values;

      // Do something with the Q-values if needed
      // displayQValues(qValues);
  } catch (error) {
      console.error("There was an error fetching the Q-values:", error);
  }
}

// Add this function if you want a way to manually fetch Q-values, otherwise remove it
// button in your HTML: <button onclick="getAIQValues()">Get Q-Values</button>
