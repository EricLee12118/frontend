import logger from "../config/logger.js";

export default class VotePhaseManager {
    constructor(io, eventBroadcaster, globalState, timerManager, phaseManager) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = globalState;
        this.timerManager = timerManager;
        this.phaseManager = phaseManager;
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
        
        // 添加调试日志
        logger.info(`[投票阶段] 房间 ${roomId} 开始投票，存活玩家: ${alivePlayers.length}`);
        logger.info(`[投票阶段] AI玩家数量: ${alivePlayers.filter(p => p.isAI).length}`);
        
        // 处理AI玩家投票 - 确保调用
        this.handleAIVotes(roomId, alivePlayers);
        
        // 处理人类玩家投票
        alivePlayers.forEach(player => {
            // AI玩家已在上面处理过，跳过
            if (player.isAI) return;
            
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(player.userId));
            if (!socket) return;

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

        this.timerManager.setPhaseTimer(roomId, () => this.finishVotePhase(roomId), 60000);
        return { success: true };
    }

    handleAIVotes(roomId, alivePlayers) {
        const room = this.globalState.getRoom(roomId);
        if (!room) {
            logger.error(`[投票阶段] 房间 ${roomId} 不存在`);
            return;
        }

        const aiPlayers = alivePlayers.filter(player => player.isAI);
        
        logger.info(`[投票阶段] 房间 ${roomId} 有 ${aiPlayers.length} 个AI玩家需要投票`);
        
        aiPlayers.forEach(player => {
            const delay = 500 + Math.random() * 2000;
            
            setTimeout(() => {
                try {
                    const voteTargets = alivePlayers.filter(p => 
                        p.userId !== player.userId && p.isAlive
                    );
                    
                    logger.info(`[投票阶段] AI玩家 ${player.username} 有 ${voteTargets.length} 个可投票目标`);
                    
                    if (voteTargets.length > 0) {
                        const randomIndex = Math.floor(Math.random() * voteTargets.length);
                        const target = voteTargets[randomIndex];
                        
                        logger.info(`[投票阶段] AI玩家 ${player.username} 投票给 ${target.username}`);
                        
                        const success = room.game.castVote(player.userId, target.userId);
                        
                        if (!success) {
                            logger.error(`[投票阶段] AI玩家 ${player.username} 投票失败`);
                        }
                        
                        room.game.state.phaseCompletions.voteCompleted.add(player.userId);
                        
                        this.checkAndProgressPhase(roomId);
                    } else {
                        logger.warn(`[投票阶段] AI玩家 ${player.username} 没有可投票的目标`);
                    }
                } catch (error) {
                    logger.error(`[投票阶段] AI投票错误: ${error.message}`, error);
                }
            }, delay);
        });
    }

    async finishVotePhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (room?.game.state.currentPhase !== 'vote') {
            logger.warn(`[投票阶段] 房间 ${roomId} 尝试结束非投票阶段`);
            return;
        }

        this.timerManager.clearPhaseTimer(roomId);
        const voteResult = room.game.actions.dayVote();
        
        this.broadcastVoteResults(roomId, voteResult.voteStats);
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (voteResult.success) {
            this.eventBroadcaster.broadcastSystemMessage(roomId,
                `🗳️ ${voteResult.eliminated.username} 被投票淘汰！`);
            
            const eliminatedRole = room.game.state.roleAssignments[voteResult.eliminated.userId];
            if (eliminatedRole === 'hunter') {
                logger.info(`[投票阶段] 触发猎人技能: ${voteResult.eliminated.username}`);
                return this.phaseManager.skillManager.triggerHunterSkill(roomId, voteResult.eliminated.userId);
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
            logger.info(`[投票阶段] 游戏结束: ${gameEndCheck.message}`);
            this.phaseManager.lifecycleManager.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
            return { success: true, gameEnded: true };
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        logger.info(`[投票阶段] 房间 ${roomId} 投票结束，进入夜晚阶段`);
        this.timerManager.setPhaseTimer(roomId, () => this.phaseManager.nightManager.startNightPhase(roomId), 5000);
        
        return { success: true };
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

    setRequiredActors(room, phase) {
        room.game.state.resetPhaseCompletions();
        const alivePlayers = room.game.getAlivePlayers();
        
        if (phase === 'vote') {
            alivePlayers.forEach(player => {
                room.game.state.phaseCompletions.requiredVoters.add(player.userId);
            });
        }
    }
    
    checkAndProgressPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.state.isActive) {
            logger.warn(`[投票阶段] 房间 ${roomId} 无效或游戏未激活`);
            return;
        }
        
        const completed = room.game.state.phaseCompletions.voteCompleted.size;
        const required = room.game.state.phaseCompletions.requiredVoters.size;
        logger.info(`[投票阶段] 房间 ${roomId} 投票进度: ${completed}/${required}`);
        
        if (room.game.state.currentPhase === 'vote' && 
            room.game.state.isPhaseCompleted()) {
            logger.info(`[投票阶段] 房间 ${roomId} 所有玩家已完成投票，自动结束投票`);
            this.timerManager.clearPhaseTimer(roomId);
            this.finishVotePhase(roomId);
        }
    }
}