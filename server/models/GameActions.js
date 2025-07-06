import logger from '../config/logger.js';

export default class GameActions {
    constructor(game) {
        this.game = game;
    }

    recordVote(voterId, targetId) {
        const state = this.game.state;
        
        Object.keys(state.votes).forEach(key => {
            if (state.votes[key] && Array.isArray(state.votes[key])) {
                state.votes[key] = state.votes[key].filter(id => id !== voterId);
                if (state.votes[key].length === 0) delete state.votes[key];
            }
        });

        if (!state.votes[targetId]) state.votes[targetId] = [];
        state.votes[targetId].push(voterId);
        
        state.voteDetails[voterId] = {
            targetId: targetId,
            timestamp: new Date().toISOString()
        };

        state.phaseCompletions.votesCompleted.add(voterId);
        logger.debug(`${voterId} 投票给 ${targetId}`);
        return Object.keys(state.voteDetails).length;
    }

    dayVote() {
        const state = this.game.state;
        const voteStats = this.getVoteResults();
        
        if (Object.keys(state.votes).length === 0) {
            logger.info('无人投票');
            return { success: false, message: '无人投票，本轮无人被淘汰', voteStats };
        }

        const maxVotes = Math.max(...Object.values(state.votes).map(voters => voters.length));
        const candidates = Object.entries(state.votes)
        .filter(([, voters]) => voters.length === maxVotes)
        .map(([targetId]) => this.game.room.getUser(targetId))
        .filter(user => user);

        if (candidates.length === 1 && maxVotes > 0) {
            const eliminated = candidates[0];
            eliminated.setAlive(false);
            state.deathRecord.push({
                userId: eliminated.userId,
                username: eliminated.username,
                role: state.roleAssignments[eliminated.userId],
                cause: 'vote',
                day: state.dayCount,
                voteCount: maxVotes
            });
            logger.info(`${eliminated.username} 被投票淘汰`);
            return { success: true, eliminated, voteCount: maxVotes, voteStats };
        }

        logger.info('投票平票');
        return { 
            success: false, 
            message: `投票平票，无人被淘汰 (${candidates.length}人同获${maxVotes}票)`,
            voteStats,
            tiedCandidates: candidates.map(c => ({ 
                userId: c.userId, 
                username: c.username, 
                voteCount: maxVotes 
            }))
        };
    }

    werewolfKill() {
        const state = this.game.state;
        const voteCount = {};
        
        Object.values(state.nightActions.werewolfVotes).forEach(targetId => {
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
            const target = this.game.room.getUser(targetId);
            
            state.lastNightDeath = targetId;
            
            if (state.nightActions.witchActions.save === targetId) {
                logger.info(`${target.username} 被狼人击杀，但被女巫救活`);
                return { killed: target, saved: true };
            } else {
                target.setAlive(false);
                state.deathRecord.push({
                    userId: target.userId,
                    username: target.username,
                    role: state.roleAssignments[target.userId],
                    cause: 'werewolf',
                    day: state.dayCount
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
        const state = this.game.state;
        const actions = state.nightActions.witchActions;
        const results = [];

        if (actions.poison) {
            const target = this.game.room.getUser(actions.poison);
            if (target && target.isAlive) {
                target.setAlive(false);
                state.deathRecord.push({
                    userId: target.userId,
                    username: target.username,
                    role: state.roleAssignments[target.userId],
                    cause: 'poison',
                    day: state.dayCount
                });
                state.witchItems.hasPoison = false;
                results.push({ action: 'poison', target });
                logger.info(`${target.username} 被女巫毒杀`);
            }
        }

        if (actions.save) {
            state.witchItems.hasAntidote = false;
            results.push({ action: 'save', targetId: actions.save });
            logger.info(`女巫使用解药救人`);
        }

        return results;
    }

    seerCheck(targetId) {
        const target = this.game.room.getUser(targetId);
        if (!target) return null;

        const targetRole = this.game.state.roleAssignments[targetId];
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
        const target = this.game.room.getUser(targetId);
        if (!target || !target.isAlive) return null;

        target.setAlive(false);
        this.game.state.deathRecord.push({
            userId: target.userId,
            username: target.username,
            role: this.game.state.roleAssignments[target.userId],
            cause: 'hunter',
            day: this.game.state.dayCount
        });

        logger.info(`猎人击杀了 ${target.username}`);
        return { shot: target };
    }

    getVoteResults() {
        const state = this.game.state;
        const results = {};
        const voterDetails = {};
        
        Object.entries(state.votes).forEach(([targetId, voterIds]) => {
            results[targetId] = {
                count: voterIds.length,
                voters: voterIds.map(voterId => {
                    const voter = this.game.room.getUser(voterId);
                    return { userId: voterId, username: voter ? voter.username : '未知用户' };
                })
            };
        });

        Object.entries(state.voteDetails).forEach(([voterId, details]) => {
            const voter = this.game.room.getUser(voterId);
            const target = this.game.room.getUser(details.targetId);
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
            totalVotes: Object.keys(state.voteDetails).length,
            alivePlayers: this.game.getAlivePlayers().length
        };
    }
}