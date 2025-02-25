class RoomFactory {
    static createRoom(roomId, creator) {
        return { roomId, creator, createdAt: new Date().toISOString() };
    }
}

export default RoomFactory;