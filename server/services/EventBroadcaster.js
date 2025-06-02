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
        
        if (!room) return;
        console.log('房间用户:', room.users);
        
        if (!room.users) {
            room.users = [];
        }
        
        const userMap = new Map();
        room.users.forEach(user => userMap.set(user.userId, user));
        
        const connectedUsers = Array.from(this.io.sockets.adapter.rooms.get(roomId) || [])
            .map(socketId => {
                const socket = this.io.sockets.sockets.get(socketId);
                if (!socket) return null;
                
                const roomUser = userMap.get(socket.userId);
                
                return {
                    userId: socket.userId,
                    username: socket.username,
                    userAvatar: socket.userAvatar || null,
                    isRoomOwner: room.creator === socket.username,
                    isReady: roomUser ? roomUser.isReady : false, 
                    isAI: false
                };
            })
            .filter(Boolean);
        
        const aiUsers = room.users.filter(user => user.isAI || user.isAi);
        
        const allUsers = [...connectedUsers, ...aiUsers];
        
        this.io.to(roomId).emit('room_users', allUsers);
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