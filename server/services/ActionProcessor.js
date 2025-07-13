import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';
import PhaseManager from './PhaseManager.js';

export default class ActionProcessor {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
        this.phaseManager = new PhaseManager(io, eventBroadcaster);
    }

    playerVote(roomId, voterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!this.validateVotePhase(room)) {
            return { success: false, message: '当前不是投票阶段' };
        }

        const { voter, target, error } = this.validateVotePlayers(room, voterId, targetId);
        if (error) return { success: false, message: error };

        const totalVotes = room.game.actions.recordVote(voterId, targetId);
        voter.setVoted(true);

        this.broadcastVoteUpdate(roomId, voter, target, room.game.actions.getVoteResults());
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        
        this.checkAndProgressPhase(roomId);

        return { success: true, message: '投票成功', totalVotes };
    }

    werewolfVote(roomId, voterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!this.validateNightPhase(room)) {
            return { success: false, message: '当前不是夜晚阶段' };
        }

        const { voter, error } = this.validateWerewolfAction(room, voterId, targetId);
        if (error) return { success: false, message: error };

        const target = room.getUser(targetId);

        room.game.state.nightActions.werewolfVotes[voterId] = targetId;
        room.game.state.phaseCompletions.nightActionsCompleted.add(voterId);
        voter.setNightActionCompleted(true);

        this.checkAndProgressPhase(roomId);
        logger.info(`狼人 ${voter.username} 投票击杀 ${target.username}`);

        return { success: true, message: '击杀投票成功' };
    }

    seerCheck(roomId, seerId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!this.validateNightPhase(room)) {
            return { success: false, message: '预言家只能在夜晚使用技能' };
        }

        const { seer, target, error } = this.validateSeerAction(room, seerId, targetId);
        logger.info(`预言家 ${seer.username} 检查 ${target.username}`);
        if (error) return { success: false, message: error };

        const result = room.game.actions.seerCheck(targetId);
        room.game.state.phaseCompletions.nightActionsCompleted.add(seerId);
        seer.setNightActionCompleted(true);

        this.sendSeerResult(seerId, result);
        this.checkAndProgressPhase(roomId);

        return { success: true, message: '查验成功', result: result.result };
    }

    witchAction(roomId, witchId, action, targetId = null) {
        const room = this.globalState.getRoom(roomId);
        if (!this.validateNightPhase(room)) {
            return { success: false, message: '女巫只能在夜晚使用技能' };
        }

        const { witch, error } = this.validateWitchAction(room, witchId, action, targetId);
        if (error) return { success: false, message: error };

        if (action === 'save') {
            room.game.state.nightActions.witchActions.save = targetId;
        } else if (action === 'poison') {
            room.game.state.nightActions.witchActions.poison = targetId;
        }

        room.game.state.phaseCompletions.nightActionsCompleted.add(witchId);
        witch.setNightActionCompleted(true);
        this.checkAndProgressPhase(roomId);

        return { success: true, message: `${action === 'save' ? '解药' : '毒药'}使用成功` };
    }

    hunterShoot(roomId, hunterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        const { hunter, target, error } = this.validateHunterAction(room, hunterId, targetId);
        if (error) return { success: false, message: error };

        room.game.actions.hunterShoot(targetId);
        
        this.eventBroadcaster.broadcastSystemMessage(roomId,
            `猎人 ${hunter.username} 带走了 ${target.username}！`);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        const gameEndCheck = room.game.checkGameEnd();
        if (gameEndCheck.ended) {
            this.phaseManager.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
        }

        return { success: true, message: '猎人技能使用成功' };
    }

    skipAction(roomId, userId, actionType) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        const user = room.getUser(userId);
        if (!user) return { success: false, message: '玩家不存在' };

        user.setNightActionCompleted(true);
        
        if (actionType === 'night' || ['werewolf_kill', 'seer_check', 'witch_action'].includes(actionType)) {
            room.game.state.phaseCompletions.nightActionsCompleted.add(userId);
        } else if (actionType === 'vote') {
            room.game.state.phaseCompletions.votesCompleted.add(userId);
        }
        
        this.checkAndProgressPhase(roomId);
        return { success: true, message: '已跳过行动' };
    }

    validateVotePhase(room) {
        return room?.game.state.isActive && room.game.state.currentPhase === 'vote';
    }

    validateNightPhase(room) {
        return room?.game.state.isActive && room.game.state.currentPhase === 'night';
    }

    validateVotePlayers(room, voterId, targetId) {
        const voter = room.getUser(voterId);
        const target = room.getUser(targetId);
        
        if (!voter || !target) return { error: '玩家不存在' };
        if (!voter.isAlive) return { error: '死亡玩家无法投票' };
        if (!target.isAlive) return { error: '无法投票给已死亡的玩家' };
        if (voterId === targetId) return { error: '无法投票给自己' };
        
        return { voter, target };
    }

    validateWerewolfAction(room, voterId, targetId) {
        const voter = room.getUser(voterId);
        const target = room.getUser(targetId);
        
        if (!voter || !target) return { error: '玩家不存在' };
        if (room.game.state.roleAssignments[voterId] !== 'werewolf') return { error: '只有狼人可以进行击杀投票' };
        if (!voter.isAlive) return { error: '死亡玩家无法行动' };
        if (room.game.state.roleAssignments[targetId] === 'werewolf') return { error: '狼人不能击杀同伴' };
        if (!target.isAlive) return { error: '无法击杀已死亡的玩家' };
        
        return { voter, target };
    }

    validateSeerAction(room, seerId, targetId) {
        const seer = room.getUser(seerId);
        const target = room.getUser(targetId);
        
        if (!seer || !target) return { error: '玩家不存在' };
        if (room.game.state.roleAssignments[seerId] !== 'seer') return { error: '只有预言家可以使用此技能' };
        if (!seer.isAlive) return { error: '死亡玩家无法行动' };
        if (!target.isAlive) return { error: '无法查验已死亡的玩家' };
        if (seerId === targetId) return { error: '无法查验自己' };
        
        return { seer, target };
    }

    validateWitchAction(room, witchId, action, targetId) {
        const witch = room.getUser(witchId);
        if (!witch) return { error: '玩家不存在' };
        if (room.game.state.roleAssignments[witchId] !== 'witch') return { error: '只有女巫可以使用此技能' };
        if (!witch.isAlive) return { error: '死亡玩家无法行动' };

        if (action === 'save') {
            if (!room.game.state.witchItems.hasAntidote) return { error: '解药已用完' };
            if (targetId !== room.game.state.lastNightDeath) return { error: '只能救活被狼人击杀的玩家' };
            
            if (room.game.state.isFirstNight && targetId === witchId) {
                return { error: '第一夜女巫不能救自己' };
            }
        } else if (action === 'poison') {
            if (!room.game.state.witchItems.hasPoison) return { error: '毒药已用完' };
            const target = room.getUser(targetId);
            if (!target?.isAlive || targetId === witchId) return { error: '毒药使用目标无效' };
        }
        
        return { witch };
    }

    validateHunterAction(room, hunterId, targetId) {
        const hunter = room.getUser(hunterId);
        const target = room.getUser(targetId);
        
        if (!hunter || !target) return { error: '玩家不存在' };
        if (room.game.state.roleAssignments[hunterId] !== 'hunter') return { error: '只有猎人可以使用此技能' };
        if (hunter.isAlive) return { error: '猎人必须在死亡时才能使用技能' };
        if (!target.isAlive) return { error: '无法击杀已死亡的玩家' };
        
        return { hunter, target };
    }

    sendSeerResult(seerId, result) {
        const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(seerId));
        if (socket) {
            socket.emit('seer_result', {
                target: result.target.username,
                position: result.target.pos,
                result: result.result,
                isWerewolf: result.isWerewolf
            });
        }
    }

    broadcastVoteUpdate(roomId, voter, target, voteStats) {
        this.io.to(roomId).emit('vote_update', {
            type: 'vote_cast',
            voter: { userId: voter.userId, username: voter.username },
            target: { userId: target.userId, username: target.username },
            voteStats: voteStats,
            timestamp: new Date().toISOString()
        });
    }

    checkAndProgressPhase(roomId) {
        this.phaseManager.checkAndProgressPhase(roomId);
    }
}