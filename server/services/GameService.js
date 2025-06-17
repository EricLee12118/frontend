// services/GameService.js
import GlobalState from '../models/GlobalState.js';

class GameService {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
    }

    // 获取用户的角色信息
    getUserRole(userId, roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        const role = room.getUserRole(userId);
        if (!role) {
            return { success: false, message: '未找到用户角色' };
        }

        return { 
            success: true, 
            role, 
            position: room.game.getUserPosition(userId),
            description: room.game.getRoleDescription(role)
        };
    }

    getAllRoles(roomId, requesterId) {
        const room = this.globalState.getRoom(roomId);
        if (!room) {
            return { success: false, message: '房间不存在' };
        }

        if (room.creatorId !== requesterId) {
            return { success: false, message: '只有房主可以查看所有角色' };
        }

        return { 
            success: true, 
            roles: room.game.roleAssignments 
        };
    }

    // 进入下一轮游戏
    nextRound(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.creatorId !== userId) {
            return { success: false, message: '只有房主可以进入下一轮' };
        }

        room.game.round++;
        
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, `游戏进入第 ${room.game.round} 轮`);

        return { success: true, round: room.game.round };
    }

    // 改变游戏阶段
    changePhase(roomId, userId, phase) {
        const validPhases = ['day', 'night', 'vote', 'discussion'];
        if (!validPhases.includes(phase)) {
            return { success: false, message: '无效的游戏阶段' };
        }

        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.creatorId !== userId) {
            return { success: false, message: '只有房主可以改变游戏阶段' };
        }

        room.game.currentPhase = phase;
        
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, `游戏进入${this.getPhaseDescription(phase)}阶段`);

        return { success: true, phase };
    }

    // 获取游戏阶段描述
    getPhaseDescription(phase) {
        const descriptions = {
            day: '白天',
            night: '夜晚',
            vote: '投票',
            discussion: '讨论'
        };
        
        return descriptions[phase] || phase;
    }

    // 玩家投票
    playerVote(roomId, voterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.game.currentPhase !== 'vote') {
            return { success: false, message: '当前不是投票阶段' };
        }

        // 检查投票者和目标是否在房间中
        if (!room.getUser(voterId) || !room.getUser(targetId)) {
            return { success: false, message: '投票者或目标不在房间中' };
        }

        // 记录这次投票
        if (!room.game.votes) {
            room.game.votes = {};
        }
        room.game.votes[voterId] = targetId;

        // 广播投票结果（但不透露具体谁投给谁，只显示已投票的人数）
        const votesCount = Object.keys(room.game.votes).length;
        this.eventBroadcaster.broadcastSystemMessage(roomId, `已有 ${votesCount} 人完成投票`);

        return { success: true, message: '投票成功' };
    }

    // 预言家查看玩家身份
    seerCheck(roomId, seerId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        // 检查是否是夜晚
        if (room.game.currentPhase !== 'night') {
            return { success: false, message: '预言家只能在夜晚使用技能' };
        }

        // 检查使用者是否是预言家
        const seerRole = room.getUserRole(seerId);
        if (seerRole !== 'seer') {
            return { success: false, message: '只有预言家可以使用此技能' };
        }

        // 获取目标身份
        const targetRole = room.getUserRole(targetId);
        if (!targetRole) {
            return { success: false, message: '目标不在游戏中' };
        }

        // 向预言家发送查看结果
        const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(seerId));
        if (socket) {
            const isBadRole = targetRole === 'werewolf';
            socket.emit('seer_result', {
                target: room.getUser(targetId).username,
                isBad: isBadRole,
                role: targetRole
            });
        }

        return { success: true, message: '已查看目标身份' };
    }

    // 广播游戏状态
    broadcastGameStatus(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room) {
            return { success: false, message: '房间不存在' };
        }

        this.eventBroadcaster.broadcastGameState(roomId);
        return { success: true };
    }

    printRoleAssignments(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }
        
        const assignments = [];
        
        // 遍历所有用户和他们的角色
        Object.entries(room.game.roleAssignments).forEach(([userId, role]) => {
            const user = room.getUser(userId);
            if (!user) return;
            
            let roleEmoji = '👤';
            
            // 添加角色对应的表情
            switch(role) {
                case 'werewolf':
                    roleEmoji = '🐺';
                    break;
                case 'villager':
                    roleEmoji = '👨‍🌾';
                    break;
                case 'seer':
                    roleEmoji = '👁️';
                    break;
                case 'witch':
                    roleEmoji = '🧙‍♀️';
                    break;
            }
            
            assignments.push({
                username: user.username,
                userId: user.userId,
                role: role,
                emoji: roleEmoji,
                isAI: user.isAI
            });
        });
        
        // 创建格式化的输出字符串
        let output = '🎮 角色分配结果:\n';
        output += '------------------------\n';
        
        assignments.forEach(assignment => {
            output += `${assignment.emoji} ${assignment.username}${assignment.isAI ? ' (AI)' : ''}: ${assignment.role}\n`;
        });
        
        output += '------------------------\n';
        output += `总计: ${assignments.length} 名玩家\n`;
        output += `狼人: ${assignments.filter(a => a.role === 'werewolf').length} 名\n`;
        output += `平民: ${assignments.filter(a => a.role === 'villager').length} 名\n`;
        output += `预言家: ${assignments.filter(a => a.role === 'seer').length} 名\n`;
        output += `女巫: ${assignments.filter(a => a.role === 'witch').length} 名\n`;
        
        // 将角色分配结果添加到游戏频道
        room.addMessage('game', {
            id: Date.now().toString(),
            content: output,
            sender: 'system',
            timestamp: new Date().toISOString(),
            type: 'role_assignment'
        });
        
        // 广播消息到游戏频道
        this.io.to(roomId).emit('game_message', {
            content: output,
            timestamp: new Date().toISOString(),
            type: 'role_assignment'
        });
        
        return { success: true, output };
    }
}

export default GameService;