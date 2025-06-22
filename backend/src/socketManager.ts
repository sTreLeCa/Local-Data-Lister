// backend/src/socketManager.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ WebSocket client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
    });
  });

  console.log('Socket.IO initialized.');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};