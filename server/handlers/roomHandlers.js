import Validator from '../validators/Validator.js';
import RoomService from '../services/RoomService.js';
import GameService from '../services/GameService.js';

export default class RoomHandlers {
    constructor(io, eventBroadcaster) {
        this.roomService = new RoomService(io, eventBroadcaster);
        this.gameService = new GameService(io, eventBroadcaster);
    }

    handleJoinRoom(socket, data) {
        const { error } = Validator.validateJoinRoom(data);
        if (error) return socket.emit('validation_error', error.details[0].message);

        const result = this.roomService.joinRoom(socket, data.roomId, data.username);
        if (!result.success) socket.emit('validation_error', result.message);
    }

    handleLeaveRoom(socket, data) {
        if (!data.roomId) return;
        this.roomService.leaveRoom(socket, data.roomId);
    }

    handleSendMessage(socket, data) {
        const { roomId, message, channel = 'main' } = data;
        if (!roomId || !message) return socket.emit('validation_error', '缺少房间ID或消息内容');

        const room = this.globalState.getRoom(roomId);
        if (!room) return socket.emit('validation_error', '房间不存在');

        if (room?.game.state.isActive && 
            room.game.state.currentPhase === 'day' && 
            channel === 'game') {
            
            if (room.game.state.discussion.currentSpeakerId !== socket.userId) {
                socket.emit('validation_error', '现在不是您的发言时间，请等待轮到您发言');
                return;
            }
        }

        const result = this.roomService.sendMessage(socket.userId, roomId, message, channel);
        
        if (result.success) {
            this.io.to(roomId).emit('receive_msg', result.message);
        } else {
            socket.emit('validation_error', result.message);
        }
    }
    handleToggleReady(socket, data) {
        const result = this.roomService.toggleReady(socket, data);
        if (!result.success) socket.emit('validation_error', result.message);
    }

    handleAddAIPlayers(socket, data) {
        const result = this.roomService.addAIPlayers(socket, data);
        if (!result.success) socket.emit('validation_error', result.message);
    }

    handleStartGame(socket, data) {
        const result = this.roomService.startGame(socket, data);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } else {
            setTimeout(() => this.gameService.startNightPhase(data.roomId), 3000);
        }
    }

    handleEndGame(socket, data) {
        const result = this.roomService.endGame(socket, data);
        if (!result.success) socket.emit('validation_error', result.message);
    }

    handleResetRoom(socket, data) {
        const result = this.roomService.resetRoom(socket, data);
        if (!result.success) socket.emit('validation_error', result.message);
    }
}