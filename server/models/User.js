// models/User.js
class User {
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
        this.isSheriff = false;
        this.hasVoted = false;
        this.nightActionCompleted = false;
    }

    toggleReady() {
        this.isReady = !this.isReady;
        return this.isReady;
    }

    setRole(role) { 
        this.role = role; 
        return this;
    }
    
    clearRole() { 
        this.role = null; 
        this.isAlive = true;
        this.isSheriff = false;
        this.hasVoted = false;
        this.nightActionCompleted = false;
        return this;
    }
    
    setRoomOwner(isOwner) { 
        this.isRoomOwner = isOwner; 
        return this;
    }
    
    setPos(pos) { 
        this.pos = pos; 
        return this;
    }
    
    getPos() { 
        return this.pos; 
    }

    setAlive(alive) {
        this.isAlive = alive;
        return this;
    }

    setSheriff(isSheriff) {
        this.isSheriff = isSheriff;
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

    toJSON() {
        return {
            userId: this.userId,
            username: this.username,
            userAvatar: this.userAvatar,
            isAI: this.isAI,
            isReady: this.isReady,
            isRoomOwner: this.isRoomOwner,
            isAlive: this.isAlive,
            isSheriff: this.isSheriff,
            pos: this.pos,
            hasVoted: this.hasVoted,
            nightActionCompleted: this.nightActionCompleted,
            ...(this.role && { hasRole: true })
        };
    }

    getFullData() {
        return { ...this.toJSON(), role: this.role };
    }
}

export default User;