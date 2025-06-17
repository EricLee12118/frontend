import logger from '../config/logger.js';
// models/Game.js
class Game {
    constructor(room) {
        this.room = room;
        this.isActive = false;
        this.startTime = null;
        this.endTime = null;
        this.round = 0;
        this.currentPhase = null;
        this.roleAssignments = {}; // userId -> role
        this.positionAssignments = {};
        this.settings = {
            werewolves: 3,
            villagers: 3,
            seer: 1,
            witch: 1
        };
    }

    // 开始游戏
    start() {
        this.isActive = true;
        this.startTime = new Date().toISOString();
        this.round = 1;
        this.currentPhase = 'night';

        this.assignRoles();
        
        return this;
    }

    // 结束游戏
    end() {
        this.isActive = false;
        this.endTime = new Date().toISOString();
        
        return this;
    }

    // 重置游戏
    reset() {
        this.isActive = false;
        this.round = 0;
        this.currentPhase = null;
        this.startTime = null;
        this.endTime = null;
        this.roleAssignments = {};
        this.positionAssignments = {};
        return this;
    }

    assignRoles() {
        this.roleAssignments = {};
        this.positionAssignments = {};

        const users = Array.from(this.room.users.values());
        
        const { werewolves, villagers, seer, witch } = this.settings;
        
        let rolePool = [
            ...Array(werewolves).fill('werewolf'),
            ...Array(villagers).fill('villager')
        ];
        
        if (seer > 0) rolePool.push(...Array(seer).fill('seer'));
        if (witch > 0) rolePool.push(...Array(witch).fill('witch'));
        
        if (rolePool.length < users.length) {
            const additionalVillagers = users.length - rolePool.length;
            rolePool.push(...Array(additionalVillagers).fill('villager'));
        }
        
        for (let i = rolePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
        }
        
        const positions = Array.from({ length: users.length }, (_, i) => i + 1);
        
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        
        users.forEach((user, index) => {
            if (index < rolePool.length) {
                const role = rolePool[index];
                const position = positions[index];
                
                user.setRole(role);
                user.setPos(position);
                this.roleAssignments[user.userId] = role;
                this.positionAssignments[user.userId] = position;
            }
        });        
        logger.debug('已分配角色',this.roleAssignments, this.positionAssignments);
    }

    getUserRole(userId) {
        return this.roleAssignments[userId] || null;
    }
    
    getUserPosition(userId) {
        return this.positionAssignments[userId] || null;
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
}

export default Game;