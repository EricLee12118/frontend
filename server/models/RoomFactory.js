class RoomFactory {
    static createRoom(roomId, creator) {
        return { 
            roomId, 
            creator, 
            createdAt: new Date().toISOString(),
            users: [] 
        };
    }
}

export default RoomFactory;