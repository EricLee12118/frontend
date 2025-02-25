import http from 'http';
import { Server } from 'socket.io';
import Joi from 'joi';
import winston from 'winston';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' }),
  ],
});

class GlobalState {
  constructor() {
    if (GlobalState.instance) return GlobalState.instance;
    this.rooms = new Map();
    this.messageHistory = {};
    this.rateLimit = {};
    this.activeUsers = new Map();
    GlobalState.instance = this;
  }
  static getInstance() {
    return GlobalState.instance || new GlobalState();
  }
}

class RoomFactory {
  static createRoom(roomId, creator) {
    return { roomId, creator, createdAt: new Date().toISOString() };
  }
}

class Validator {
  static validateJoinRoom(data) {
    return Joi.object({
      username: Joi.string().min(1).max(50).required(),
      roomId: Joi.string().min(3).max(32).required(),
    }).validate(data);
  }

  static validateSendMessage(data) {
    return Joi.object({
      roomId: Joi.string().min(3).max(32).required(),
      message: Joi.string().max(500).required(),
      sender: Joi.string().min(1).max(50).required(),
      userId: Joi.string().required(),
    }).validate(data);
  }
}

class EventBroadcaster {
  constructor(io) {
    this.io = io;
  }

  broadcastRoomsList() {
    const roomsList = Array.from(GlobalState.getInstance().rooms.values())
      .map(room => {
        const numUsers = this.io.sockets.adapter.rooms.get(room.roomId)?.size || 0;
        return numUsers > 0 ? { roomId: room.roomId, numUsers, creator: room.creator, createdAt: room.createdAt } : null;
      }).filter(Boolean);
    this.io.emit('rooms_list', roomsList);
  }

  broadcastRoomUsers(roomId) {
    const users = Array.from(this.io.sockets.adapter.rooms.get(roomId) || []).map(id => this.io.sockets.sockets.get(id)?.username).filter(Boolean);
    this.io.to(roomId).emit('room_users', users);
  }

  broadcastSystemMessage(roomId, message) {
    const msgData = { sender: '系统', message, timestamp: new Date().toISOString(), isSystem: true };
    const globalState = GlobalState.getInstance();

    globalState.messageHistory[roomId] = globalState.messageHistory[roomId] || [];
    globalState.messageHistory[roomId].push(msgData);
    if (globalState.messageHistory[roomId].length > 100) globalState.messageHistory[roomId].shift();

    this.io.to(roomId).emit('receive_msg', msgData);
  }
}

nextApp.prepare().then(() => {
  const httpServer = http.createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : 'http://172.24.32.171:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const globalState = GlobalState.getInstance();
  const eventBroadcaster = new EventBroadcaster(io);

  io.use((socket, next) => {
    const { userId, username } = socket.handshake.auth;
    if (!userId || !username) return next(new Error("未授权"));

    const existingSocketId = globalState.activeUsers.get(userId);
    if (existingSocketId) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        logger.info(`断开用户 ${userId} 的旧连接`);
        existingSocket.disconnect();
      }
    }

    globalState.activeUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.username = username;
    logger.info(`用户 ${username}(${userId}) 已认证`);
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`用户连接: ${socket.username}(${socket.userId})`);
    eventBroadcaster.broadcastRoomsList();
    
    socket.on('join_room', (data) => {
      const { error } = Validator.validateJoinRoom(data);
      if (error) return socket.emit('validation_error', error.details[0].message);
    
      const { username, roomId } = data;
    
      if (socket.roomId === roomId) {
        return
      }
    
      if (!globalState.rooms.has(roomId)) {
        globalState.rooms.set(roomId, RoomFactory.createRoom(roomId, username));
        logger.info(`房间 "${roomId}" 已创建`);
      }
    
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room && room.size >= 8) return socket.emit('room_full', '此房间已达到最大容量，请尝试加入其他房间。');
    
      if (socket.roomId) {
        socket.leave(socket.roomId);
        eventBroadcaster.broadcastRoomUsers(socket.roomId);
        if (io.sockets.adapter.rooms.get(socket.roomId)?.size === 0) {
          globalState.rooms.delete(socket.roomId);
        }
      }
    
      socket.join(roomId);
      socket.roomId = roomId;
      logger.info(`用户 "${username}" 加入了房间 "${roomId}"`);
    
      eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${username}" 加入了房间`);
      eventBroadcaster.broadcastRoomsList();
      eventBroadcaster.broadcastRoomUsers(roomId);
      if (globalState.messageHistory[roomId]) socket.emit('message_history', globalState.messageHistory[roomId]);
    });

    socket.on('send_msg', (data) => {
      const { error } = Validator.validateSendMessage(data);
      if (error) return socket.emit('validation_error', error.details[0].message);

      const { roomId } = data;
      const sender = socket.username;

      const currentTime = Date.now();
      globalState.rateLimit[socket.id] = (globalState.rateLimit[socket.id] || []).filter(timestamp => currentTime - timestamp < 1000);
      if (globalState.rateLimit[socket.id].length >= 5) return socket.emit('rate_limit', '您发送消息的频率过高，请稍后再试。');

      globalState.rateLimit[socket.id].push(currentTime);
      globalState.messageHistory[roomId] = globalState.messageHistory[roomId] || [];
      globalState.messageHistory[roomId].push({ sender, message: data.message, timestamp: new Date().toISOString() });

      if (globalState.messageHistory[roomId].length > 100) globalState.messageHistory[roomId].shift();
      io.to(roomId).emit('receive_msg', { sender, message: data.message, timestamp: new Date().toISOString(), isSystem: data.isSystem });
      logger.info(`Message from "${sender}" in room "${roomId}": ${data.message}`);
    });

    socket.on('leave_room', (data) => {
      const { roomId } = data;
      if (!roomId) return;
    
      socket.leave(roomId);
      socket.roomId = null;
      logger.info(`用户 "${socket.username}" 离开了房间 "${roomId}"`);
    
      if (io.sockets.adapter.rooms.get(roomId)?.size === 0) {
        globalState.rooms.delete(roomId);
        delete globalState.messageHistory[roomId];
      }
    
      eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${socket.username}" 离开了房间`);
      eventBroadcaster.broadcastRoomsList();
      eventBroadcaster.broadcastRoomUsers(roomId);
    });

    socket.on('disconnect', () => {
      logger.info(`用户断开连接: ${socket.username}(${socket.userId})`);
      globalState.activeUsers.delete(socket.userId);
      const roomId = socket.roomId;

      if (roomId) {
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${socket.username}" 离开了房间`);
        if (roomSize <= 1) {
          globalState.rooms.delete(roomId);
          delete globalState.messageHistory[roomId];
        } else {
          eventBroadcaster.broadcastRoomUsers(roomId);
        }
        socket.roomId = null;
      }
      eventBroadcaster.broadcastRoomsList();
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    logger.info(`Next.js and Socket.io server is running on port ${PORT}`);
  });
});