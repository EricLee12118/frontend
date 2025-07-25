import GameService from '../services/GameService.js';
import logger from '../config/logger.js';

export default class GameHandlers {
    constructor(io, eventBroadcaster) {
        this.gameService = new GameService(io, eventBroadcaster);
    }

    handleGetRole(socket, data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');

        const result = this.gameService.getUserRoleInfo(socket.userId, roomId);
        if (result.success) {
            socket.emit('role_info', {
                role: result.role,
                position: result.position,
                description: result.description
            });
            logger.debug(`用户 ${socket.username} 获取角色信息: ${result.role}, 位置: ${result.position}`);
        } else {
            socket.emit('validation_error', result.message);
        }
    }

    handleForceNextPhase(socket, data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');

        const result = this.gameService.forceNextPhase(roomId, socket.userId);
        if (!result.success) socket.emit('validation_error', result.message);
    }

    handleRestartGame(socket, data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');

        const result = this.gameService.restartGame(roomId, socket.userId);
        if (!result.success) socket.emit('validation_error', result.message);
    }

    handlePlayerVote(socket, data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = this.gameService.playerVote(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } 
    }

    handleWerewolfVote(socket, data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = this.gameService.werewolfVote(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } 
    }

    handleSeerCheck(socket, data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = this.gameService.seerCheck(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } 
    }

    handleWitchAction(socket, data) {
        const { roomId, action, targetId } = data;
        if (!roomId || !action) return socket.emit('validation_error', '缺少必要参数');

        const result = this.gameService.witchAction(roomId, socket.userId, action, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } 
    }

    handleHunterShoot(socket, data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = this.gameService.hunterShoot(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } 
    }

    handleSkipAction(socket, data) {
        const { roomId, actionType } = data;
        if (!roomId || !actionType) return socket.emit('validation_error', '缺少必要参数');

        const result = this.gameService.skipAction(roomId, socket.userId, actionType);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } 
    }

    handleEndSpeech(socket, data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');

        const result = this.gameService.endSpeech(roomId, socket.userId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }
}