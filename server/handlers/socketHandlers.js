import Validator from '../validators/Validator.js';
import RoomService from '../services/RoomService.js';
import logger from '../config/logger.js';

export default function initializeSocketHandlers(io, socket, eventBroadcaster) {
    const roomService = new RoomService(io, eventBroadcaster);

    logger.info(`用户连接: ${socket.username}(${socket.userId})`);
    eventBroadcaster.broadcastRoomsList();

    socket.on('join_room', handleJoinRoom);
    socket.on('leave_room', handleLeaveRoom);
    socket.on('send_msg', handleSendMessage);
    socket.on('toggle_ready', handleToggleReady);
    socket.on('add_ai_players', handleAddAIPlayers);
    socket.on('start_game', handleStartGame);
    socket.on('end_game', handleEndGame);
    socket.on('reset_room', handleResetRoom);
    socket.on('disconnect', handleDisconnect);

    function handleJoinRoom(data) {
        const { error } = Validator.validateJoinRoom(data);
        if (error) return socket.emit('validation_error', error.details[0].message);

        const result = roomService.joinRoom(socket, data.roomId, data.username);
        
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handleLeaveRoom(data) {
        if (!data.roomId) return;
        roomService.leaveRoom(socket, data.roomId);
    }

    function handleSendMessage(data) {
        const { error } = Validator.validateSendMessage(data);
        if (error) return socket.emit('validation_error', error.details[0].message);

        const result = roomService.sendMessage(socket, data);
        
        if (!result.success) {
            socket.emit('rate_limit', result.message);
        }
    }

    function handleToggleReady(data) {
        const result = roomService.toggleReady(socket, data);
        
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handleAddAIPlayers(data) {
        const result = roomService.addAIPlayers(socket, data);
        
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handleStartGame(data) {
        const result = roomService.startGame(socket, data);
        
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handleEndGame(data) {
        const result = roomService.endGame(socket, data);
        
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handleResetRoom(data) {
        const result = roomService.resetRoom(socket, data);
        
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handleDisconnect() {
        logger.info(`用户断开连接: ${socket.username}(${socket.userId})`);
        
        if (socket.roomId) {
            roomService.leaveRoom(socket, socket.roomId);
        }
        
        eventBroadcaster.broadcastRoomsList();
    }
}