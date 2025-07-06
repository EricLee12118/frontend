export default class User {
    constructor({userId, username, userAvatar = '', isAI = false, isReady = false, isRoomOwner = false}) {
        this.userId = userId;
        this.username = username;
        this.userAvatar = userAvatar;
        this.isAI = isAI;
        this.isReady = isReady;
        this.isRoomOwner = isRoomOwner;
        this.role = null;
        this.isAlive = true;
        this.pos = null;
        this.hasVoted = false;
        this.nightActionCompleted = false;
    }

    toggleReady() {
        this.isReady = !this.isReady;
        return this;
    }

    setRole(role) {
        this.role = role;
        return this;
    }

    setPos(pos) {
        this.pos = pos;
        return this;
    }

    setAlive(alive) {
        this.isAlive = alive;
        return this;
    }

    setVoted(hasVoted) {
        this.hasVoted = hasVoted;
        return this;
    }

    setNightActionCompleted(completed) {
        this.nightActionCompleted = completed;
        return this;
    }

    setRoomOwner(isOwner) {
        this.isRoomOwner = isOwner;
        return this;
    }

    clearRole() {
        this.role = null;
        this.isAlive = true;
        this.hasVoted = false;
        this.nightActionCompleted = false;
        return this;
    }

    toJSON() {
        return {
            userId: this.userId,
            username: this.username,
            userAvatar: this.userAvatar,
            isAI: this.isAI,
            isReady: this.isReady,
            isRoomOwner: this.isRoomOwner,
            isAlive: this.isAlive,
            pos: this.pos,
            hasVoted: this.hasVoted,
            nightActionCompleted: this.nightActionCompleted,
            ...(this.role && { hasRole: true })
        };
    }
}