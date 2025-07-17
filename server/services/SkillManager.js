export default class SkillManager {
    constructor(io, eventBroadcaster, globalState, timerManager, phaseManager) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = globalState;
        this.timerManager = timerManager;
        this.phaseManager = phaseManager;
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
                this.phaseManager.lifecycleManager.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
            } else {
                this.phaseManager.nightManager.startNightPhase(roomId);
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

                this.timerManager.setPhaseTimer(roomId, () => {
                    if (alivePlayers.length > 0) {
                        const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                        room.game.actions.hunterShoot(randomTarget.userId);
                        this.eventBroadcaster.broadcastSystemMessage(roomId,
                            `猎人自动带走了 ${randomTarget.username}！`);
                        
                        const gameEndCheck = room.game.checkGameEnd();
                        if (gameEndCheck.ended) {
                            this.phaseManager.lifecycleManager.endGame(roomId, gameEndCheck.winner, gameEndCheck.message);
                        } else {
                            this.phaseManager.nightManager.startNightPhase(roomId);
                        }
                    }
                }, 30000);
            }
        }
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
                this.phaseManager.dayManager.endCurrentSpeech(roomId);
            }, 2000 + Math.random() * 1000);
        }, 1000);
    }
}