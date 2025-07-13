import GlobalState from '../models/GlobalState.js';
import PhaseManager from './PhaseManager.js';
import ActionProcessor from './ActionProcessor.js';

export default class GameService {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
        this.phaseManager = new PhaseManager(io, eventBroadcaster);
        this.actionProcessor = new ActionProcessor(io, eventBroadcaster);
    }

    getUserRoleInfo(userId, roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        const roleInfo = room.getUserRoleInfo(userId);
        if (!roleInfo.role) {
            return { success: false, message: '未找到用户角色' };
        }

        return {
            success: true,
            role: roleInfo.role,
            position: roleInfo.position,
            description: room.game.getRoleDescription(roleInfo.role)
        };
    }

    startNightPhase(roomId) {
        return this.phaseManager.startNightPhase(roomId);
    }

    forceNextPhase(roomId, userId) {
        return this.phaseManager.forceNextPhase(roomId, userId);
    }

    restartGame(roomId, userId) {
        return this.phaseManager.restartGame(roomId, userId);
    }

    playerVote(roomId, voterId, targetId) {
        return this.actionProcessor.playerVote(roomId, voterId, targetId);
    }

    werewolfVote(roomId, voterId, targetId) {
        return this.actionProcessor.werewolfVote(roomId, voterId, targetId);
    }

    seerCheck(roomId, seerId, targetId) {
        return this.actionProcessor.seerCheck(roomId, seerId, targetId);
    }

    witchAction(roomId, witchId, action, targetId) {
        return this.actionProcessor.witchAction(roomId, witchId, action, targetId);
    }

    hunterShoot(roomId, hunterId, targetId) {
        return this.actionProcessor.hunterShoot(roomId, hunterId, targetId);
    }

    skipAction(roomId, userId, actionType) {
        return this.actionProcessor.skipAction(roomId, userId, actionType);
    }
}