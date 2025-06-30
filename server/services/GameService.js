// services/GameService.js
import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';

class GameService {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
        // 存储定时器引用
        this.phaseTimers = new Map();
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

    // 检查阶段是否完成，如果完成则自动进入下一阶段
    checkAndProgressPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) return;

        if (room.game.isPhaseCompleted()) {
            logger.info(`房间 ${roomId} 阶段 ${room.game.currentPhase} 所有行动已完成，自动进入下一阶段`);
            
            // 清除定时器
            this.clearPhaseTimer(roomId);
            
            // 进入下一阶段
            switch (room.game.currentPhase) {
                case 'night':
                    this.finishNightPhase(roomId);
                    break;
                case 'vote':
                    this.finishVotePhase(roomId);
                    break;
                case 'day':
                    this.startVotePhase(roomId);
                    break;
            }
        } else {
            // 广播进度更新
            const progress = room.game.getPhaseProgress();
            this.io.to(roomId).emit('phase_progress', {
                phase: room.game.currentPhase,
                progress: progress,
                timestamp: new Date().toISOString()
            });
        }
    }

    // 清除阶段定时器
    clearPhaseTimer(roomId) {
        if (this.phaseTimers.has(roomId)) {
            clearTimeout(this.phaseTimers.get(roomId));
            this.phaseTimers.delete(roomId);
        }
    }

    // 设置阶段定时器
    setPhaseTimer(roomId, callback, delay) {
        this.clearPhaseTimer(roomId);
        const timer = setTimeout(() => {
            this.phaseTimers.delete(roomId);
            callback();
        }, delay);
        this.phaseTimers.set(roomId, timer);
    }

    startNightPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        room.game.changePhase('night');
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `第 ${room.game.dayCount} 天夜晚开始，请各角色执行夜间行动。`);

        this.sendNightActionInstructions(roomId);

        // 设置超时自动结束
        this.setPhaseTimer(roomId, () => {
            this.finishNightPhase(roomId);
        }, 120000);

        return { success: true };
    }

    sendNightActionInstructions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const alivePlayers = room.game.getAlivePlayers();

        alivePlayers.forEach(player => {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(player.userId));
            if (!socket || player.isAI) return;

            const role = room.game.roleAssignments[player.userId];
            
            switch (role) {
                case 'werewolf':
                    this.sendWerewolfAction(socket, roomId, player);
                    break;
                case 'seer':
                    this.sendSeerAction(socket, roomId, player);
                    break;
                case 'witch':
                    this.sendWitchAction(socket, roomId, player);
                    break;
            }
        });
    }

    sendWerewolfAction(socket, roomId, player) {
        player.nightActionCompleted = false;
        const room = this.globalState.getRoom(roomId);
        const targets = room.game.getAlivePlayers()
            .filter(p => room.game.roleAssignments[p.userId] !== 'werewolf')
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        socket.emit('night_action_required', {
            action: 'werewolf_kill',
            phase: 'night',
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
        const lastNightDeath = room.game.lastNightDeath;
        const deadPlayer = lastNightDeath ? room.getUser(lastNightDeath) : null;
        
        const alivePlayers = room.game.getAlivePlayers()
            .filter(p => p.userId !== player.userId)
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        socket.emit('night_action_required', {
            action: 'witch_action',
            phase: 'night',
            hasAntidote: room.game.witchItems.hasAntidote,
            hasPoison: room.game.witchItems.hasPoison,
            deadPlayer: deadPlayer ? { 
                userId: deadPlayer.userId, 
                username: deadPlayer.username 
            } : null,
            alivePlayers: alivePlayers,
            message: '请选择是否使用解药或毒药',
            timeLimit: 120000
        });
    }

    finishNightPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || room.game.currentPhase !== 'night') {
            return { success: false, message: '当前不是夜晚阶段' };
        }

        // 清除定时器
        this.clearPhaseTimer(roomId);

        const nightResults = this.executeNightActions(roomId);
        
        const gameEndCheck = room.game.checkGameEnd();
        if (gameEndCheck.ended) {
            this.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
            return { success: true, gameEnded: true, winner: gameEndCheck.winner };
        }

        this.startDayPhase(roomId, nightResults);
        
        return { success: true };
    }

    executeNightActions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const results = [];

        const killResult = room.game.werewolfKill();
        if (killResult) {
            results.push({
                type: 'werewolf_kill',
                target: killResult.killed,
                saved: killResult.saved
            });
        }

        const witchResults = room.game.witchAction();
        results.push(...witchResults.map(r => ({ type: 'witch_action', ...r })));

        return results;
    }

    startDayPhase(roomId, nightResults) {
        const room = this.globalState.getRoom(roomId);
        room.game.changePhase('day');
        room.game.nextDay();

        this.announceNightResults(roomId, nightResults);

        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `第 ${room.game.dayCount} 天白天开始，请开始讨论。`);

        // 30秒讨论时间后进入投票阶段
        this.setPhaseTimer(roomId, () => {
            this.startVotePhase(roomId);
        }, 30000);

        return { success: true };
    }

    announceNightResults(roomId, results) {
        let announcements = [];

        results.forEach(result => {
            switch (result.type) {
                case 'werewolf_kill':
                    if (result.saved) {
                        announcements.push(`昨夜平安无事。`);
                    } else {
                        announcements.push(`昨夜 ${result.target.username} 被狼人击杀。`);
                    }
                    break;
                case 'witch_action':
                    if (result.action === 'poison') {
                        announcements.push(`昨夜 ${result.target.username} 被毒杀。`);
                    }
                    break;
            }
        });

        if (announcements.length === 0) {
            announcements.push('昨夜平安无事。');
        }

        announcements.forEach(announcement => {
            this.eventBroadcaster.broadcastSystemMessage(roomId, announcement);
        });
    }

    broadcastVoteResults(roomId, voteStats) {
        const room = this.globalState.getRoom(roomId);
        if (!room) return;

        const resultMessage = this.formatVoteResults(voteStats, room);
        
        this.io.to(roomId).emit('vote_results', {
            type: 'vote',
            voteStats: voteStats,
            message: resultMessage,
            timestamp: new Date().toISOString()
        });

        this.eventBroadcaster.broadcastSystemMessage(roomId, resultMessage);
        
        logger.info(`已广播房间 ${roomId} 的投票结果`);
    }

    formatVoteResults(voteStats, room) {
        const { voteResults, voterDetails, totalVotes, alivePlayers } = voteStats;
        
        let message = `\n📊 投票淘汰结果统计:\n`;
        message += `总投票数: ${totalVotes}/${alivePlayers}\n`;
        message += '─────────────────────\n';

        const sortedResults = Object.entries(voteResults)
            .sort(([,a], [,b]) => b.count - a.count);

        if (sortedResults.length === 0) {
            message += '🔸 无人获得投票\n';
        } else {
            sortedResults.forEach(([targetId, data], index) => {
                const target = room.getUser(targetId);
                const targetName = target ? target.username : '未知用户';
                const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔸';
                
                message += `${emoji} ${targetName}: ${data.count}票\n`;
                
                if (data.voters.length > 0) {
                    const voterNames = data.voters.map(v => v.username).join(', ');
                    message += `   └─ 投票者: ${voterNames}\n`;
                }
            });
        }

        message += '─────────────────────\n';

        const votedUserIds = new Set(Object.keys(voterDetails));
        const aliveUsers = room.game.getAlivePlayers();
        const notVotedUsers = aliveUsers.filter(user => !votedUserIds.has(user.userId));
        
        if (notVotedUsers.length > 0) {
            message += `❌ 未投票: ${notVotedUsers.map(u => u.username).join(', ')}\n`;
        }

        return message;
    }

    startVotePhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        room.game.changePhase('vote');
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, '🗳️ 投票阶段开始！请投票选择要淘汰的玩家。');

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

        const initialVoteStats = room.game.getVoteResults();
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

        // 60秒后自动结束投票
        this.setPhaseTimer(roomId, () => {
            this.finishVotePhase(roomId);
        }, 60000);

        return { success: true };
    }

    finishVotePhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || room.game.currentPhase !== 'vote') {
            return { success: false, message: '当前不是投票阶段' };
        }

        // 清除定时器
        this.clearPhaseTimer(roomId);

        const voteResult = room.game.dayVote();
        
        this.broadcastVoteResults(roomId, voteResult.voteStats);
        
        if (voteResult.success) {
            this.eventBroadcaster.broadcastSystemMessage(roomId, 
                `🗳️ ${voteResult.eliminated.username} 被投票淘汰！(获得${voteResult.voteCount}票)`);
            
            this.io.to(roomId).emit('player_eliminated', {
                eliminated: {
                    userId: voteResult.eliminated.userId,
                    username: voteResult.eliminated.username,
                    role: room.game.roleAssignments[voteResult.eliminated.userId],
                    position: room.game.positionAssignments[voteResult.eliminated.userId]
                },
                cause: 'vote',
                voteCount: voteResult.voteCount,
                day: room.game.dayCount,
                timestamp: new Date().toISOString()
            });
            
            const eliminatedRole = room.game.roleAssignments[voteResult.eliminated.userId];
            if (eliminatedRole === 'hunter') {
                this.triggerHunterSkill(roomId, voteResult.eliminated.userId);
                return { success: true };
            }
        } else {
            if (voteResult.tiedCandidates) {
                const tiedNames = voteResult.tiedCandidates.map(c => `${c.username}(${c.voteCount}票)`).join(', ');
                this.eventBroadcaster.broadcastSystemMessage(roomId, 
                    `🤝 投票平票！${tiedNames} - ${voteResult.message}`);
            } else {
                this.eventBroadcaster.broadcastSystemMessage(roomId, voteResult.message);
            }
        }

        this.eventBroadcaster.broadcastRoomUsers(roomId);

        const gameEndCheck = room.game.checkGameEnd();
        if (gameEndCheck.ended) {
            this.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
            return { success: true, gameEnded: true, winner: gameEndCheck.winner };
        }

        // 5秒后进入下一个夜晚
        this.setPhaseTimer(roomId, () => {
            this.startNightPhase(roomId);
        }, 5000);
        
        return { success: true };
    }

    // 统一的游戏结束处理
    endGame(roomId, winner, message) {
        const room = this.globalState.getRoom(roomId);
        if (!room) return;

        // 清除定时器
        this.clearPhaseTimer(roomId);
        
        // 结束游戏
        room.game.end(winner);
        
        // 重置房间状态为等待状态
        room.state = 'waiting';
        
        // 重置用户状态
        room.users.forEach(user => {
            user.clearRole();
            user.setVoted(false);
            user.setNightActionCompleted(false);
            user.isReady = false; // 重置准备状态
        });

        this.eventBroadcaster.broadcastSystemMessage(roomId, message);
        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏结束！房间已重置，可以开始新游戏。');
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        
        // 广播游戏结束事件
        this.io.to(roomId).emit('game_ended', {
            winner: winner,
            message: message,
            timestamp: new Date().toISOString()
        });
        
        logger.info(`房间 ${roomId} 游戏结束，胜者: ${winner}`);
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
                room.game.hunterShoot(randomTarget.userId);
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
                    if (room.game.nightActions.hunterShot === null) {
                        if (alivePlayers.length > 0) {
                            const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                            this.hunterShoot(roomId, hunterId, randomTarget.userId);
                        }
                    }
                }, 30000);
            }
        }
    }

    playerVote(roomId, voterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.game.currentPhase !== 'vote') {
            return { success: false, message: '当前不是投票阶段' };
        }

        const voter = room.getUser(voterId);
        const target = room.getUser(targetId);
        
        if (!voter || !target) {
            return { success: false, message: '玩家不存在' };
        }

        if (!voter.isAlive) {
            return { success: false, message: '死亡玩家无法投票' };
        }

        if (!target.isAlive) {
            return { success: false, message: '无法投票给已死亡的玩家' };
        }

        if (voterId === targetId) {
            return { success: false, message: '无法投票给自己' };
        }

        const totalVotes = room.game.recordVote(voterId, targetId);
        voter.setVoted(true);

        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `${voter.username} 投票给 ${target.username} (${totalVotes}/${room.game.getAlivePlayers().length})`);

        const voteStats = room.game.getVoteResults();
        this.io.to(roomId).emit('vote_update', {
            type: 'vote_cast',
            voter: {
                userId: voter.userId,
                username: voter.username
            },
            target: {
                userId: target.userId,
                username: target.username
            },
            voteStats: voteStats,
            timestamp: new Date().toISOString()
        });

        this.eventBroadcaster.broadcastRoomUsers(roomId);

        // 检查是否所有人都已投票，如果是则自动进入下一阶段
        this.checkAndProgressPhase(roomId);

        logger.info(`${voter.username} 在投票中投票给 ${target.username} (总投票数: ${totalVotes})`);
        
        return { success: true, message: '投票成功', totalVotes: totalVotes };
    }

    werewolfVote(roomId, voterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.game.currentPhase !== 'night') {
            return { success: false, message: '当前不是夜晚阶段' };
        }

        const voter = room.getUser(voterId);
        const target = room.getUser(targetId);
        
        if (!voter || !target) {
            return { success: false, message: '玩家不存在' };
        }

        const voterRole = room.game.roleAssignments[voterId];
        if (voterRole !== 'werewolf') {
            return { success: false, message: '只有狼人可以进行击杀投票' };
        }

        if (!voter.isAlive) {
            return { success: false, message: '死亡玩家无法行动' };
        }

        const targetRole = room.game.roleAssignments[targetId];
        if (targetRole === 'werewolf') {
            return { success: false, message: '狼人不能击杀同伴' };
        }

        if (!target.isAlive) {
            return { success: false, message: '无法击杀已死亡的玩家' };
        }

        room.game.recordWerewolfVote(voterId, targetId);
        voter.setNightActionCompleted(true);

        // 检查夜间阶段是否完成
        this.checkAndProgressPhase(roomId);

        logger.info(`狼人 ${voter.username} 投票击杀 ${target.username}`);
        
        return { success: true, message: '击杀投票成功' };
    }

    seerCheck(roomId, seerId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.game.currentPhase !== 'night') {
            return { success: false, message: '预言家只能在夜晚使用技能' };
        }

        const seer = room.getUser(seerId);
        const target = room.getUser(targetId);
        
        if (!seer || !target) {
            return { success: false, message: '玩家不存在' };
        }

        const seerRole = room.game.roleAssignments[seerId];
        if (seerRole !== 'seer') {
            return { success: false, message: '只有预言家可以使用此技能' };
        }

        if (!seer.isAlive) {
            return { success: false, message: '死亡玩家无法行动' };
        }

        if (!target.isAlive) {
            return { success: false, message: '无法查验已死亡的玩家' };
        }

        if (seerId === targetId) {
            return { success: false, message: '无法查验自己' };
        }

        const result = room.game.seerCheck(targetId);
        seer.setNightActionCompleted(true);

        // 标记预言家行动完成
        room.game.markPlayerActionCompleted(seerId, 'night');

        const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(seerId));
        if (socket) {
            socket.emit('seer_result', {
                target: result.target.username,
                position: result.target.pos,
                result: result.result,
                isWerewolf: result.isWerewolf
            });
        }

        // 检查夜间阶段是否完成
        this.checkAndProgressPhase(roomId);

        logger.info(`预言家 ${seer.username} 查验了 ${target.username}: ${result.result}`);
        
        return { success: true, message: '查验成功', result: result.result };
    }

    witchAction(roomId, witchId, action, targetId = null) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.game.currentPhase !== 'night') {
            return { success: false, message: '女巫只能在夜晚使用技能' };
        }

        const witch = room.getUser(witchId);
        if (!witch) {
            return { success: false, message: '玩家不存在' };
        }

        const witchRole = room.game.roleAssignments[witchId];
        if (witchRole !== 'witch') {
            return { success: false, message: '只有女巫可以使用此技能' };
        }

        if (!witch.isAlive) {
            return { success: false, message: '死亡玩家无法行动' };
        }

        if (action === 'save') {
            if (!room.game.witchItems.hasAntidote) {
                return { success: false, message: '解药已用完' };
            }
            
            if (targetId !== room.game.lastNightDeath) {
                return { success: false, message: '只能救活被狼人击杀的玩家' };
            }

            room.game.recordWitchAction('save', targetId);
            witch.setNightActionCompleted(true);
            
            logger.info(`女巫 ${witch.username} 使用解药救人`);
            
        } else if (action === 'poison') {
            if (!room.game.witchItems.hasPoison) {
                return { success: false, message: '毒药已用完' };
            }

            const target = room.getUser(targetId);
            if (!target || !target.isAlive) {
                return { success: false, message: '目标玩家不存在或已死亡' };
            }

            if (targetId === witchId) {
                return { success: false, message: '无法毒杀自己' };
            }

            room.game.recordWitchAction('poison', targetId);
            witch.setNightActionCompleted(true);
            
            logger.info(`女巫 ${witch.username} 使用毒药毒杀 ${target.username}`);
        }

        // 标记女巫行动完成
        room.game.markPlayerActionCompleted(witchId, 'night');

        // 检查夜间阶段是否完成
        this.checkAndProgressPhase(roomId);
        
        return { success: true, message: `${action === 'save' ? '解药' : '毒药'}使用成功` };
    }

    hunterShoot(roomId, hunterId, targetId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        const hunter = room.getUser(hunterId);
        const target = room.getUser(targetId);
        
        if (!hunter || !target) {
            return { success: false, message: '玩家不存在' };
        }

        const hunterRole = room.game.roleAssignments[hunterId];
        if (hunterRole !== 'hunter') {
            return { success: false, message: '只有猎人可以使用此技能' };
        }

        if (hunter.isAlive) {
            return { success: false, message: '猎人必须在死亡时才能使用技能' };
        }

        if (!target.isAlive) {
            return { success: false, message: '无法击杀已死亡的玩家' };
        }

        room.game.hunterShoot(targetId);
        
        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `猎人 ${hunter.username} 带走了 ${target.username}！`);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        // 清除猎人技能定时器
        this.clearPhaseTimer(roomId);

        const gameEndCheck = room.game.checkGameEnd();
        if (gameEndCheck.ended) {
            this.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
        } else {
            this.startNightPhase(roomId);
        }

        logger.info(`猎人 ${hunter.username} 击杀了 ${target.username}`);
        
        return { success: true, message: '猎人技能使用成功' };
    }

    skipAction(roomId, userId, actionType) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        const user = room.getUser(userId);
        if (!user) {
            return { success: false, message: '玩家不存在' };
        }

        user.setNightActionCompleted(true);
        
        // 标记行动完成
        if (actionType === 'night' || ['werewolf_kill', 'seer_check', 'witch_action'].includes(actionType)) {
            room.game.markPlayerActionCompleted(userId, 'night');
            // 检查夜间阶段是否完成
            this.checkAndProgressPhase(roomId);
        } else if (actionType === 'vote') {
            room.game.markPlayerActionCompleted(userId, 'vote');
            // 检查投票阶段是否完成
            this.checkAndProgressPhase(roomId);
        }
        
        logger.info(`${user.username} 跳过了 ${actionType} 行动`);
        
        return { success: true, message: '已跳过行动' };
    }

    forceNextPhase(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        if (room.creatorId !== userId) {
            return { success: false, message: '只有房主可以强制进入下一阶段' };
        }

        const currentPhase = room.game.currentPhase;
        
        switch (currentPhase) {
            case 'night':
                this.finishNightPhase(roomId);
                break;
            case 'day':
                this.startVotePhase(roomId);
                break;
            case 'vote':
                this.finishVotePhase(roomId);
                break;
            default:
                return { success: false, message: '当前阶段无法强制跳过' };
        }

        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `房主强制进入下一阶段`);
        
        return { success: true, message: '已强制进入下一阶段' };
    }

    restartGame(roomId, userId) {
        const room = this.globalState.getRoom(roomId);
        if (!room) {
            return { success: false, message: '房间不存在' };
        }

        if (room.creatorId !== userId) {
            return { success: false, message: '只有房主可以重新开始游戏' };
        }

        // 清除定时器
        this.clearPhaseTimer(roomId);

        room.game.reset();
        
        room.users.forEach(user => {
            user.clearRole();
            user.setVoted(false);
            user.setNightActionCompleted(false);
        });

        room.game.assignRoles();
        room.game.start();

        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏重新开始！');
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        setTimeout(() => {
            this.startNightPhase(roomId);
        }, 3000);
        
        return { success: true, message: '游戏已重新开始' };
    }

    printRoleAssignments(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room || !room.game.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        const assignments = [];

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

        assignments.sort((a, b) => a.position - b.position);

        const output = this.formatRoleAssignments(assignments);

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
            witch: '🧙‍♀️',
            hunter: '🏹'
        };
        return emojiMap[role] || '👤';
    }

    formatRoleAssignments(assignments) {
        let output = '🎮 角色分配结果:\n';
        output += '========================\n';

        assignments.forEach(a => {
            output += `${a.position}号位 ${a.emoji} ${a.username}${a.isAI ? ' (AI)' : ''}: ${a.role}\n`;
        });

        const stats = {
            total: assignments.length,
            werewolves: assignments.filter(a => a.role === 'werewolf').length,
            villagers: assignments.filter(a => a.role === 'villager').length,
            seers: assignments.filter(a => a.role === 'seer').length,
            witches: assignments.filter(a => a.role === 'witch').length,
            hunters: assignments.filter(a => a.role === 'hunter').length
        };

        output += '========================\n';
        output += `总计: ${stats.total} 名玩家\n`;
        output += `🐺 狼人: ${stats.werewolves} 名\n`;
        output += `👨‍🌾 平民: ${stats.villagers} 名\n`;
        output += `👁️ 预言家: ${stats.seers} 名\n`;
        output += `🧙‍♀️ 女巫: ${stats.witches} 名\n`;
        output += `🏹 猎人: ${stats.hunters} 名\n`;

        return output;
    }
}

export default GameService;