import GameState from './GameState.js';
import GameActions from './GameActions.js';
import logger from '../config/logger.js';

export default class Game {
    constructor(room) {
        this.room = room;
        this.state = new GameState();
        this.actions = new GameActions(this);
    }

    start() {
        this.state.start();
        this.assignRoles();
        logger.info(`房间 ${this.room.roomId} 游戏开始`);
        return this;
    }

    end(winner = null) {
        this.state.end(winner);
        return this;
    }

    reset() {
        this.state.reset();
        this.room.users.forEach(user => user.clearRole());
        return this;
    }

    assignRoles() {
        const users = Array.from(this.room.users.values());
        if (users.length === 0) return;

        const rolePool = this.createRolePool(users.length);
        const positions = Array.from({ length: users.length }, (_, i) => i + 1);
        
        this.shuffleArray(rolePool);
        this.shuffleArray(positions);

        users.forEach((user, index) => {
            const role = rolePool[index];
            const position = positions[index];
            user.setRole(role).setPos(position).setAlive(true);
            this.state.roleAssignments[user.userId] = role;
            this.state.positionAssignments[user.userId] = position;
        });
        
        if (this.eventBroadcaster) {
            this.eventBroadcaster.broadcastRoomUsers(this.room.roomId);
        }
        logger.debug('角色分配完成', this.state.roleAssignments);
    }

    castVote(voterId, targetId) {
        try{
        const voter = this.room.getUser(voterId);
        const target = this.room.getUser(targetId);
        
        if (!voter || !voter.isAlive || !target || !target.isAlive) {
            return false;
        }
        const state = this.state;
        Object.keys(state.votes).forEach(targetId => {
            if (Array.isArray(state.votes[targetId])) {
                const index = state.votes[targetId].indexOf(voterId);
                if (index !== -1) {
                    state.votes[targetId].splice(index, 1);
                    if (state.votes[targetId].length === 0) {
                        delete state.votes[targetId];
                    }
                }
            }
        });
        
        if (!state.votes[targetId]) {
            state.votes[targetId] = [];
        }
        state.votes[targetId].push(voterId);
        
        state.voteDetails[voterId] = {
            targetId: targetId,
            timestamp: new Date().toISOString()
        };
        
        state.phaseCompletions.voteCompleted.add(voterId);
        
        logger.info(`投票成功: ${voter.username} → ${target.username}`);
            return true;
        } catch (error) {
            logger.error(`投票异常: ${error.message}`, error);
            return false;
        }
    }

    createRolePool(playerCount) {
        const { werewolves, villagers, seer, witch, hunter } = this.state.settings;
        let pool = [];
        
        if (werewolves > 0) pool.push(...Array(werewolves).fill('werewolf'));
        if (villagers > 0) pool.push(...Array(villagers).fill('villager'));
        if (seer > 0) pool.push(...Array(seer).fill('seer'));
        if (witch > 0) pool.push(...Array(witch).fill('witch'));
        if (hunter > 0) pool.push(...Array(hunter).fill('hunter'));

        while (pool.length < playerCount) pool.push('villager');
        return pool.slice(0, playerCount);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getPlayersByRole(role) {
        return Array.from(this.room.users.values()).filter(u => 
            this.state.roleAssignments[u.userId] === role
        );
    }

    getAlivePlayers() {
        return Array.from(this.room.users.values()).filter(u => u.isAlive);
    }

    getAlivePlayersByRole(role) {
        return this.getAlivePlayers().filter(u => 
            this.state.roleAssignments[u.userId] === role
        );
    }

    checkGameEnd() {
        const aliveWerewolves = this.getAlivePlayersByRole('werewolf').length;
        const aliveGoodGuys = this.getAlivePlayers().filter(u => 
            this.state.roleAssignments[u.userId] !== 'werewolf'
        ).length;

        if (aliveWerewolves === 0) {
            return { ended: true, winner: 'good', message: '好人阵营胜利！所有狼人已被淘汰。' };
        } else if (aliveGoodGuys === 0) {
            return { ended: true, winner: 'werewolf', message: '狼人阵营胜利！狼人数量已达到或超过好人数量。' };
        }
        
        return { ended: false };
    }

    getUserRoleInfo(userId) {
        return {
            role: this.state.roleAssignments[userId] || null,
            position: this.state.positionAssignments[userId] || null
        };
    }

    getRoleDescription(role) {
        const descriptions = {
            werewolf: '你是狼人，夜晚时可以与其他狼人商议击杀目标。',
            villager: '你是村民，白天时通过投票淘汰可疑的玩家。',
            seer: '你是预言家，可以在夜晚查看一个人的身份。',
            witch: '你是女巫，有一瓶解药和一瓶毒药。',
            hunter: '你是猎人，被淘汰时可以选择一名玩家一起出局。'
        };
        return descriptions[role] || '角色描述未定义';
    }
}