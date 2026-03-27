const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite Frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. Join Room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // 2. Initial Call Notification ("Ringing")
  socket.on("notify_incoming_call", (data) => {
    // Sends to the receiver's room
    socket.to(data.to).emit("incoming_call_request", {
      from: data.from,
      fromName: data.fromName,
      roomId: data.roomId
    });
  });

  // 🟢 NEW: Reject Call (Sender needs to know the user declined)
  socket.on("reject_call", (data) => {
    socket.to(data.room).emit("call_rejected", { message: "User declined the call" });
  });

  // 3. WebRTC Signaling: Offer
  socket.on("send_offer", (data) => {
    socket.to(data.room).emit("receive_offer", data.offer);
  });

  // 4. WebRTC Signaling: Answer
  socket.on("send_answer", (data) => {
    socket.to(data.room).emit("receive_answer", data.answer);
  });

  // 5. WebRTC Signaling: ICE Candidates
  socket.on("ice_candidate", (data) => {
    socket.to(data.room).emit("receive_ice_candidate", data.candidate);
  });

  // 🟢 NEW: End Call / Hang Up
  socket.on("end_call", (data) => {
    console.log(`Ending call in room: ${data.room}`);
    socket.to(data.room).emit("call_ended");
    socket.leave(data.room); // Cleanup
  });

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`✅ SIGNALING SERVER RUNNING ON PORT ${PORT}`);
});