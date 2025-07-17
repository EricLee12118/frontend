export default class TimerManager {
    constructor() {
        this.phaseTimers = new Map();
        this.speakerTimers = new Map();
    }

    setPhaseTimer(roomId, callback, delay) {
        this.clearPhaseTimer(roomId);
        const timer = setTimeout(() => {
            this.phaseTimers.delete(roomId);
            callback();
        }, delay);
        this.phaseTimers.set(roomId, timer);
    }

    clearPhaseTimer(roomId) {
        if (this.phaseTimers.has(roomId)) {
            clearTimeout(this.phaseTimers.get(roomId));
            this.phaseTimers.delete(roomId);
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

    clearSpeakerTimer(roomId) {
        if (this.speakerTimers.has(roomId)) {
            clearTimeout(this.speakerTimers.get(roomId));
            this.speakerTimers.delete(roomId);
        }
    }

    clearAllTimers(roomId) {
        this.clearPhaseTimer(roomId);
        this.clearSpeakerTimer(roomId);
    }
}