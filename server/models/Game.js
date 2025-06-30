// models/Game.js
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
        this.voteDetails = {};
        this.settings = {
            werewolves: 2,
            villagers: 3,
            seer: 1,
            witch: 1,
            hunter: 1
        };
        
        this.dayCount = 1;
        this.phaseStartTime = null;
        this.phaseTimeLimit = 60000;
        
        this.nightActions = {
            werewolfVotes: {},
            witchActions: { save: null, poison: null },
            seerCheck: null,
            hunterShot: null
        };
        
        this.witchItems = {
            hasAntidote: true,
            hasPoison: true
        };
        
        this.deathRecord = [];
        this.lastNightDeath = null;
        
        // 新增：阶段完成跟踪
        this.phaseCompletions = {
            nightActionsCompleted: new Set(),
            votesCompleted: new Set(),
            requiredNightRoles: new Set(),
            requiredVoters: new Set()
        };
    }

    start() {
        this.isActive = true;
        this.startTime = new Date().toISOString();
        this.round = 1;
        this.dayCount = 1;
        this.currentPhase = 'night';
        this.resetVotes();
        this.assignRoles();
        this.resetNightActions();
        this.resetPhaseCompletions();
        return this;
    }

    end(winner = null) {
        this.isActive = false;
        this.endTime = new Date().toISOString();
        this.winner = winner;
        this.resetPhaseCompletions();
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
        this.dayCount = 1;
        this.resetVotes();
        this.nightActions = {
            werewolfVotes: {},
            witchActions: { save: null, poison: null },
            seerCheck: null,
            hunterShot: null
        };
        this.witchItems = {
            hasAntidote: true,
            hasPoison: true
        };
        this.deathRecord = [];
        this.lastNightDeath = null;
        this.resetPhaseCompletions();
        return this;
    }

    // 重置阶段完成状态
    resetPhaseCompletions() {
        this.phaseCompletions = {
            nightActionsCompleted: new Set(),
            votesCompleted: new Set(),
            requiredNightRoles: new Set(),
            requiredVoters: new Set()
        };
    }

    // 设置当前阶段需要行动的角色/玩家
    setRequiredActors(phase) {
        this.resetPhaseCompletions();
        
        if (phase === 'night') {
            const alivePlayers = this.getAlivePlayers();
            alivePlayers.forEach(player => {
                const role = this.roleAssignments[player.userId];
                if (['werewolf', 'seer', 'witch'].includes(role)) {
                    this.phaseCompletions.requiredNightRoles.add(player.userId);
                }
            });
        } else if (phase === 'vote') {
            const alivePlayers = this.getAlivePlayers();
            alivePlayers.forEach(player => {
                this.phaseCompletions.requiredVoters.add(player.userId);
            });
        }
    }

    // 记录玩家完成行动
    markPlayerActionCompleted(userId, actionType) {
        if (actionType === 'night') {
            this.phaseCompletions.nightActionsCompleted.add(userId);
        } else if (actionType === 'vote') {
            this.phaseCompletions.votesCompleted.add(userId);
        }
        
        logger.debug(`玩家 ${userId} 完成 ${actionType} 行动`);
    }

    // 检查当前阶段是否所有必需行动都已完成
    isPhaseCompleted() {
        if (this.currentPhase === 'night') {
            // 检查所有需要夜间行动的角色是否都已完成
            for (const userId of this.phaseCompletions.requiredNightRoles) {
                const player = this.room.getUser(userId);
                if (!player || !player.isAlive) continue;
                
                const role = this.roleAssignments[userId];
                
                // 狼人必须投票（除非只有一个狼人且已死）
                if (role === 'werewolf') {
                    const aliveWolves = this.getAlivePlayersByRole('werewolf');
                    if (aliveWolves.length > 0 && !this.nightActions.werewolfVotes[userId]) {
                        return false;
                    }
                }
                
                // 预言家可以选择跳过
                if (role === 'seer') {
                    if (!this.phaseCompletions.nightActionsCompleted.has(userId)) {
                        return false;
                    }
                }
                
                // 女巫可以选择跳过
                if (role === 'witch') {
                    if (!this.phaseCompletions.nightActionsCompleted.has(userId)) {
                        return false;
                    }
                }
            }
            return true;
        } else if (this.currentPhase === 'vote') {
            // 检查所有存活玩家是否都已投票
            const alivePlayers = this.getAlivePlayers();
            return alivePlayers.every(player => 
                this.phaseCompletions.votesCompleted.has(player.userId) || 
                this.voteDetails[player.userId]
            );
        }
        
        return false;
    }

    // 获取阶段完成进度
    getPhaseProgress() {
        if (this.currentPhase === 'night') {
            const required = this.phaseCompletions.requiredNightRoles.size;
            const completed = this.phaseCompletions.nightActionsCompleted.size;
            return { completed, required, type: 'night' };
        } else if (this.currentPhase === 'vote') {
            const required = this.getAlivePlayers().length;
            const completed = Object.keys(this.voteDetails || {}).length;
            return { completed, required, type: 'vote' };
        }
        
        return { completed: 0, required: 0, type: 'unknown' };
    }

    assignRoles() {
        this.roleAssignments = {};
        this.positionAssignments = {};

        const users = Array.from(this.room.users.values());
        if (users.length === 0) return;

        const { werewolves, villagers, seer, witch, hunter } = this.settings;
        let rolePool = [];

        if (werewolves > 0) rolePool.push(...Array(werewolves).fill('werewolf'));
        if (villagers > 0) rolePool.push(...Array(villagers).fill('villager'));
        if (seer > 0) rolePool.push(...Array(seer).fill('seer'));
        if (witch > 0) rolePool.push(...Array(witch).fill('witch'));
        if (hunter > 0) rolePool.push(...Array(hunter).fill('hunter'));

        while (rolePool.length < users.length) rolePool.push('villager');
        if (rolePool.length > users.length) rolePool = rolePool.slice(0, users.length);

        this.shuffleArray(rolePool);

        const positions = Array.from({ length: users.length }, (_, i) => i + 1);
        this.shuffleArray(positions);

        users.forEach((user, index) => {
            const role = rolePool[index];
            const position = positions[index];

            user.setRole(role);
            user.setPos(position);
            user.setAlive(true);
            this.roleAssignments[user.userId] = role;
            this.positionAssignments[user.userId] = position;
        });

        logger.debug('角色和位置分配完成', this.roleAssignments, this.positionAssignments);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getPlayersByRole(role) {
        return Array.from(this.room.users.values()).filter(user => 
            this.roleAssignments[user.userId] === role
        );
    }

    getAlivePlayers() {
        return Array.from(this.room.users.values()).filter(user => user.isAlive);
    }

    getAlivePlayersByRole(role) {
        return this.getAlivePlayers().filter(user => 
            this.roleAssignments[user.userId] === role
        );
    }

    checkGameEnd() {
        const aliveWerewolves = this.getAlivePlayersByRole('werewolf').length;
        const aliveGoodGuys = this.getAlivePlayers().filter(user => 
            this.roleAssignments[user.userId] !== 'werewolf'
        ).length;

        if (aliveWerewolves === 0) {
            return { ended: true, winner: 'good', message: '好人阵营胜利！所有狼人已被淘汰。' };
        } else if (aliveWerewolves >= aliveGoodGuys) {
            return { ended: true, winner: 'werewolf', message: '狼人阵营胜利！狼人数量已达到或超过好人数量。' };
        }
        
        return { ended: false };
    }

    changePhase(newPhase) {
        this.currentPhase = newPhase;
        this.phaseStartTime = Date.now();
        this.resetVotes();
        
        if (newPhase === 'night') {
            this.resetNightActions();
        }
        
        // 设置当前阶段需要的行动者
        this.setRequiredActors(newPhase);
        
        logger.info(`游戏阶段切换到: ${newPhase}`);
        return this;
    }

    resetNightActions() {
        this.nightActions = {
            werewolfVotes: {},
            witchActions: { save: null, poison: null },
            seerCheck: null,
            hunterShot: null
        };
    }

    resetVotes() {
        this.votes = {};
        this.voteDetails = {};
        Array.from(this.room.users.values()).forEach(user => {
            user.setVoted(false);
        });
    }

    recordVote(voterId, targetId) {
        if (!this.votes) this.votes = {};
        if (!this.voteDetails) this.voteDetails = {};
        
        // 清除该投票者之前的投票
        Object.keys(this.votes).forEach(key => {
            if (this.votes[key] && Array.isArray(this.votes[key])) {
                this.votes[key] = this.votes[key].filter(id => id !== voterId);
                if (this.votes[key].length === 0) {
                    delete this.votes[key];
                }
            }
        });

        // 记录新投票
        if (!this.votes[targetId]) this.votes[targetId] = [];
        this.votes[targetId].push(voterId);
        
        // 记录详细投票信息
        this.voteDetails[voterId] = {
            targetId: targetId,
            timestamp: new Date().toISOString()
        };
        
        // 标记投票完成
        this.markPlayerActionCompleted(voterId, 'vote');
        
        logger.debug(`${voterId} 投票给 ${targetId}`);
        return this.getTotalVoteCount();
    }

    getTotalVoteCount() {
        return Object.keys(this.voteDetails || {}).length;
    }

    getVoteResults() {
        const results = {};
        const voterDetails = {};
        
        Object.entries(this.votes || {}).forEach(([targetId, voterIds]) => {
            results[targetId] = {
                count: voterIds.length,
                voters: voterIds.map(voterId => {
                    const voter = this.room.getUser(voterId);
                    return {
                        userId: voterId,
                        username: voter ? voter.username : '未知用户'
                    };
                })
            };
        });

        Object.entries(this.voteDetails || {}).forEach(([voterId, details]) => {
            const voter = this.room.getUser(voterId);
            const target = this.room.getUser(details.targetId);
            voterDetails[voterId] = {
                voterName: voter ? voter.username : '未知用户',
                targetId: details.targetId,
                targetName: target ? target.username : '未知用户',
                timestamp: details.timestamp
            };
        });

        return {
            voteResults: results,
            voterDetails: voterDetails,
            totalVotes: this.getTotalVoteCount(),
            alivePlayers: this.getAlivePlayers().length
        };
    }

    dayVote() {
        // const alivePlayers = this.getAlivePlayers();
        const voteStats = this.getVoteResults();
        
        if (Object.keys(this.votes || {}).length === 0) {
            logger.info('无人投票');
            return { 
                success: false, 
                message: '无人投票，本轮无人被淘汰',
                voteStats: voteStats
            };
        }

        const maxVotes = Math.max(...Object.values(this.votes || {}).map(voters => voters.length));
        const candidates = Object.entries(this.votes || {})
            .filter(([_, voters]) => voters.length === maxVotes)
            .map(([targetId, _]) => this.room.getUser(targetId))
            .filter(user => user);

        if (candidates.length === 1 && maxVotes > 0) {
            const eliminatedPlayer = candidates[0];
            eliminatedPlayer.setAlive(false);
            this.deathRecord.push({
                userId: eliminatedPlayer.userId,
                username: eliminatedPlayer.username,
                role: this.roleAssignments[eliminatedPlayer.userId],
                cause: 'vote',
                day: this.dayCount,
                voteCount: maxVotes
            });

            logger.info(`${eliminatedPlayer.username} 被投票淘汰，得票 ${maxVotes} 票`);
            return { 
                success: true, 
                eliminated: eliminatedPlayer, 
                voteCount: maxVotes,
                voteStats: voteStats
            };
        } else {
            logger.info(`投票平票，最高票数 ${maxVotes}，候选人数 ${candidates.length}`);
            return { 
                success: false, 
                message: `投票平票，无人被淘汰 (${candidates.length}人同获${maxVotes}票)`,
                voteStats: voteStats,
                tiedCandidates: candidates.map(c => ({ 
                    userId: c.userId, 
                    username: c.username, 
                    voteCount: maxVotes 
                }))
            };
        }
    }

    werewolfKill() {
        const werewolfVotes = this.nightActions.werewolfVotes;
        const voteCount = {};
        
        Object.values(werewolfVotes).forEach(targetId => {
            voteCount[targetId] = (voteCount[targetId] || 0) + 1;
        });

        if (Object.keys(voteCount).length === 0) {
            logger.info('狼人没有达成一致，本轮无人被击杀');
            return null;
        }

        const maxVotes = Math.max(...Object.values(voteCount));
        const targets = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);
        
        if (targets.length === 1) {
            const targetId = targets[0];
            const target = this.room.getUser(targetId);
            
            if (this.nightActions.witchActions.save === targetId) {
                logger.info(`${target.username} 被狼人击杀，但被女巫救活`);
                this.lastNightDeath = null;
                return { killed: target, saved: true };
            } else {
                target.setAlive(false);
                this.lastNightDeath = targetId;
                this.deathRecord.push({
                    userId: target.userId,
                    username: target.username,
                    role: this.roleAssignments[target.userId],
                    cause: 'werewolf',
                    day: this.dayCount
                });
                logger.info(`${target.username} 被狼人击杀`);
                return { killed: target, saved: false };
            }
        } else {
            logger.info('狼人投票平票，本轮无人被击杀');
            return null;
        }
    }

    witchAction() {
        const actions = this.nightActions.witchActions;
        const results = [];

        if (actions.poison) {
            const target = this.room.getUser(actions.poison);
            if (target && target.isAlive) {
                target.setAlive(false);
                this.deathRecord.push({
                    userId: target.userId,
                    username: target.username,
                    role: this.roleAssignments[target.userId],
                    cause: 'poison',
                    day: this.dayCount
                });
                this.witchItems.hasPoison = false;
                results.push({ action: 'poison', target });
                logger.info(`${target.username} 被女巫毒杀`);
            }
        }

        if (actions.save) {
            this.witchItems.hasAntidote = false;
            results.push({ action: 'save', targetId: actions.save });
            logger.info(`女巫使用解药救人`);
        }

        return results;
    }

    seerCheck(targetId) {
        const target = this.room.getUser(targetId);
        if (!target) return null;

        const targetRole = this.roleAssignments[targetId];
        const isWerewolf = targetRole === 'werewolf';
        
        logger.info(`预言家查验 ${target.username}: ${isWerewolf ? '狼人' : '好人'}`);
        
        return {
            target: target,
            role: targetRole,
            isWerewolf: isWerewolf,
            result: isWerewolf ? '狼人' : '好人'
        };
    }

    hunterShoot(targetId) {
        const target = this.room.getUser(targetId);
        if (!target || !target.isAlive) return null;

        target.setAlive(false);
        this.deathRecord.push({
            userId: target.userId,
            username: target.username,
            role: this.roleAssignments[target.userId],
            cause: 'hunter',
            day: this.dayCount
        });

        logger.info(`猎人击杀了 ${target.username}`);
        return { shot: target };
    }

    recordWerewolfVote(voterId, targetId) {
        this.nightActions.werewolfVotes[voterId] = targetId;
        this.markPlayerActionCompleted(voterId, 'night');
        logger.debug(`狼人 ${voterId} 选择击杀 ${targetId}`);
        return Object.keys(this.nightActions.werewolfVotes).length;
    }

    recordWitchAction(action, targetId = null) {
        if (action === 'save' && this.witchItems.hasAntidote) {
            this.nightActions.witchActions.save = targetId;
            logger.debug(`女巫选择救人: ${targetId}`);
            return true;
        } else if (action === 'poison' && this.witchItems.hasPoison) {
            this.nightActions.witchActions.poison = targetId;
            logger.debug(`女巫选择毒人: ${targetId}`);
            return true;
        }
        return false;
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
            dayCount: this.dayCount,
            startTime: this.startTime,
            endTime: this.endTime,
            phaseStartTime: this.phaseStartTime,
            witchItems: this.witchItems,
            deathRecord: this.deathRecord,
            lastNightDeath: this.lastNightDeath,
            phaseProgress: this.getPhaseProgress()
        };
    }

    getRoleDescription(role) {
        const descriptions = {
            werewolf: '你是狼人，你的目标是在不被发现的情况下消灭所有村民。夜晚时你可以与其他狼人商议击杀目标。',
            villager: '你是村民，你的目标是找出并消灭所有狼人。白天时通过投票淘汰可疑的玩家。',
            seer: '你是预言家，你可以在夜晚查看一个人的身份。你的目标是帮助村民找出狼人。',
            witch: '你是女巫，你有一瓶解药和一瓶毒药。解药可以救活被狼人击杀的玩家，毒药可以毒杀任意玩家。',
            hunter: '你是猎人，当你被淘汰时，可以选择一名玩家一起出局。你的目标是帮助村民找出狼人。'
        };

        return descriptions[role] || '角色描述未定义';
    }

    nextDay() {
        this.dayCount++;
        this.round++;
        logger.info(`游戏进入第 ${this.dayCount} 天`);
        return this;
    }

    getRoleAssignmentStats() {
        const roles = Object.values(this.roleAssignments);
        return {
            total: roles.length,
            werewolves: roles.filter(r => r === 'werewolf').length,
            villagers: roles.filter(r => r === 'villager').length,
            seers: roles.filter(r => r === 'seer').length,
            witches: roles.filter(r => r === 'witch').length,
            hunters: roles.filter(r => r === 'hunter').length
        };
    }

    getPhaseProgress() {
        if (this.currentPhase === 'night') {
            const required = this.phaseCompletions.requiredNightRoles.size;
            const completed = this.phaseCompletions.nightActionsCompleted.size;
            return { completed, required, type: 'night' };
        } else if (this.currentPhase === 'day') {
            // 白天阶段：等待夜晚结果广播和讨论时间
            return { completed: 1, required: 1, type: 'day' };
        } else if (this.currentPhase === 'vote') {
            const required = this.getAlivePlayers().length;
            const completed = Object.keys(this.voteDetails || {}).length;
            return { completed, required, type: 'vote' };
        }
        
        return { completed: 0, required: 0, type: 'unknown' };
    }

    // 添加方法检查白天阶段是否完成
    isDayPhaseCompleted() {
        // 白天阶段主要是广播夜晚结果，可以设置最短时间后自动完成
        return this.currentPhase === 'day';
    }
}

export default Game;