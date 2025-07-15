import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';

export default class EventBroadcaster {
    constructor(io) {
        this.io = io;
        this.globalState = GlobalState.getInstance();
    }

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

    broadcastRoomUsers(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room) {
            logger.error(`尝试广播不存在的房间 "${roomId}" 的用户列表`);
            return;
        }
        this.io.to(roomId).emit('room_users', room.getUsersArray());
        logger.debug(`已广播房间 "${roomId}" 的用户列表`);
    }

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

    broadcastGameState(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room) {
            logger.error(`尝试广播不存在的房间 "${roomId}" 的游戏状态`);
            return;
        }

        const gameData = room.game.state.getGameState();
        this.io.to(roomId).emit('game_state', gameData);
        logger.debug(`已广播房间 "${roomId}" 的游戏状态`);
    }

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

        room.addMessage('main', msgData);
        this.io.to(roomId).emit('receive_msg', msgData);
        logger.debug(`已向房间 "${roomId}" 发送系统消息：${message}`);
    }

    broadcastDiscussionMessage(roomId, userId, message) {
        const room = this.globalState.getRoom(roomId);
        if (!room) {
            logger.error(`尝试向不存在的房间 "${roomId}" 发送讨论消息`);
            return;
        }

        const user = room.getUser(userId);
        const msgData = {
            sender: user ? user.username : '未知用户',
            senderId: userId,
            message,
            timestamp: new Date().toISOString(),
            isSystem: false,
            channel: 'game'
        };

        room.addMessage('game', msgData);
        this.io.to(roomId).emit('receive_msg', msgData);
        logger.debug(`已向房间 "${roomId}" 发送讨论消息：${message}`);
    }
}