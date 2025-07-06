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

    printRoleAssignments(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        const assignments = Object.entries(room.game.state.roleAssignments)
            .map(([userId, role]) => {
                const user = room.getUser(userId);
                return user ? {
                    username: user.username,
                    role,
                    emoji: this.getRoleEmoji(role),
                    isAI: user.isAI,
                    position: room.game.state.positionAssignments[userId]
                } : null;
            })
            .filter(Boolean)
            .sort((a, b) => a.position - b.position);

        const output = this.formatRoleAssignments(assignments);
        
        room.addMessage('game', {
            id: Date.now().toString(),
            content: output,
            sender: 'system',
            timestamp: new Date().toISOString(),
            type: 'role_assignment'
        });

        this.io.to(roomId).emit('game_message', {
            content: output,
            timestamp: new Date().toISOString(),
            type: 'role_assignment'
        });

        return { success: true, output };
    }

    getRoleEmoji(role) {
        const emojiMap = {
            werewolf: '🐺', villager: '👨‍🌾', seer: '👁️', witch: '🧙‍♀️', hunter: '🏹'
        };
        return emojiMap[role] || '👤';
    }

    formatRoleAssignments(assignments) {
        let output = '🎮 角色分配结果:\n========================\n';
        assignments.forEach(a => {
            output += `${a.position}号位 ${a.emoji} ${a.username}${a.isAI ? ' (AI)' : ''}: ${a.role}\n`;
        });
        
        const stats = {
            total: assignments.length,
            werewolves: assignments.filter(a => a.role === 'werewolf').length,
            villagers: assignments.filter(a => a.role === 'villager').length,
            seers: assignments.filter(a => a.role === 'seer').length,
            witches: assignments.filter(a => a.role === 'witch').length,
            hunters: assignments.filter(a => a.role === 'hunter').length
        };

        output += `========================\n总计: ${stats.total} 名玩家\n`;
        output += `🐺 狼人: ${stats.werewolves} 名\n👨‍🌾 平民: ${stats.villagers} 名\n`;
        output += `👁️ 预言家: ${stats.seers} 名\n🧙‍♀️ 女巫: ${stats.witches} 名\n🏹 猎人: ${stats.hunters} 名\n`;
        
        return output;
    }
}