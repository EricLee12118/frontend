import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';

export default class PhaseManager {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
        this.phaseTimers = new Map();
        this.speakerTimers = new Map(); 
    }

    startNightPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        room.game.state.currentPhase = 'night';
        room.game.state.phaseStartTime = Date.now();
        room.game.state.resetVotes();
        room.game.state.resetNightActions();
        room.game.state.lastNightDeath = null;
        this.setRequiredActors(room, 'night');
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId,
            `第 ${room.game.state.dayCount} 天夜晚开始，请各角色执行夜间行动。`);

        this.sendNightActionInstructions(roomId);
        this.setPhaseTimer(roomId, () => this.finishNightPhase(roomId), 120000);

        return { success: true };
    }

    sendNightActionInstructions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const alivePlayers = room.game.getAlivePlayers();

        alivePlayers.forEach(player => {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(player.userId));
            if (!socket || player.isAI) return;

            const role = room.game.state.roleAssignments[player.userId];
            
            switch (role) {
                case 'werewolf':
                    this.sendWerewolfAction(socket, roomId, player);
                    break;
                case 'seer':
                    this.sendSeerAction(socket, roomId, player);
                    break;
            }
        });
    }

    checkWerewolfActionsComplete(roomId) {
        const room = this.globalState.getRoom(roomId);
        const aliveWerewolves = room.game.getAlivePlayers()
            .filter(p => room.game.state.roleAssignments[p.userId] === 'werewolf');

        const completedWerewolves = aliveWerewolves.filter(p => 
            room.game.state.phaseCompletions.nightActionsCompleted.has(p.userId)
        );

        if (completedWerewolves.length === aliveWerewolves.length && aliveWerewolves.length > 0) {
            this.processWerewolfKillAndNotifyWitch(roomId);
        }
    }

    processWerewolfKillAndNotifyWitch(roomId) {
        const room = this.globalState.getRoom(roomId);
        const state = room.game.state;
        
        const voteCount = {};
        logger.info('狼人投票结果：', state.nightActions.werewolfVotes);

        Object.values(state.nightActions.werewolfVotes).forEach(targetId => {
            voteCount[targetId] = (voteCount[targetId] || 0) + 1;
        });

        let killedTarget = null;
        if (Object.keys(voteCount).length > 0) {
            const maxVotes = Math.max(...Object.values(voteCount));
            const targets = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);
            
            if (targets.length === 1) {
                killedTarget = room.getUser(targets[0]);
                state.lastNightDeath = targets[0];
                logger.info(`狼人决定击杀: ${killedTarget.username}`);
            } else {
                logger.info('狼人投票平票，无人被击杀');
            }
        } else {
            logger.info('狼人没有投票，无人被击杀');
        }

        this.sendWitchActionInstructions(roomId);
    }

    sendWitchActionInstructions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const alivePlayers = room.game.getAlivePlayers();
        
        const aliveWitches = alivePlayers.filter(player => 
            room.game.state.roleAssignments[player.userId] === 'witch'
        );

        aliveWitches.forEach(player => {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(player.userId));
            if (!socket || player.isAI) return;

            this.sendWitchAction(socket, roomId, player);
        });
    }

    sendWerewolfAction(socket, roomId, player) {
        const room = this.globalState.getRoom(roomId);
        const targets = room.game.getAlivePlayers()
            .filter(p => room.game.state.roleAssignments[p.userId] !== 'werewolf')
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        socket.emit('night_action_required', {
            action: 'werewolf_kill',
            phase: 'night',
            player: player,
            targets: targets,
            message: '请选择今晚要击杀的目标',
            timeLimit: 120000
        });
    }

    sendSeerAction(socket, roomId, player) {
        const room = this.globalState.getRoom(roomId);
        const targets = room.game.getAlivePlayers()
            .filter(p => p.userId !== player.userId)
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        socket.emit('night_action_required', {
            action: 'seer_check',
            phase: 'night',
            targets: targets,
            message: '请选择要查验身份的目标',
            timeLimit: 120000
        });
    }

    sendWitchAction(socket, roomId, player) {
        const room = this.globalState.getRoom(roomId);
        const state = room.game.state;
        
        let victimPlayer = null;
        if (state.lastNightDeath) {
            victimPlayer = room.getUser(state.lastNightDeath);
            logger.info(`女巫看到的受害者: ${victimPlayer ? victimPlayer.username : '未知'}`);
        } else {
            logger.info('女巫看到：昨夜无人被狼人击杀');
        }
        
        const alivePlayers = room.game.getAlivePlayers()
            .filter(p => p.userId !== player.userId)
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        const canSaveSelf = !state.isFirstNight || (victimPlayer && victimPlayer.userId !== player.userId);
        const canSaveVictim = victimPlayer && canSaveSelf;

        socket.emit('night_action_required', {
            action: 'witch_action',
            phase: 'night',
            hasAntidote: state.witchItems.hasAntidote,
            hasPoison: state.witchItems.hasPoison,
            potentialVictim: victimPlayer && canSaveVictim ? { 
            userId: victimPlayer.userId, 
            username: victimPlayer.username 
            } : null,
            deadPlayer: victimPlayer && canSaveVictim ? { 
                userId: victimPlayer.userId, 
                username: victimPlayer.username 
            } : null,
            alivePlayers: alivePlayers,
            message: victimPlayer ? 
                `昨夜 ${victimPlayer.username} 被狼人击杀，请选择是否使用解药或毒药` :
                '昨夜平安无事，请选择是否使用毒药',
            timeLimit: 60000,
            isFirstNight: state.isFirstNight
        });
    }

    startDayPhase(roomId, nightResults) {
        const room = this.globalState.getRoom(roomId);
        room.game.state.currentPhase = 'day';
        room.game.state.nextDay();
        
        room.game.state.resetDiscussionState();

        this.announceNightResults(roomId, nightResults);

        setTimeout(() => {
            this.eventBroadcaster.broadcastGameState(roomId);
            this.eventBroadcaster.broadcastSystemMessage(roomId,
                `第 ${room.game.state.dayCount} 天白天开始，即将开始依次发言讨论。`);
            
            this.startOrderedDiscussion(roomId);
        }, 2000);

        return { success: true };
    }

    announceNightResults(roomId, results) {
        const announcements = results.length === 0 ? ['昨夜平安无事。'] : 
            results.map(result => {
                switch (result.type) {
                    case 'werewolf_kill':
                        return result.saved ? '昨夜平安无事。' : `昨夜 ${result.target.username} 被狼人击杀。`;
                    case 'witch_action':
                        return result.action === 'poison' ? `昨夜 ${result.target.username} 被毒杀。` : null;
                    default:
                        return null;
                }
            }).filter(Boolean);

        if (announcements.length === 0) announcements.push('昨夜平安无事。');

        announcements.forEach(announcement => 
            this.eventBroadcaster.broadcastSystemMessage(roomId, announcement)
        );
    }

    startVotePhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        room.game.state.currentPhase = 'vote';
        room.game.state.resetVotes();
        this.setRequiredActors(room, 'vote');

        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, '🗳️ 投票阶段开始！');

        const alivePlayers = room.game.getAlivePlayers();
        alivePlayers.forEach(player => {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(player.userId));
            if (!socket || player.isAI) return;

            const targets = alivePlayers
                .filter(p => p.userId !== player.userId)
                .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

            socket.emit('vote_required', {
                phase: 'vote',
                targets: targets,
                message: '请选择要投票淘汰的玩家',
                timeLimit: 60000
            });
        });

        const initialVoteStats = room.game.actions.getVoteResults();
        this.io.to(roomId).emit('vote_phase_started', {
            phase: 'vote',
            alivePlayers: alivePlayers.map(p => ({
                userId: p.userId,
                username: p.username,
                position: p.pos
            })),
            voteStats: initialVoteStats,
            timeLimit: 60000,
            timestamp: new Date().toISOString()
        });

        this.setPhaseTimer(roomId, () => this.finishVotePhase(roomId), 60000);
        return { success: true };
    }

    finishNightPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (room?.game.state.currentPhase !== 'night') return;

        this.clearPhaseTimer(roomId);
        const nightResults = this.executeNightActions(roomId);
        
        const gameEndCheck = room.game.checkGameEnd();
        if (gameEndCheck.ended) {
            this.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
            return { success: true, gameEnded: true };
        }

        this.startDayPhase(roomId, nightResults);
        return { success: true };
    }

    executeNightActions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const results = [];

        const killResult = room.game.actions.werewolfKill();
        if (killResult) {
            results.push({
                type: 'werewolf_kill',
                target: killResult.killed,
                saved: killResult.saved
            });
        }

        const witchResults = room.game.actions.witchAction();
        results.push(...witchResults.map(r => ({ type: 'witch_action', ...r })));

        return results;
    }

    async finishVotePhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (room?.game.state.currentPhase !== 'vote') return;

        this.clearPhaseTimer(roomId);
        const voteResult = room.game.actions.dayVote();
        
        this.broadcastVoteResults(roomId, voteResult.voteStats);
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (voteResult.success) {
            this.eventBroadcaster.broadcastSystemMessage(roomId,
                `🗳️ ${voteResult.eliminated.username} 被投票淘汰！`);
            
            const eliminatedRole = room.game.state.roleAssignments[voteResult.eliminated.userId];
            if (eliminatedRole === 'hunter') {
                return this.triggerHunterSkill(roomId, voteResult.eliminated.userId);
            }
        } else {
            if (voteResult.tiedCandidates) {
                const tiedNames = voteResult.tiedCandidates.map(c => `${c.username}(${c.voteCount}票)`).join(', ');
                this.eventBroadcaster.broadcastSystemMessage(roomId, `🤝 投票平票！${tiedNames}`);
            } else {
                this.eventBroadcaster.broadcastSystemMessage(roomId, voteResult.message);
            }
        }

        this.eventBroadcaster.broadcastRoomUsers(roomId);

        const gameEndCheck = room.game.checkGameEnd();
        if (gameEndCheck.ended) {
            this.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
            return { success: true, gameEnded: true };
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        this.setPhaseTimer(roomId, () => this.startNightPhase(roomId), 5000);
        
        return { success: true };
    }

    checkAndProgressPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) return;

        if (room.game.state.currentPhase === 'night') {
            this.checkWerewolfActionsComplete(roomId);
        }

        if (room.game.state.isPhaseCompleted()) {
            logger.info(`房间 ${roomId} 阶段 ${room.game.state.currentPhase} 所有行动已完成，自动进入下一阶段`);
            
            this.clearPhaseTimer(roomId);
            
            switch (room.game.state.currentPhase) {
                case 'night':
                    this.finishNightPhase(roomId);
                    break;
                case 'day':
                    this.startVotePhase(roomId);
                    break;
                case 'vote':
                    this.finishVotePhase(roomId);
                    break;
            }
        } else {
            const progress = room.game.state.getPhaseProgress();
            this.io.to(roomId).emit('phase_progress', {
                phase: room.game.state.currentPhase,
                progress: progress,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    setRequiredActors(room, phase) {
        room.game.state.resetPhaseCompletions();
        const alivePlayers = room.game.getAlivePlayers();
        
        if (phase === 'night') {
            alivePlayers.forEach(player => {
                const role = room.game.state.roleAssignments[player.userId];
                if (['werewolf', 'seer', 'witch'].includes(role)) {
                    room.game.state.phaseCompletions.requiredNightRoles.add(player.userId);
                }
            });
        } else if (phase === 'vote') {
            alivePlayers.forEach(player => {
                room.game.state.phaseCompletions.requiredVoters.add(player.userId);
            });
        }
    }

    forceNextPhase(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive || room.creatorId !== userId) {
            return { success: false, message: '权限不足' };
        }

        switch (room.game.state.currentPhase) {
            case 'night': this.finishNightPhase(roomId); break;
            case 'day': this.startVotePhase(roomId); break;
            case 'vote': this.finishVotePhase(roomId); break;
            default: return { success: false, message: '当前阶段无法强制跳过' };
        }

        return { success: true };
    }

    restartGame(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || room.creatorId !== userId) {
            return { success: false, message: '权限不足' };
        }

        this.clearPhaseTimer(roomId);
        room.game.reset();
        room.users.forEach(user => user.clearRole());
        room.game.assignRoles();
        room.game.start();

        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏重新开始！');
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        setTimeout(() => this.startNightPhase(roomId), 3000);
        return { success: true };
    }

    async endGame(roomId, winner, message) {
        const room = this.globalState.getRoom(roomId);
        if (!room) return;

        this.clearPhaseTimer(roomId);
        room.endGame();

        this.eventBroadcaster.broadcastSystemMessage(roomId, message);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏结束！房间已重置，可以开始新游戏。');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        logger.info(`房间 ${roomId} 游戏结束，胜者: ${winner}`);
    }

    broadcastVoteResults(roomId, voteStats) {
        const room = this.globalState.getRoom(roomId);
        if (!room) return;

        const resultMessage = this.formatVoteResults(voteStats, room);
        
        this.eventBroadcaster.broadcastSystemMessage(roomId, resultMessage);
    }

    formatVoteResults(voteStats, room) {
        const { voteResults, voterDetails, totalVotes, alivePlayers } = voteStats;
        
        let message = `📊 投票淘汰结果统计\n总投票数: ${totalVotes}/${alivePlayers}\n`;

        if (Object.keys(voteResults).length === 0) {
            message += "• 无人获得投票\n";
        } else {
            Object.entries(voteResults).forEach(([targetId, data]) => {
                const target = room.getUser(targetId);
                const targetName = target ? target.username : '未知用户';
                const voterNames = data.voters.map(v => v.username).join(', ');
                message += `• ${targetName}: ${data.count}票 (投票者: ${voterNames})\n`;
            });
        }

        const votedUserIds = new Set(Object.keys(voterDetails));
        const aliveUsers = room.game.getAlivePlayers();
        const notVotedUsers = aliveUsers.filter(user => !votedUserIds.has(user.userId));
        
        if (notVotedUsers.length > 0) {
            message += `• 未投票: ${notVotedUsers.map(u => u.username).join(', ')}\n`;
        }

        return message;
    }

    triggerHunterSkill(roomId, hunterId) {
        const room = this.globalState.getRoom(roomId);
        const hunter = room.getUser(hunterId);
        
        if (!hunter) return;

        this.eventBroadcaster.broadcastSystemMessage(roomId,
            `${hunter.username} 是猎人！可以选择一名玩家一起出局。`);

        if (hunter.isAI) {
            const alivePlayers = room.game.getAlivePlayers();
            if (alivePlayers.length > 0) {
                const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                room.game.actions.hunterShoot(randomTarget.userId);
                this.eventBroadcaster.broadcastSystemMessage(roomId,
                    `猎人带走了 ${randomTarget.username}！`);
            }
            
            const gameEndCheck = room.game.checkGameEnd();
            if (gameEndCheck.ended) {
                this.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
            } else {
                this.startNightPhase(roomId);
            }
        } else {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(hunterId));
            if (socket) {
                const alivePlayers = room.game.getAlivePlayers();
                const targets = alivePlayers.map(p => ({
                    userId: p.userId,
                    username: p.username,
                    position: p.pos
                }));

                socket.emit('hunter_skill_required', {
                    targets: targets,
                    message: '请选择要带走的玩家',
                    timeLimit: 30000
                });

                this.setPhaseTimer(roomId, () => {
                    if (alivePlayers.length > 0) {
                        const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                        room.game.actions.hunterShoot(randomTarget.userId);
                        this.eventBroadcaster.broadcastSystemMessage(roomId,
                            `猎人自动带走了 ${randomTarget.username}！`);
                        
                        const gameEndCheck = room.game.checkGameEnd();
                        if (gameEndCheck.ended) {
                            this.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
                        } else {
                            this.startNightPhase(roomId);
                        }
                    }
                }, 30000);
            }
        }
    }

        startOrderedDiscussion(roomId) {
        const room = this.globalState.getRoom(roomId);
        const alivePlayers = room.game.getAlivePlayers();
        
        const sortedPlayers = alivePlayers.sort((a, b) => a.pos - b.pos);
        room.game.state.discussion.speakingOrder = sortedPlayers.map(p => p.userId);
        
        if (sortedPlayers.length === 0) {
            this.startVotePhase(roomId);
            return;
        }

        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `📢 开始依次发言，每人限时5分钟。发言顺序：${sortedPlayers.map(p => `${p.pos}号-${p.username}`).join(', ')}`);
        
        this.nextSpeaker(roomId);
    }

    nextSpeaker(roomId) {
        const room = this.globalState.getRoom(roomId);
        const state = room.game.state;
        
        this.clearSpeakerTimer(roomId);
        
        if (state.discussion.currentSpeakerIndex >= state.discussion.speakingOrder.length) {
            this.eventBroadcaster.broadcastSystemMessage(roomId, '💬 所有玩家发言完毕，即将进入投票阶段。');
            setTimeout(() => this.startVotePhase(roomId), 3000);
            return;
        }
        
        const speakerId = state.discussion.speakingOrder[state.discussion.currentSpeakerIndex];
        const speaker = room.getUser(speakerId);
        
        if (!speaker || !speaker.isAlive) {
            state.discussion.currentSpeakerIndex++;
            this.nextSpeaker(roomId);
            return;
        }
        
        state.discussion.currentSpeakerId = speakerId;
        state.discussion.speakingStartTime = Date.now();
        
        this.io.to(roomId).emit('speaker_change', {
            currentSpeaker: {
                userId: speaker.userId,
                username: speaker.username,
                position: speaker.pos
            },
            speakerIndex: state.discussion.currentSpeakerIndex,
            totalSpeakers: state.discussion.speakingOrder.length,
            timeLimit: 300000 
        });
        
        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `🎤 现在是 ${speaker.pos}号玩家 ${speaker.username} 的发言时间（限时5分钟）`);
        if (speaker.isAI) {
            this.handleAISpeech(roomId, speaker);
        } else {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(speakerId));
            if (socket) {
                socket.emit('your_turn_to_speak', {
                    message: '现在是您的发言时间，限时5分钟',
                    timeLimit: 300000
                });
            }
        }
        
        this.setSpeakerTimer(roomId, () => {
            this.endCurrentSpeech(roomId);
        }, 300000); 
    }

    handleAISpeech(roomId, speaker) {
        const messages = [
            `我觉得昨晚的情况很可疑...`,
            `根据我的观察，我怀疑有人在说谎。`,
            `我是好人，请大家相信我。`,
            `我们需要仔细分析昨晚的情况。`
        ];
        
        setTimeout(() => {
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.eventBroadcaster.broadcastDiscussionMessage(roomId, speaker.userId, message);
            
            setTimeout(() => {
                this.endCurrentSpeech(roomId);
            }, 2000 + Math.random() * 1000);
        }, 1000);
    }

    endCurrentSpeech(roomId) {
        const room = this.globalState.getRoom(roomId);
        const state = room.game.state;
        
        const speaker = room.getUser(state.discussion.currentSpeakerId);
        if (speaker) {
            this.eventBroadcaster.broadcastSystemMessage(roomId, 
                `⏱️ ${speaker.username} 的发言时间结束。`);
            state.discussion.speakersCompleted.add(state.discussion.currentSpeakerId);
        }
        
        state.discussion.currentSpeakerIndex++;
        state.discussion.currentSpeakerId = null;
        
        this.io.to(roomId).emit('speech_ended', {
            speakerId: speaker?.userId,
            nextSpeakerIndex: state.discussion.currentSpeakerIndex
        });
        
        setTimeout(() => this.nextSpeaker(roomId), 1000);
    }

    endSpeech(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive || room.game.state.currentPhase !== 'day') {
            return { success: false, message: '当前不是讨论阶段' };
        }
        
        if (room.game.state.discussion.currentSpeakerId !== userId) {
            return { success: false, message: '当前不是您的发言时间' };
        }
        
        this.endCurrentSpeech(roomId);
        return { success: true, message: '发言结束' };
    }

    clearSpeakerTimer(roomId) {
        if (this.speakerTimers.has(roomId)) {
            clearTimeout(this.speakerTimers.get(roomId));
            this.speakerTimers.delete(roomId);
        }
    }

    setSpeakerTimer(roomId, callback, delay) {
        this.clearSpeakerTimer(roomId);
        const timer = setTimeout(() => {
            this.speakerTimers.delete(roomId);
            callback();
        }, delay);
        this.speakerTimers.set(roomId, timer);
    }

    clearPhaseTimer(roomId) {
        if (this.phaseTimers.has(roomId)) {
            clearTimeout(this.phaseTimers.get(roomId));
            this.phaseTimers.delete(roomId);
        }
    }

    setPhaseTimer(roomId, callback, delay) {
        this.clearPhaseTimer(roomId);
        const timer = setTimeout(() => {
            this.phaseTimers.delete(roomId);
            callback();
        }, delay);
        this.phaseTimers.set(roomId, timer);
    }
}