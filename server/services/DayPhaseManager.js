export default class DayPhaseManager {
    constructor(io, eventBroadcaster, globalState, timerManager, phaseManager) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = globalState;
        this.timerManager = timerManager;
        this.phaseManager = phaseManager;
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

    startOrderedDiscussion(roomId) {
        const room = this.globalState.getRoom(roomId);
        const alivePlayers = room.game.getAlivePlayers();
        
        const sortedPlayers = alivePlayers.sort((a, b) => a.pos - b.pos);
        room.game.state.discussion.speakingOrder = sortedPlayers.map(p => p.userId);
        
        if (sortedPlayers.length === 0) {
            this.phaseManager.voteManager.startVotePhase(roomId);
            return;
        }

        this.eventBroadcaster.broadcastSystemMessage(roomId, 
            `📢 开始依次发言，每人限时5分钟。发言顺序：${sortedPlayers.map(p => `${p.pos}号-${p.username}`).join(', ')}`);
        
        this.nextSpeaker(roomId);
    }

    nextSpeaker(roomId) {
        const room = this.globalState.getRoom(roomId);
        const state = room.game.state;
        
        this.timerManager.clearSpeakerTimer(roomId);
        
        if (state.discussion.currentSpeakerIndex >= state.discussion.speakingOrder.length) {
            this.eventBroadcaster.broadcastSystemMessage(roomId, '💬 所有玩家发言完毕，即将进入投票阶段。');
            setTimeout(() => this.phaseManager.voteManager.startVotePhase(roomId), 3000);
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
            this.phaseManager.skillManager.handleAISpeech(roomId, speaker);
        } else {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(speakerId));
            if (socket) {
                socket.emit('your_turn_to_speak', {
                    message: '现在是您的发言时间，限时5分钟',
                    timeLimit: 300000
                });
            }
        }
        
        this.timerManager.setSpeakerTimer(roomId, () => {
            this.endCurrentSpeech(roomId);
        }, 300000); 
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
}