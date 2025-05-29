import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';

export default function authMiddleware(io) {
    return (socket, next) => {
        const { userId, username, userAvatar } = socket.handshake.auth;
        if (!userId || !username) return next(new Error("未授权"));

        const globalState = GlobalState.getInstance();
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
        socket.userAvatar = userAvatar;
        logger.info(`用户 ${username}(${userId}) 已认证`);
        next();
    };
}