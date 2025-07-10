export default class GameState {
    constructor() {
        this.isActive = false;
        this.startTime = null;
        this.endTime = null;
        this.round = 0;
        this.currentPhase = null;
        this.dayCount = 1;
        this.phaseStartTime = null;
        this.isFirstNight = true;
        
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
        this.isFirstNight = true;
        this.resetVotes();
        this.resetNightActions();
        this.resetPhaseCompletions();
    }

    end(winner = null) {
        this.isActive = false;
        this.endTime = new Date().toISOString();
        this.winner = winner;
        this.resetPhaseCompletions();
    }

    reset() {
        this.isActive = false;
        this.round = 0;
        this.currentPhase = null;
        this.startTime = null;
        this.endTime = null;
        this.dayCount = 1;
        this.isFirstNight = true;
        this.roleAssignments = {};
        this.positionAssignments = {};
        this.resetVotes();
        this.resetNightActions();
        this.resetPhaseCompletions();
        this.deathRecord = [];
        this.lastNightDeath = null;
        this.witchItems = { hasAntidote: true, hasPoison: true };
    }

    nextDay() {
        this.dayCount++;
        this.round++;
        this.isFirstNight = false;
    }

    resetVotes() {
        this.votes = {};
        this.voteDetails = {};
    }

    resetNightActions() {
        this.nightActions = {
            werewolfVotes: {},
            witchActions: { save: null, poison: null },
            seerCheck: null,
            hunterShot: null
        };
    }

    resetPhaseCompletions() {
        this.phaseCompletions = {
            nightActionsCompleted: new Set(),
            votesCompleted: new Set(),
            requiredNightRoles: new Set(),
            requiredVoters: new Set()
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
            phaseProgress: this.getPhaseProgress(),
            isFirstNight: this.isFirstNight
        };
    }

    getPhaseProgress() {
        if (this.currentPhase === 'night') {
            return {
                completed: this.phaseCompletions.nightActionsCompleted.size,
                required: this.phaseCompletions.requiredNightRoles.size,
                type: 'night'
            };
        } else if (this.currentPhase === 'day') {
            return { completed: 1, required: 1, type: 'day' };
        } else if (this.currentPhase === 'vote') {
            return {
                completed: Object.keys(this.voteDetails).length,
                required: this.phaseCompletions.requiredVoters.size,
                type: 'vote'
            };
        }
        return { completed: 0, required: 0, type: 'unknown' };
    }

    isPhaseCompleted() {
        if (this.currentPhase === 'night') {
            for (const userId of this.phaseCompletions.requiredNightRoles) {
                if (!this.phaseCompletions.nightActionsCompleted.has(userId)) {
                    return false;
                }
            }
            return true;
        } else if (this.currentPhase === 'day') {
            
            return true; 
        } else if (this.currentPhase === 'vote') {
            for (const userId of this.phaseCompletions.requiredVoters) {
                if (!this.phaseCompletions.votesCompleted.has(userId) && !this.voteDetails[userId]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
}