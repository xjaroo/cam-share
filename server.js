// Minimal WebSocket signaling server for 1-to-1 WebRTC
// Run: npm install && npm start

const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map(); // roomId -> Set(ws)

app.use(express.static(path.join(__dirname, "public")));

function broadcast(roomId, data, except) {
  const peers = rooms.get(roomId) || new Set();
  for (const client of peers) {
    if (client !== except && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

wss.on("connection", (ws) => {
  let joinedRoom = null;

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      return;
    }

    if (data.type === "join" && data.room) {
      joinedRoom = data.room;
      if (!rooms.has(joinedRoom)) rooms.set(joinedRoom, new Set());
      rooms.get(joinedRoom).add(ws);
      console.log(`[join] ${joinedRoom} peers=${rooms.get(joinedRoom).size}`);
      // tell peer how many are in the room
      ws.send(
        JSON.stringify({ type: "joined", peers: rooms.get(joinedRoom).size })
      );
      broadcast(
        joinedRoom,
        { type: "peer-joined", peers: rooms.get(joinedRoom).size },
        ws
      );
      return;
    }

    if (joinedRoom && ["offer", "answer", "ice"].includes(data.type)) {
      broadcast(joinedRoom, data, ws);
    }
  });

  ws.on("close", () => {
    if (joinedRoom && rooms.has(joinedRoom)) {
      rooms.get(joinedRoom).delete(ws);
      if (rooms.get(joinedRoom).size === 0) rooms.delete(joinedRoom);
      else
        broadcast(
          joinedRoom,
          { type: "peer-left", peers: rooms.get(joinedRoom).size },
          null
        );
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server at http://localhost:${PORT}`));
