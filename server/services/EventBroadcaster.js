// services/EventBroadcaster.js
import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';

class EventBroadcaster {
    constructor(io) {
        this.io = io;
        this.globalState = GlobalState.getInstance();
    }

    // 广播房间列表
    broadcastRoomsList() {
        const roomsList = this.globalState.getAllRooms()
            .map(room => {
                const userCount = room.users.size;
                const aiCount = Array.from(room.users.values()).filter(u => u.isAI).length;
                const humanCount = userCount - aiCount;
                
                return userCount > 0 ? {
                    roomId: room.roomId,
                    userCount: userCount,
                    humanCount: humanCount,
                    aiCount: aiCount,
                    creator: room.creator,
                    createdAt: room.createdAt,
                    state: room.state
                } : null;
            }).filter(Boolean);
        
        this.io.emit('rooms_list', roomsList);
    }

    // 广播房间用户列表
    broadcastRoomUsers(roomId) {
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            logger.error(`尝试广播不存在的房间 "${roomId}" 的用户列表`);
            return;
        }
        
        // 发送用户列表
        this.io.to(roomId).emit('room_users', room.getUsersArray());
        logger.debug(`已广播房间 "${roomId}" 的用户列表：${room.users.size} 个用户`);
    }

    // 广播房间状态
    broadcastRoomState(roomId) {
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            logger.error(`尝试广播不存在的房间 "${roomId}" 的状态`);
            return;
        }
        
        const readyCount = Array.from(room.users.values()).filter(u => u.isReady || u.isAI).length;
        
        const stateData = {
            roomId: room.roomId,
            state: room.state,
            creator: room.creator,
            creatorId: room.creatorId,
            userCount: room.users.size,
            maxPlayers: 8,
            readyCount: readyCount
        };
        
        this.io.to(roomId).emit('room_state', stateData);
        logger.debug(`已广播房间 "${roomId}" 的状态：${room.state}`);
    }

    // 广播游戏状态
    broadcastGameState(roomId) {
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            logger.error(`尝试广播不存在的房间 "${roomId}" 的游戏状态`);
            return;
        }
        
        const gameData = room.game.getGameState();
        
        this.io.to(roomId).emit('game_state', gameData);
        logger.debug(`已广播房间 "${roomId}" 的游戏状态`);
    }

    // 广播系统消息
    broadcastSystemMessage(roomId, message) {
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            logger.error(`尝试向不存在的房间 "${roomId}" 发送系统消息`);
            return;
        }
        
        const msgData = { 
            sender: '系统', 
            message, 
            timestamp: new Date().toISOString(), 
            isSystem: true 
        };
        
        // 添加消息到房间的历史记录
        room.addMessage('main', msgData);
        
        // 广播消息
        this.io.to(roomId).emit('receive_msg', msgData);
        logger.debug(`已向房间 "${roomId}" 发送系统消息：${message}`);
    }
}

export default EventBroadcaster;