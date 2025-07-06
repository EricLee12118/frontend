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
        const { error } = Validator.validateSendMessage(data);
        if (error) return socket.emit('validation_error', error.details[0].message);

        const result = this.roomService.sendMessage(socket, data);
        if (!result.success) socket.emit('rate_limit', result.message);
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
            this.gameService.printRoleAssignments(data.roomId);
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