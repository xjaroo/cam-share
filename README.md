# WebRTC Cam Share (Tech ↔ Supervisor)

Minimal one-to-one live video + two-way audio in the browser using WebRTC.

## Quick start

1) Install Node.js 18+
2) In this folder:
   ```bash
   npm init -y
   npm i express ws
   node server.js
   ```
3) Open http://localhost:3000 in two browsers/devices.
4) Enter the same **Room ID** on both sides.
   - Technician clicks **Start as Tech**
   - Supervisor clicks **Start as Supervisor**

> Note: Camera/mic require HTTPS in production (or `http://localhost` for local dev). Use a TLS proxy/cert in front of Node for remote use.
