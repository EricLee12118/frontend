import logger from '../config/logger.js';

class Game {
    constructor(room) {
        this.room = room;
        this.isActive = false;
        this.startTime = null;
        this.endTime = null;
        this.round = 0;
        this.currentPhase = null;
        this.roleAssignments = {};
        this.positionAssignments = {};
        this.votes = {};
        this.settings = {
            werewolves: 3,
            villagers: 3,
            seer: 1,
            witch: 1
        };
    }

    start() {
        this.isActive = true;
        this.startTime = new Date().toISOString();
        this.round = 1;
        this.currentPhase = 'night';
        this.votes = {};
        this.assignRoles();
        return this;
    }

    end() {
        this.isActive = false;
        this.endTime = new Date().toISOString();
        return this;
    }

    reset() {
        this.isActive = false;
        this.round = 0;
        this.currentPhase = null;
        this.startTime = null;
        this.endTime = null;
        this.roleAssignments = {};
        this.positionAssignments = {};
        this.votes = {};
        return this;
    }

    assignRoles() {
        this.roleAssignments = {};
        this.positionAssignments = {};

        const users = Array.from(this.room.users.values());
        if (users.length === 0) return;
        
        // 准备角色池
        const { werewolves, villagers, seer, witch } = this.settings;
        let rolePool = [];
        
        if (werewolves > 0) rolePool.push(...Array(werewolves).fill('werewolf'));
        if (villagers > 0) rolePool.push(...Array(villagers).fill('villager'));
        if (seer > 0) rolePool.push(...Array(seer).fill('seer'));
        if (witch > 0) rolePool.push(...Array(witch).fill('witch'));
        
        // 调整角色池大小
        while (rolePool.length < users.length) rolePool.push('villager');
        if (rolePool.length > users.length) rolePool = rolePool.slice(0, users.length);
        
        // 随机打乱角色池
        this.shuffleArray(rolePool);
        
        // 生成位置数组
        const positions = Array.from({ length: users.length }, (_, i) => i + 1);
        this.shuffleArray(positions);
        
        // 分配角色和位置
        users.forEach((user, index) => {
            const role = rolePool[index];
            const position = positions[index];
            
            user.setRole(role);
            user.setPos(position);
            this.roleAssignments[user.userId] = role;
            this.positionAssignments[user.userId] = position;
        });
        
        logger.debug('角色和位置分配完成', this.roleAssignments, this.positionAssignments);
    }

    // 辅助方法：随机打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getUserRoleInfo(userId) {
        return {
            role: this.roleAssignments[userId] || null,
            position: this.positionAssignments[userId] || null
        };
    }

    getGameState() {
        return {
            isActive: this.isActive,
            round: this.round,
            phase: this.currentPhase,
            startTime: this.startTime,
            endTime: this.endTime
        };
    }
    
    getRoleDescription(role) {
        const descriptions = {
            werewolf: '你是狼人，你的目标是在不被发现的情况下消灭所有村民。',
            villager: '你是村民，你的目标是找出并消灭所有狼人。',
            seer: '你是预言家，你可以在晚上查看一个人的身份。你的目标是帮助村民找出狼人。',
            witch: '你是女巫，你有一瓶解药和一瓶毒药。你的目标是帮助村民找出狼人。'
        };
        
        return descriptions[role] || '角色描述未定义';
    }

    // 记录投票
    recordVote(voterId, targetId) {
        if (!this.votes) this.votes = {};
        this.votes[voterId] = targetId;
        return Object.keys(this.votes).length;
    }

    // 获取角色分配统计
    getRoleAssignmentStats() {
        const roles = Object.values(this.roleAssignments);
        return {
            total: roles.length,
            werewolves: roles.filter(r => r === 'werewolf').length,
            villagers: roles.filter(r => r === 'villager').length,
            seers: roles.filter(r => r === 'seer').length,
            witches: roles.filter(r => r === 'witch').length
        };
    }
}

export default Game;