import RoomHandlers from './roomHandlers.js';
import GameHandlers from './gameHandlers.js';
import logger from '../config/logger.js';

export default function initializeSocketHandlers(io, socket, eventBroadcaster) {
    const roomHandlers = new RoomHandlers(io, eventBroadcaster);
    const gameHandlers = new GameHandlers(io, eventBroadcaster);

    logger.info(`用户连接: ${socket.username}(${socket.userId})`);
    eventBroadcaster.broadcastRoomsList();

    // 房间事件
    socket.on('join_room', roomHandlers.handleJoinRoom.bind(roomHandlers, socket));
    socket.on('leave_room', roomHandlers.handleLeaveRoom.bind(roomHandlers, socket));
    socket.on('send_msg', roomHandlers.handleSendMessage.bind(roomHandlers, socket));
    socket.on('toggle_ready', roomHandlers.handleToggleReady.bind(roomHandlers, socket));
    socket.on('add_ai_players', roomHandlers.handleAddAIPlayers.bind(roomHandlers, socket));
    socket.on('start_game', roomHandlers.handleStartGame.bind(roomHandlers, socket));
    socket.on('end_game', roomHandlers.handleEndGame.bind(roomHandlers, socket));
    socket.on('reset_room', roomHandlers.handleResetRoom.bind(roomHandlers, socket));

    // 游戏事件
    socket.on('get_role', gameHandlers.handleGetRole.bind(gameHandlers, socket));
    socket.on('force_next_phase', gameHandlers.handleForceNextPhase.bind(gameHandlers, socket));
    socket.on('restart_game', gameHandlers.handleRestartGame.bind(gameHandlers, socket));
    socket.on('player_vote', gameHandlers.handlePlayerVote.bind(gameHandlers, socket));
    socket.on('werewolf_vote', gameHandlers.handleWerewolfVote.bind(gameHandlers, socket));
    socket.on('seer_check', gameHandlers.handleSeerCheck.bind(gameHandlers, socket));
    socket.on('witch_action', gameHandlers.handleWitchAction.bind(gameHandlers, socket));
    socket.on('hunter_shoot', gameHandlers.handleHunterShoot.bind(gameHandlers, socket));
    socket.on('skip_action', gameHandlers.handleSkipAction.bind(gameHandlers, socket));

    // 断开连接
    socket.on('disconnect', () => {
        logger.info(`用户断开连接: ${socket.username}(${socket.userId})`);
        if (socket.roomId) roomHandlers.handleLeaveRoom(socket, { roomId: socket.roomId });
        eventBroadcaster.broadcastRoomsList();
    });
}