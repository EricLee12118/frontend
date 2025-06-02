import GlobalState from '../models/GlobalState.js';
import RoomFactory from '../models/RoomFactory.js';
import Validator from '../validators/Validator.js';
import logger from '../config/logger.js';

export default function initializeSocketHandlers(io, socket, eventBroadcaster) {
    const globalState = GlobalState.getInstance();

    logger.info(`用户连接: ${socket.username}(${socket.userId})`);
    eventBroadcaster.broadcastRoomsList();

    socket.on('join_room', handleJoinRoom);
    socket.on('toggle_ready', handleToggleReady);
    socket.on('send_msg', handleSendMessage);
    socket.on('leave_room', handleLeaveRoom);
    socket.on('disconnect', handleDisconnect);
    socket.on('add_ai_players', handleAddAIPlayers);
    function handleJoinRoom(data) {
        const { error } = Validator.validateJoinRoom(data);
        if (error) return socket.emit('validation_error', error.details[0].message);

        const { username, roomId } = data;

        if (socket.roomId === roomId) return;

        // 创建房间或获取现有房间
        if (!globalState.rooms.has(roomId)) {
            globalState.rooms.set(roomId, RoomFactory.createRoom(roomId, username));
            logger.info(`房间 "${roomId}" 已创建`);
        }

        const room = globalState.rooms.get(roomId);
        const socketRoom = io.sockets.adapter.rooms.get(roomId);
        if (socketRoom && socketRoom.size >= 8) return socket.emit('room_full', '此房间已达到最大容量，请尝试加入其他房间。');
            if (socket.roomId) {
                const prevRoom = globalState.rooms.get(socket.roomId);
                if (prevRoom && prevRoom.users) {
                    prevRoom.users = prevRoom.users.filter(u => u.userId !== socket.userId);
                }
                
                socket.leave(socket.roomId);
                eventBroadcaster.broadcastRoomUsers(socket.roomId);
                
                if (io.sockets.adapter.rooms.get(socket.roomId)?.size === 0) {
                    globalState.rooms.delete(socket.roomId);
                }
            }

            socket.join(roomId);
            socket.roomId = roomId;
                    
            // 确保房间有users数组
            if (!room.users) {
                room.users = [];
            }
            
            // 过滤出AI玩家
            const aiPlayers = room.users.filter(u => u.isAI || u.isAi);
            
            // 获取真实连接的用户
            const connectedUsers = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
                .map(socketId => {
                    const s = io.sockets.sockets.get(socketId);
                    if (!s) return null;
                    
                    return {
                        userId: s.userId,
                        username: s.username,
                        userAvatar: s.userAvatar || null,
                        isRoomOwner: room.creator === s.username,
                        isReady: s.isReady || false,
                        isAI: false
                    };
                })
                .filter(Boolean);
            
            // 更新房间的用户列表，保留AI玩家
            room.users = [...connectedUsers, ...aiPlayers];
            
            const existingUserIndex = room.users.findIndex(u => u.userId === socket.userId);
            
            if (existingUserIndex === -1) {
                room.users.push({
                    userId: socket.userId,
                    username: socket.username,
                    userAvatar: socket.userAvatar || '',
                    isReady: socket.isReady,
                    isRoomOwner: room.creator === socket.username,
                    isAI: socket.handshake.auth.isAI || false
                });
            } else {
                room.users[existingUserIndex].username = socket.username;
                room.users[existingUserIndex].userAvatar = socket.userAvatar || '';
            }
            
            logger.info(`用户 "${username}" 加入了房间 "${roomId}"`);

            eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${username}" 加入了房间`);
            eventBroadcaster.broadcastRoomsList();
            eventBroadcaster.broadcastRoomUsers(roomId);
        
        if (globalState.messageHistory[roomId]) socket.emit('message_history', globalState.messageHistory[roomId]);
    }

    function handleSendMessage(data) {
        const { error } = Validator.validateSendMessage(data);
        if (error) return socket.emit('validation_error', error.details[0].message);

        const { roomId } = data;
        const sender = socket.username;

        const currentTime = Date.now();
        globalState.rateLimit[socket.id] = (globalState.rateLimit[socket.id] || []).filter(timestamp => currentTime - timestamp < 1000);
        if (globalState.rateLimit[socket.id].length >= 5) return socket.emit('rate_limit', '您发送消息的频率过高，请稍后再试。');

        globalState.rateLimit[socket.id].push(currentTime);
        globalState.messageHistory[roomId] = globalState.messageHistory[roomId] || [];
        globalState.messageHistory[roomId].push({ sender, message: data.message, timestamp: new Date().toISOString() });

        if (globalState.messageHistory[roomId].length > 100) globalState.messageHistory[roomId].shift();
        io.to(roomId).emit('receive_msg', { sender, message: data.message, timestamp: new Date().toISOString(), isSystem: data.isSystem });
        logger.info(`Message from "${sender}" in room "${roomId}": ${data.message}`);
    }

    function handleLeaveRoom(data) {
        const { roomId } = data;
        if (!roomId) return;

        const room = globalState.rooms.get(roomId);
        if (room && room.users) {
            room.users = room.users.filter(user => user.userId !== socket.userId);
        }

        socket.leave(roomId);
        socket.roomId = null;
        logger.info(`用户 "${socket.username}" 离开了房间 "${roomId}"`);

        if (io.sockets.adapter.rooms.get(roomId)?.size === 0) {
            globalState.rooms.delete(roomId);
            delete globalState.messageHistory[roomId];
        }

        eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${socket.username}" 离开了房间`);
        eventBroadcaster.broadcastRoomsList();
        eventBroadcaster.broadcastRoomUsers(roomId);
    }

    function handleDisconnect() {
        logger.info(`用户断开连接: ${socket.username}(${socket.userId})`);
        globalState.activeUsers.delete(socket.userId);
        const roomId = socket.roomId;

        if (roomId) {
            // 从房间的users数组中移除用户
            const room = globalState.rooms.get(roomId);
            if (room && room.users) {
                room.users = room.users.filter(user => user.userId !== socket.userId);
            }

            const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
            eventBroadcaster.broadcastSystemMessage(roomId, `用户 "${socket.username}" 离开了房间`);
            if (roomSize <= 1) {
                globalState.rooms.delete(roomId);
                delete globalState.messageHistory[roomId];
            } else {
                eventBroadcaster.broadcastRoomUsers(roomId);
            }
            socket.roomId = null;
        }
        eventBroadcaster.broadcastRoomsList();
    }

    function handleToggleReady(data) {
        const { roomId } = data;
        const room = globalState.rooms.get(roomId);
        
        if (!room) {
            logger.error(`尝试在不存在的房间 "${roomId}" 中切换准备状态`);
            return;
        }
        
        if (!room.users || !Array.isArray(room.users)) {
            logger.error(`房间 "${roomId}" 中没有有效的users数组，正在初始化`);
            room.users = [];
        }
        
        const user = room.users.find(user => user.userId === socket.userId);
        if (!user) {
            logger.info(`将用户 "${socket.username}" 添加到房间 "${roomId}" 的用户列表中`);
            const newUser = {
                userId: socket.userId,
                username: socket.username,
                isReady: true, 
                isRoomOwner: room.creator === socket.username,
                userAvatar: socket.userAvatar || ''
            };
            room.users.push(newUser);
            logger.info(`用户 "${socket.username}" 在房间 "${roomId}" 中准备就绪`);
        } else {
            user.isReady = !user.isReady;
            logger.info(`用户 "${socket.username}" 在房间 "${roomId}" 中${user.isReady ? '准备就绪' : '取消准备'}`);
        }
        
        eventBroadcaster.broadcastRoomUsers(roomId);
    }

    // 在socketHandlers.js中添加处理AI玩家的函数
    function handleAddAIPlayers(data) {
        const { roomId, count, aiPlayers } = data;
        const room = globalState.rooms.get(roomId);
        
        if (!room) {
            logger.error(`尝试在不存在的房间 "${roomId}" 中添加AI玩家`);
            return;
        }
        
        if (!room.users) {
            room.users = [];
        }

        // 如果提供了AI玩家数据，直接使用
        if (aiPlayers && Array.isArray(aiPlayers)) {
            // 过滤掉已存在的AI玩家（基于userId）
            const existingUserIds = new Set(room.users.map(u => u.userId));
            const newAiPlayers = aiPlayers.filter(ai => !existingUserIds.has(ai.userId));
            
            // 添加新的AI玩家
            room.users.push(...newAiPlayers);
            
            logger.info(`已添加 ${newAiPlayers.length} 个AI玩家到房间 "${roomId}"`);
        } 
        // 否则，添加指定数量的默认AI玩家
        else if (count && count > 0) {
            // 这里可以实现一个生成随机AI玩家的逻辑
            const newAiPlayers = [];
            for (let i = 0; i < count; i++) {
                const aiPlayer = {
                    userId: `ai-${Date.now()}-${i}`,
                    username: `AI玩家${Math.floor(Math.random() * 1000)}`,
                    userAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=ai-${Date.now()}-${i}`,
                    isReady: true,
                    isRoomOwner: false,
                    isAI: true
                };
                newAiPlayers.push(aiPlayer);
            }
            
            room.users.push(...newAiPlayers);
            logger.info(`已添加 ${count} 个默认AI玩家到房间 "${roomId}"`);
        }
        
        eventBroadcaster.broadcastRoomUsers(roomId);
        eventBroadcaster.broadcastSystemMessage(roomId, `已添加AI玩家到房间`);
    }

    
}