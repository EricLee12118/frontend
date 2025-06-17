// socketHandlers.js
import Validator from '../validators/Validator.js';
import RoomService from '../services/RoomService.js';
import GameService from '../services/GameService.js';
import logger from '../config/logger.js';

export default function initializeSocketHandlers(io, socket, eventBroadcaster) {
    const roomService = new RoomService(io, eventBroadcaster);
    const gameService = new GameService(io, eventBroadcaster);

    logger.info(`用户连接: ${socket.username}(${socket.userId})`);
    eventBroadcaster.broadcastRoomsList();

    // 房间管理事件
    socket.on('join_room', handleJoinRoom);
    socket.on('leave_room', handleLeaveRoom);
    socket.on('send_msg', handleSendMessage);
    socket.on('toggle_ready', handleToggleReady);
    socket.on('add_ai_players', handleAddAIPlayers);
    socket.on('start_game', handleStartGame);
    socket.on('end_game', handleEndGame);
    socket.on('reset_room', handleResetRoom);
    
    // 游戏相关事件
    socket.on('get_role', handleGetRole);
    socket.on('next_round', handleNextRound);
    socket.on('change_phase', handleChangePhase);
    socket.on('player_vote', handlePlayerVote);
    socket.on('seer_check', handleSeerCheck);
    
    // 断开连接事件
    socket.on('disconnect', handleDisconnect);

    // 房间管理处理函数
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
    
    // 游戏处理函数
    function handleGetRole(data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');
        
        const result = gameService.getUserRole(socket.userId, roomId);
        
        if (result.success) {
            socket.emit('role_info', {
                role: result.role,
                position: result.position,
                description: result.description
            });
        } else {
            socket.emit('validation_error', result.message);
        }
    }
    
    function handleNextRound(data) {
        const { roomId } = data;
        if (!roomId) return socket.emit('validation_error', '缺少房间ID');
        
        const result = gameService.nextRound(roomId, socket.userId);
        
        if (!result.success) {
            socket.emit('validation_error', result.message);
        }
    }
    
    function handleChangePhase(data) {
        const { roomId, phase } = data;
        if (!roomId || !phase) return socket.emit('validation_error', '缺少必要参数');
        
        const result = gameService.changePhase(roomId, socket.userId, phase);
        
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
    
    function handleSeerCheck(data) {
        const { roomId, targetId } = data;
        if (!roomId || !targetId) return socket.emit('validation_error', '缺少必要参数');
        
        const result = gameService.seerCheck(roomId, socket.userId, targetId);
        
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