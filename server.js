// Simple WebSocket signaling server for WebRTC rooms
// Run: node server.js

const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map(); // roomId -> Set(ws)

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  let joinedRoom = null;

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'join' && data.room) {
        joinedRoom = data.room;
        if (!rooms.has(joinedRoom)) rooms.set(joinedRoom, new Set());
        rooms.get(joinedRoom).add(ws);
        // acknowledge
        ws.send(JSON.stringify({ type: 'joined', room: joinedRoom }));
        return;
      }

      // relay signaling messages to others in the same room
      if (joinedRoom && ['offer','answer','ice'].includes(data.type)) {
        const peers = rooms.get(joinedRoom) || new Set();
        for (const client of peers) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        }
      }
    } catch (e) {
      console.error('Bad message', e);
    }
  });

  ws.on('close', () => {
    if (joinedRoom && rooms.has(joinedRoom)) {
      rooms.get(joinedRoom).delete(ws);
      if (rooms.get(joinedRoom).size === 0) rooms.delete(joinedRoom);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling + static server running at http://localhost:${PORT}`);
});
