const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('A new client Connected!');
    ws.send('Welcome New Client!');

    ws.on('message', (message) => {
        console.log('received: %s', message);
        ws.send(`You : ${message}`);
    });

    ws.on('close', () => console.log('Client has disconnected.'));
});

console.log('WebSocket server is running on ws://localhost:8080');
