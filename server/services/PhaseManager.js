import GlobalState from '../models/GlobalState.js';
import TimerManager from './TimerManager.js';
import NightPhaseManager from './NightPhaseManager.js';
import DayPhaseManager from './DayPhaseManager.js';
import VotePhaseManager from './VotePhaseManager.js';
import SkillManager from './SkillManager.js';
import GameLifecycleManager from './GameLifecycleManager.js';
import logger from '../config/logger.js';
export default class PhaseManager {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
        this.timerManager = new TimerManager();
        
        this.nightManager = new NightPhaseManager(
            io, eventBroadcaster, this.globalState, this.timerManager, this
        );
        this.dayManager = new DayPhaseManager(
            io, eventBroadcaster, this.globalState, this.timerManager, this
        );
        this.voteManager = new VotePhaseManager(
            io, eventBroadcaster, this.globalState, this.timerManager, this
        );
        this.skillManager = new SkillManager(
            io, eventBroadcaster, this.globalState, this.timerManager, this
        );
        this.lifecycleManager = new GameLifecycleManager(
            io, eventBroadcaster, this.globalState, this.timerManager, this
        );
    }

    startNightPhase(roomId) {
        return this.nightManager.startNightPhase(roomId);
    }
    
    startDayPhase(roomId, nightResults) {
        return this.dayManager.startDayPhase(roomId, nightResults);
    }
    
    startVotePhase(roomId) {
        return this.voteManager.startVotePhase(roomId);
    }
    
    finishNightPhase(roomId) {
        return this.nightManager.finishNightPhase(roomId);
    }
    
    endSpeech(roomId, userId) {
        return this.dayManager.endSpeech(roomId, userId);
    }
    
    restartGame(roomId, userId) {
        return this.lifecycleManager.restartGame(roomId, userId);
    }
    
    forceNextPhase(roomId, userId) {
        return this.lifecycleManager.forceNextPhase(roomId, userId);
    }
    
    clearAllTimers(roomId) {
        this.timerManager.clearAllTimers(roomId);
    }
    
    checkAndProgressPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) return;

        if (room.game.state.currentPhase === 'night') {
            this.nightManager.checkWerewolfActionsComplete(roomId);
        }

        if (room.game.state.isPhaseCompleted()) {
            logger.info(`房间 ${roomId} 阶段 ${room.game.state.currentPhase} 所有行动已完成，自动进入下一阶段`);
            
            this.timerManager.clearPhaseTimer(roomId);
            
            switch (room.game.state.currentPhase) {
                case 'night':
                    this.nightManager.finishNightPhase(roomId);
                    break;
                case 'day':
                    this.voteManager.startVotePhase(roomId);
                    break;
                case 'vote':
                    this.voteManager.finishVotePhase(roomId);
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
}