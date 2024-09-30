const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Daftar klien yang terhubung dengan ID
const clients = new Map();
let clientId = 0;

wss.on('connection', (ws) => {
    // Assign ID unik untuk setiap klien
    const id = clientId++;
    clients.set(ws, id);
    console.log(`Client ${id} connected!`);

    // Kirim pesan sambutan ke klien baru
    ws.send(JSON.stringify({ type: 'welcome', id: id, message: 'Welcome New Client!' }));

    // Tangani pesan yang diterima dari klien
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            const clientId = clients.get(ws); // Ambil ID klien

            console.log(`Received message from client ${clientId}: ${message.text}`);
            
            // Kirim pesan ke semua klien kecuali pengirim, sertakan ID klien
            clients.forEach((id, client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ id: clientId, message: message.text }));
                }
            });
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    // Tangani penutupan koneksi
    ws.on('close', () => {
        const id = clients.get(ws);
        clients.delete(ws);
        console.log(`Client ${id} has disconnected.`);
    });

    // Tangani kesalahan
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
