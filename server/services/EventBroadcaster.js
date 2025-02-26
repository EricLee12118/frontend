import GlobalState from '../models/GlobalState.js';

class EventBroadcaster {
    constructor(io) {
        this.io = io;
    }

    broadcastRoomsList() {
        const roomsList = Array.from(GlobalState.getInstance().rooms.values())
            .map(room => {
                const numUsers = this.io.sockets.adapter.rooms.get(room.roomId)?.size || 0;
                return numUsers > 0 ? { roomId: room.roomId, numUsers, creator: room.creator, createdAt: room.createdAt } : null;
            }).filter(Boolean);
        this.io.emit('rooms_list', roomsList);
    }

    broadcastRoomUsers(roomId) {
        const globalState = GlobalState.getInstance();
        const room = globalState.rooms.get(roomId);
        
        const users = Array.from(this.io.sockets.adapter.rooms.get(roomId) || [])
            .map(socketId => {
                const socket = this.io.sockets.sockets.get(socketId);
                if (!socket) return null;
                
                return {
                    username: socket.username,
                    userAvatar: socket.userAvatar || null,
                    isRoomOwner: room?.creator === socket.username,
                    socketId: socketId
                };
            })
            .filter(Boolean);

        this.io.to(roomId).emit('room_users', users);
    }
    broadcastSystemMessage(roomId, message) {
        const msgData = { sender: '系统', message, timestamp: new Date().toISOString(), isSystem: true };
        const globalState = GlobalState.getInstance();

        globalState.messageHistory[roomId] = globalState.messageHistory[roomId] || [];
        globalState.messageHistory[roomId].push(msgData);
        if (globalState.messageHistory[roomId].length > 100) globalState.messageHistory[roomId].shift();

        this.io.to(roomId).emit('receive_msg', msgData);
    }
}

export default EventBroadcaster;