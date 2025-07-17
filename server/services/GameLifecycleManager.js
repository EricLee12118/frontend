export default class GameLifecycleManager {
    constructor(io, eventBroadcaster, globalState, timerManager, phaseManager) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = globalState;
        this.timerManager = timerManager;
        this.phaseManager = phaseManager;
    }

    async endGame(roomId, winner, message) {
        const room = this.globalState.getRoom(roomId);
        if (!room) return;

        this.timerManager.clearAllTimers(roomId);
        room.endGame();

        this.eventBroadcaster.broadcastSystemMessage(roomId, message);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏结束！房间已重置，可以开始新游戏。');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        logger.info(`房间 ${roomId} 游戏结束，胜者: ${winner}`);
    }
    
    restartGame(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || room.creatorId !== userId) {
            return { success: false, message: '权限不足' };
        }

        this.timerManager.clearAllTimers(roomId);
        room.game.reset();
        room.users.forEach(user => user.clearRole());
        room.game.assignRoles();
        room.game.start();

        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏重新开始！');
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        setTimeout(() => this.phaseManager.nightManager.startNightPhase(roomId), 3000);
        return { success: true };
    }
    
    forceNextPhase(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive || room.creatorId !== userId) {
            return { success: false, message: '权限不足' };
        }

        switch (room.game.state.currentPhase) {
            case 'night': 
                this.phaseManager.nightManager.finishNightPhase(roomId); 
                break;
            case 'day': 
                this.phaseManager.voteManager.startVotePhase(roomId); 
                break;
            case 'vote': 
                this.phaseManager.voteManager.finishVotePhase(roomId); 
                break;
            default: return { success: false, message: '当前阶段无法强制跳过' };
        }

        return { success: true };
    }
}