const AI_ENDPOINT = "https://connect4-app-service-kooxolstma-lz.a.run.app";

async function getAiMoveAndQValues() {
    let sampleState = [   // This should represent the current board state
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,1,-1,0,0],
        [0,0,0,1,-1,0,0],
        [0,0,0,1,-1,0,0]
    ];
    
    const move = await requestAIEndpoint("/get_action", sampleState);
    const qValues = await requestAIEndpoint("/get_q_values", sampleState);

    document.getElementById("moveResult").innerText = "Move: " + move.action;
    document.getElementById("qValuesResult").innerText = "Q-values: " + qValues.q_values;
}

async function requestAIEndpoint(endpoint, state) {
    try {
        const response = await fetch(AI_ENDPOINT + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                state: state
            })
        });
        return await response.json();
    } catch (error) {
        console.error("There was an error with the request:", error);
        return null;
    }
}