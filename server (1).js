import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;

// 1. Create HTTP server reading ./public/index.html
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// 2. Create WebSocketServer
const wss = new WebSocketServer({ server });

// Helper to broadcast to all clients
function broadcast(data) {
  const messageString = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(messageString);
    }
  });
}

// 3. Register connection listener
wss.on('connection', (socket, req) => {
  // 4. Parse username from query string
  const username = new URL(req.url, "http://localhost").searchParams.get("username");
  
  broadcast({ type: "system", text: `${username} joined` });

  // 5. Register message listener
  socket.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      broadcast({ type: 'chat', username: parsed.username, text: parsed.text });
    } catch (e) {
      console.error('Invalid JSON');
    }
  });

  // 6. Register close listener
  socket.on('close', () => {
    broadcast({ type: 'system', text: `${username} left` });
  });
});

// 7. Start server and log the exact required string
server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});