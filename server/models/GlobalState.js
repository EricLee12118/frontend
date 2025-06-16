import Room from './RoomFactory.js';

class GlobalState {
    constructor() {
        if (GlobalState.instance) return GlobalState.instance;
        this.rooms = new Map();
        this.rateLimit = {};
        this.activeUsers = new Map();
        GlobalState.instance = this;
    }

    static getInstance() {
        return GlobalState.instance || new GlobalState();
    }

    createRoom(roomId, creator) {
        const room = new Room(roomId, creator);
        this.rooms.set(roomId, room);
        return room;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    deleteRoom(roomId) {
        return this.rooms.delete(roomId);
    }

    getAllRooms() {
        return Array.from(this.rooms.values());
    }


    checkRateLimit(socketId) {
        const currentTime = Date.now();
        this.rateLimit[socketId] = (this.rateLimit[socketId] || []).filter(
            timestamp => currentTime - timestamp < 1000
        );
        
        if (this.rateLimit[socketId].length >= 5) {
            return false; // 频率受限
        }
        
        this.rateLimit[socketId].push(currentTime);
        return true; // 频率正常
    }
}

export default GlobalState;