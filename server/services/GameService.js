import GlobalState from '../models/GlobalState.js';

class GameService {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
    }

    getUserRoleInfo(userId, roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
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

    getAllRoles(roomId, requesterId) {
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };
        if (room.creatorId !== requesterId) return { success: false, message: '只有房主可以查看所有角色' };

        return { 
            success: true, 
            roles: room.game.roleAssignments,
            positions: room.game.positionAssignments
        };
    }

    nextRound(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) return { success: false, message: '游戏未在进行中' };
        if (room.creatorId !== userId) return { success: false, message: '只有房主可以进入下一轮' };

        room.game.round++;
        
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, `游戏进入第 ${room.game.round} 轮`);

        return { success: true, round: room.game.round };
    }

    changePhase(roomId, userId, phase) {
        const validPhases = ['day', 'night', 'vote', 'discussion'];
        if (!validPhases.includes(phase)) return { success: false, message: '无效的游戏阶段' };

        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) return { success: false, message: '游戏未在进行中' };
        if (room.creatorId !== userId) return { success: false, message: '只有房主可以改变游戏阶段' };

        room.game.currentPhase = phase;
        
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, `游戏进入${this.getPhaseDescription(phase)}阶段`);

        return { success: true, phase };
    }

    getPhaseDescription(phase) {
        const descriptions = {
            day: '白天', night: '夜晚', vote: '投票', discussion: '讨论'
        };
        return descriptions[phase] || phase;
    }

    playerVote(roomId, voterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) return { success: false, message: '游戏未在进行中' };
        if (room.game.currentPhase !== 'vote') return { success: false, message: '当前不是投票阶段' };
        if (!room.getUser(voterId) || !room.getUser(targetId)) return { success: false, message: '投票者或目标不在房间中' };

        const votesCount = room.game.recordVote(voterId, targetId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, `已有 ${votesCount} 人完成投票`);

        return { success: true, message: '投票成功' };
    }

    seerCheck(roomId, seerId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) return { success: false, message: '游戏未在进行中' };
        if (room.game.currentPhase !== 'night') return { success: false, message: '预言家只能在夜晚使用技能' };

        const seerInfo = room.getUserRoleInfo(seerId);
        if (seerInfo.role !== 'seer') return { success: false, message: '只有预言家可以使用此技能' };

        const targetInfo = room.getUserRoleInfo(targetId);
        if (!targetInfo.role) return { success: false, message: '目标不在游戏中' };

        const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(seerId));
        if (socket) {
            const target = room.getUser(targetId);
            socket.emit('seer_result', {
                target: target.username,
                position: targetInfo.position,
                isBad: targetInfo.role === 'werewolf',
                role: targetInfo.role
            });
        }

        return { success: true, message: '已查看目标身份' };
    }

    broadcastGameStatus(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };

        this.eventBroadcaster.broadcastGameState(roomId);
        return { success: true };
    }

    printRoleAssignments(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) return { success: false, message: '游戏未在进行中' };
        
        const assignments = [];
        
        // 收集所有角色信息
        Object.entries(room.game.roleAssignments).forEach(([userId, role]) => {
            const user = room.getUser(userId);
            if (!user) return;
            
            const roleEmoji = this.getRoleEmoji(role);
            const position = room.game.positionAssignments[userId];
            
            assignments.push({
                username: user.username,
                userId: user.userId,
                role,
                emoji: roleEmoji,
                isAI: user.isAI,
                position
            });
        });
        
        // 按位置排序
        assignments.sort((a, b) => a.position - b.position);
        
        // 格式化输出
        const output = this.formatRoleAssignments(assignments);
        
        // 广播消息
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
            werewolf: '🐺',
            villager: '👨‍🌾',
            seer: '👁️',
            witch: '🧙‍♀️'
        };
        return emojiMap[role] || '👤';
    }

    formatRoleAssignments(assignments) {
        let output = '🎮 角色分配结果:\n';
        output += '------------------------\n';
        
        assignments.forEach(a => {
            output += `${a.position}号位 ${a.emoji} ${a.username}${a.isAI ? ' (AI)' : ''}: ${a.role}\n`;
        });
        
        const stats = {
            total: assignments.length,
            werewolves: assignments.filter(a => a.role === 'werewolf').length,
            villagers: assignments.filter(a => a.role === 'villager').length,
            seers: assignments.filter(a => a.role === 'seer').length,
            witches: assignments.filter(a => a.role === 'witch').length
        };
        
        output += '------------------------\n';
        output += `总计: ${stats.total} 名玩家\n`;
        output += `狼人: ${stats.werewolves} 名\n`;
        output += `平民: ${stats.villagers} 名\n`;
        output += `预言家: ${stats.seers} 名\n`;
        output += `女巫: ${stats.witches} 名\n`;
        
        return output;
    }
}

export default GameService;