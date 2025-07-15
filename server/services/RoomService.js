import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';

export default class RoomService {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
    }

    getOrCreateRoom(roomId, creatorUsername, creatorUserId) {
        let room = this.globalState.getRoom(roomId);
        if (!room) {
            room = this.globalState.createRoom(roomId, creatorUsername, creatorUserId);
            logger.info(`房间 "${roomId}" 已创建，创建者: ${creatorUsername}`);
        }
        return room;
    }

    joinRoom(socket, roomId, username) {
        if (socket.roomId === roomId) return { success: true, message: '已在该房间中' };

        const room = this.getOrCreateRoom(roomId, username, socket.userId);
        const socketRoom = this.io.sockets.adapter.rooms.get(roomId);

        if (socketRoom && socketRoom.size >= 8) {
            return { success: false, message: '此房间已达到最大容量，请尝试加入其他房间。' };
        }

        if (socket.roomId) this.leaveRoom(socket, socket.roomId);

        socket.join(roomId);
        socket.roomId = roomId;

        const userData = {
            userId: socket.userId,
            username: socket.username,
            userAvatar: socket.userAvatar || '',
            isAI: socket.isAI || false
        };

        room.addUser(userData);
        logger.info(`用户 "${username}" 加入了房间 "${roomId}"`);

        this.eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${username}" 加入了房间`);
        this.eventBroadcaster.broadcastRoomsList();
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        this.eventBroadcaster.broadcastRoomState(roomId);

        if (room.channels.main.messages.length > 0) {
            socket.emit('message_history', room.channels.main.messages);
        }

        return { success: true, message: '成功加入房间' };
    }

    leaveRoom(socket, roomId) {
        const room = this.globalState.getRoom(roomId);
        if (room) {
            const isCreator = room.creatorId === socket.userId;
            room.removeUser(socket.userId);

            if (isCreator && room.users.size > 0) {
                const nonAIUsers = Array.from(room.users.values()).filter(u => !u.isAI);
                if (nonAIUsers.length > 0) {
                    room.transferOwnership(nonAIUsers[0].userId);
                    logger.info(`房间 "${roomId}" 的房主已转移到 "${nonAIUsers[0].username}"`);
                }
            }
        }

        socket.leave(roomId);
        socket.roomId = null;
        logger.info(`用户 "${socket.username}" 离开了房间 "${roomId}"`);

        if (!this.io.sockets.adapter.rooms.get(roomId) || (room && room.users.size === 0)) {
            this.globalState.deleteRoom(roomId);
            logger.info(`房间 "${roomId}" 已删除（无人在线）`);
        } else if (room) {
            this.eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${socket.username}" 离开了房间`);
            this.eventBroadcaster.broadcastRoomUsers(roomId);
            this.eventBroadcaster.broadcastRoomState(roomId);
        }

        this.eventBroadcaster.broadcastRoomsList();
        return { success: true, message: '成功离开房间' };
    }

    sendMessage(userId, roomId, message, channel = 'main') {
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };

        const user = room.getUser(userId);
        if (!user) return { success: false, message: '您不在该房间中' };

        if (channel === 'game' && 
            room.game?.state.isActive && 
            room.game.state.currentPhase === 'day' &&
            room.game.state.discussion.currentSpeakerId !== userId) {
            return { success: false, message: '现在不是您的发言时间' };
        }

        const msgData = {
            sender: user.username,
            senderId: userId,
            message: message.trim(),
            timestamp: new Date().toISOString(),
            channel: channel
        };

        room.addMessage(channel, msgData);
        logger.info(`[${channel}] ${user.username}: ${message}`);

        return { success: true, message: msgData };
    }

    toggleReady(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };

        const user = room.toggleUserReady(socket.userId);
        if (user) {
            logger.info(`用户 "${socket.username}" 在房间 "${roomId}" 中${user.isReady ? '准备就绪' : '取消准备'}`);
            this.eventBroadcaster.broadcastRoomUsers(roomId);
            this.eventBroadcaster.broadcastRoomState(roomId);
            return { success: true, isReady: user.isReady };
        }

        return { success: false, message: '用户不在房间中' };
    }

    addAIPlayers(socket, data) {
        const { roomId, aiPlayers } = data;
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };
        if (room.creatorId !== socket.userId) return { success: false, message: '只有房主可以添加AI玩家' };

        const addedPlayers = room.addAIPlayers(aiPlayers);
        logger.info(`已添加 ${addedPlayers.length} 个AI玩家到房间 "${roomId}"`);

        this.eventBroadcaster.broadcastRoomUsers(roomId);
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, `已添加 ${addedPlayers.length} 个AI玩家到房间`);

        return { success: true, addedCount: addedPlayers.length };
    }

    startGame(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };
        if (room.creatorId !== socket.userId) return { success: false, message: '只有房主可以开始游戏' };
        if (room.state !== 'ready') return { success: false, message: '游戏无法开始：不是所有玩家都准备好了' };

        try {
            room.startGame();
            logger.info(`房间 "${roomId}" 的游戏已开始`);

            this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏开始！');
            this.eventBroadcaster.broadcastRoomState(roomId);
            this.eventBroadcaster.broadcastGameState(roomId);

            room.users.forEach((user, userId) => {
                const role = room.getUserRoleInfo(userId);
                if (role) {
                    const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(userId));
                    if (socket && !user.isAI) {
                        socket.emit('role_assigned', {
                            role: role.role,
                            position: role.position,
                            description: room.game.getRoleDescription(role.role)
                        });
                    }
                }
            });

            return { success: true };
        } catch (error) {
            logger.error(`开始游戏失败: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    endGame(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };
        if (room.creatorId !== socket.userId) return { success: false, message: '只有房主可以结束游戏' };
        if (room.state !== 'playing') return { success: false, message: '游戏未在进行中' };

        room.endGame();
        logger.info(`房间 "${roomId}" 的游戏已手动结束`);

        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏已结束！房间已重置，可以开始新游戏。');
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        this.eventBroadcaster.broadcastGameState(roomId);

        return { success: true };
    }

    resetRoom(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        if (!room) return { success: false, message: '房间不存在' };
        if (room.creatorId !== socket.userId) return { success: false, message: '只有房主可以重置房间' };

        room.endGame();
        logger.info(`房间 "${roomId}" 已重置`);

        this.eventBroadcaster.broadcastSystemMessage(roomId, '房间已重置，请准备开始新游戏！');
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);

        return { success: true };
    }
}