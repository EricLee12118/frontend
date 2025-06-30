// handlers/socketHandlers.js
import Validator from '../validators/Validator.js';
import RoomService from '../services/RoomService.js';
import GameService from '../services/GameService.js';
import logger from '../config/logger.js';

export default function initializeSocketHandlers(io, socket, eventBroadcaster) {
    const roomService = new RoomService(io, eventBroadcaster);
    const gameService = new GameService(io, eventBroadcaster);

    logger.info(`用户连接: ${socket.username}(${socket.userId})`);
    eventBroadcaster.broadcastRoomsList();

    registerRoomEvents();
    registerGameEvents();
    registerDisconnectEvent();

    function registerRoomEvents() {
        socket.on('join_room', handleJoinRoom);
        socket.on('leave_room', handleLeaveRoom);
        socket.on('send_msg', handleSendMessage);
        socket.on('toggle_ready', handleToggleReady);
        socket.on('add_ai_players', handleAddAIPlayers);
        socket.on('start_game', handleStartGame);
        socket.on('end_game', handleEndGame);
        socket.on('reset_room', handleResetRoom);
    }

    function registerGameEvents() {
        socket.on('get_role', handleGetRole);
        socket.on('force_next_phase', handleForceNextPhase);
        socket.on('restart_game', handleRestartGame);
        socket.on('player_vote', handlePlayerVote);
        socket.on('werewolf_vote', handleWerewolfVote);
        socket.on('seer_check', handleSeerCheck);
        socket.on('witch_action', handleWitchAction);
        socket.on('hunter_shoot', handleHunterShoot);
        socket.on('skip_action', handleSkipAction);
    }

    function registerDisconnectEvent() {
        socket.on('disconnect', handleDisconnect);
    }

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
        } else {
            gameService.printRoleAssignments(data.roomId);
            setTimeout(() => {
                gameService.startNightPhase(data.roomId);
            }, 3000);
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

    function handleGetRole(data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');

        const result = gameService.getUserRoleInfo(socket.userId, roomId);
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

    function handleForceNextPhase(data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');

        const result = gameService.forceNextPhase(roomId, socket.userId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handleRestartGame(data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');

        const result = gameService.restartGame(roomId, socket.userId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }

    function handlePlayerVote(data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = gameService.playerVote(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } else {
            socket.emit('vote_success', { message: '投票成功' });
        }
    }

    function handleWerewolfVote(data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = gameService.werewolfVote(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } else {
            socket.emit('action_success', { message: '狼人投票成功' });
        }
    }

    function handleSeerCheck(data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = gameService.seerCheck(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } else {
            socket.emit('action_success', { message: '预言家查验成功' });
        }
    }

    function handleWitchAction(data) {
        const { roomId, action, targetId } = data;
        if (!roomId || !action) return socket.emit('validation_error', '缺少必要参数');

        const result = gameService.witchAction(roomId, socket.userId, action, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } else {
            socket.emit('action_success', { message: '女巫行动成功' });
        }
    }

    function handleHunterShoot(data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');

        const result = gameService.hunterShoot(roomId, socket.userId, targetId);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } else {
            socket.emit('action_success', { message: '猎人技能使用成功' });
        }
    }

    function handleSkipAction(data) {
        const { roomId, actionType } = data;
        if (!roomId || !actionType) return socket.emit('validation_error', '缺少必要参数');

        const result = gameService.skipAction(roomId, socket.userId, actionType);
        if (!result.success) {
            socket.emit('validation_error', result.message);
        } else {
            socket.emit('action_success', { message: '已跳过行动' });
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