// services/RoomService.js
import GlobalState from '../models/GlobalState.js';
import logger from '../config/logger.js';

class RoomService {
    constructor(io, eventBroadcaster) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = GlobalState.getInstance();
    }

    // 创建或获取房间
    getOrCreateRoom(roomId, creator) {
        let room = this.globalState.getRoom(roomId);
        
        if (!room) {
            room = this.globalState.createRoom(roomId, creator);
            logger.info(`房间 "${roomId}" 已创建，创建者: ${creator}`);
        }
        
        return room;
    }

    // 加入房间
    joinRoom(socket, roomId, username) {
        if (socket.roomId === roomId) return { success: true, message: '已在该房间中' };

        const room = this.getOrCreateRoom(roomId, username);
        const socketRoom = this.io.sockets.adapter.rooms.get(roomId);
        
        // 检查房间是否已满
        if (socketRoom && socketRoom.size >= 8) {
            return { success: false, message: '此房间已达到最大容量，请尝试加入其他房间。' };
        }

        // 离开当前房间
        if (socket.roomId) {
            this.leaveRoom(socket, socket.roomId);
        }

        // 加入新房间
        socket.join(roomId);
        socket.roomId = roomId;
        
        // 添加用户到房间
        room.addUser({
            userId: socket.userId,
            username: socket.username,
            userAvatar: socket.userAvatar || '',
            isReady: false,
            isRoomOwner: room.creator === socket.username,
            isAI: false
        });
        
        logger.info(`用户 "${username}" 加入了房间 "${roomId}"`);
        
        // 广播消息和更新用户列表
        this.eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${username}" 加入了房间`);
        this.eventBroadcaster.broadcastRoomsList();
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        this.eventBroadcaster.broadcastRoomState(roomId);
        
        // 发送历史消息
        if (room.channels.main.messages.length > 0) {
            socket.emit('message_history', room.channels.main.messages);
        }
        
        return { success: true, message: '成功加入房间' };
    }

    // 离开房间
    leaveRoom(socket, roomId) {
        const room = this.globalState.getRoom(roomId);
        
        if (room) {
            // 从房间中移除用户
            room.removeUser(socket.userId);
            
            // 如果用户是房主且房间还有其他人，转移房主
            if (room.creator === socket.username && room.users.length > 0) {
                const newOwner = room.users.find(u => !u.isAI);
                if (newOwner) {
                    room.creator = newOwner.username;
                    newOwner.isRoomOwner = true;
                    logger.info(`房间 "${roomId}" 的房主已转移到 "${newOwner.username}"`);
                }
            }
        }
        
        socket.leave(roomId);
        socket.roomId = null;
        logger.info(`用户 "${socket.username}" 离开了房间 "${roomId}"`);
        
        // 如果房间为空，删除房间
        if (!this.io.sockets.adapter.rooms.get(roomId)) {
            this.globalState.deleteRoom(roomId);
            logger.info(`房间 "${roomId}" 已删除（无人在线）`);
        } else {
            // 广播更新
            this.eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${socket.username}" 离开了房间`);
            this.eventBroadcaster.broadcastRoomUsers(roomId);
            this.eventBroadcaster.broadcastRoomState(roomId);
        }
        
        this.eventBroadcaster.broadcastRoomsList();
        
        return { success: true, message: '成功离开房间' };
    }

    // 处理消息发送
    sendMessage(socket, data) {
        const { roomId, message } = data;
        const sender = socket.username;
        const room = this.globalState.getRoom(roomId);
        
        if (!room) return { success: false, message: '房间不存在' };
        
        // 检查消息频率
        if (!this.globalState.checkRateLimit(socket.id)) {
            return { success: false, message: '您发送消息的频率过高，请稍后再试。' };
        }
        
        // 添加消息到房间
        const msgData = { 
            sender, 
            message, 
            timestamp: new Date().toISOString(),
            isSystem: data.isSystem || false
        };
        
        room.addMessage('main', msgData);
        
        // 广播消息给房间内所有人
        this.io.to(roomId).emit('receive_msg', msgData);
        logger.info(`Message from "${sender}" in room "${roomId}": ${message}`);
        
        return { success: true };
    }

    // 切换准备状态
    toggleReady(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            logger.error(`尝试在不存在的房间 "${roomId}" 中切换准备状态`);
            return { success: false, message: '房间不存在' };
        }
        
        const user = room.toggleUserReady(socket.userId);
        
        if (user) {
            logger.info(`用户 "${socket.username}" 在房间 "${roomId}" 中${user.isReady ? '准备就绪' : '取消准备'}`);
            
            // 广播更新
            this.eventBroadcaster.broadcastRoomUsers(roomId);
            this.eventBroadcaster.broadcastRoomState(roomId);
            
            return { success: true, isReady: user.isReady };
        }
        
        return { success: false, message: '用户不在房间中' };
    }

    // 添加AI玩家
    addAIPlayers(socket, data) {
        const { roomId, aiPlayers } = data;
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            logger.error(`尝试在不存在的房间 "${roomId}" 中添加AI玩家`);
            return { success: false, message: '房间不存在' };
        }
        
        // 检查房主权限
        if (room.creator !== socket.username) {
            return { success: false, message: '只有房主可以添加AI玩家' };
        }
        
        const addedPlayers = room.addAIPlayers(aiPlayers);
        
        logger.info(`已添加 ${addedPlayers.length} 个AI玩家到房间 "${roomId}"`);
        
        // 广播更新
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId, `已添加 ${addedPlayers.length} 个AI玩家到房间`);
        
        return { success: true, addedCount: addedPlayers.length };
    }

    // 开始游戏
    startGame(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            return { success: false, message: '房间不存在' };
        }
        
        // 检查房主权限
        if (room.creator !== socket.username) {
            return { success: false, message: '只有房主可以开始游戏' };
        }
        
        // 检查是否所有人都准备好了
        if (room.state !== 'ready') {
            return { success: false, message: '游戏无法开始：不是所有玩家都准备好了' };
        }
        
        try {
            room.startGame();
            logger.info(`房间 "${roomId}" 的游戏已开始`);
            
            // 广播游戏开始
            this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏开始！');
            this.eventBroadcaster.broadcastRoomState(roomId);
            this.eventBroadcaster.broadcastGameState(roomId);
            
            return { success: true };
        } catch (error) {
            logger.error(`开始游戏失败: ${error.message}`);
            return { success: false, message: error.message };
        }
    }

    // 结束游戏
    endGame(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            return { success: false, message: '房间不存在' };
        }
        
        // 检查房主权限
        if (room.creator !== socket.username) {
            return { success: false, message: '只有房主可以结束游戏' };
        }
        
        // 检查游戏是否在进行中
        if (room.state !== 'playing') {
            return { success: false, message: '游戏未在进行中' };
        }
        
        room.endGame();
        logger.info(`房间 "${roomId}" 的游戏已结束`);
        
        // 广播游戏结束
        this.eventBroadcaster.broadcastSystemMessage(roomId, '游戏结束！');
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        
        return { success: true };
    }

    // 重置房间
    resetRoom(socket, data) {
        const { roomId } = data;
        const room = this.globalState.getRoom(roomId);
        
        if (!room) {
            return { success: false, message: '房间不存在' };
        }
        
        // 检查房主权限
        if (room.creator !== socket.username) {
            return { success: false, message: '只有房主可以重置房间' };
        }
        
        room.resetRoom();
        logger.info(`房间 "${roomId}" 已重置`);
        
        // 广播房间重置
        this.eventBroadcaster.broadcastSystemMessage(roomId, '房间已重置，请准备开始新游戏！');
        this.eventBroadcaster.broadcastRoomState(roomId);
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        
        return { success: true };
    }
}

export default RoomService;