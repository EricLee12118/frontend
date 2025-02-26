import GlobalState from '../models/GlobalState.js';
import RoomFactory from '../models/RoomFactory.js';
import Validator from '../validators/Validator.js';
import logger from '../config/logger.js';

export default function initializeSocketHandlers(io, socket, eventBroadcaster) {
    const globalState = GlobalState.getInstance();

    logger.info(`用户连接: ${socket.username}(${socket.userId})`);
    eventBroadcaster.broadcastRoomsList();

    socket.on('join_room', handleJoinRoom);
    socket.on('send_msg', handleSendMessage);
    socket.on('leave_room', handleLeaveRoom);
    socket.on('disconnect', handleDisconnect);

    function handleJoinRoom(data) {
        const { error } = Validator.validateJoinRoom(data);
        if (error) return socket.emit('validation_error', error.details[0].message);

        const { username, roomId } = data;

        if (socket.roomId === roomId) return;

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
    }

    function handleSendMessage(data) {
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
    }

    function handleLeaveRoom(data) {
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
    }

    function handleDisconnect() {
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
    }
}