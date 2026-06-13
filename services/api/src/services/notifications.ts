import type { Server as HttpServer } from 'http';

let io: any = null;

export function initRealtime(httpServer: HttpServer) {
  try {
    // Optional runtime dependency for production images. The API still builds when Socket.IO is not installed locally.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Server } = require('socket.io');
    io = new Server(httpServer, { cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173', credentials: true } });
    io.on('connection', (socket: any) => {
      const userId = String(socket.handshake.auth?.userId ?? socket.handshake.query?.userId ?? '');
      if (userId) socket.join(`user:${userId}`);
    });
    return io;
  } catch {
    console.warn('Socket.IO package is unavailable; realtime notifications are disabled in this environment.');
    return null;
  }
}

export function emitUserNotification(userId: string, notification: unknown) {
  io?.to(`user:${userId}`).emit('notification', notification);
}
