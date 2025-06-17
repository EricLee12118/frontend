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
    }

    toggleReady() {
        this.isReady = !this.isReady;
        return this.isReady;
    }

    setRole(role) { this.role = role; }
    clearRole() { this.role = null; }
    setRoomOwner(isOwner) { this.isRoomOwner = isOwner; }
    setPos(pos) { this.pos = pos; }
    getPos() { return this.pos; }
    
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
            ...(this.role && { hasRole: true })
        };
    }

    getFullData() {
        return { ...this.toJSON(), role: this.role };
    }
}

export default User;