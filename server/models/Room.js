// models/Room.js
import User from './User.js';
import Game from './Game.js';

class Room {
    constructor(roomId, creatorUsername, creatorUserId) {
        this.roomId = roomId;
        this.creator = creatorUsername;
        this.creatorId = creatorUserId;
        this.createdAt = new Date().toISOString();
        this.users = new Map(); // 使用Map存储用户，键为userId
        this.state = 'waiting'; // 房间状态: waiting, ready, playing, ended
        this.game = new Game(this); // 游戏实例
        this.channels = {
            main: {
                messages: []
            },
            game: {
                messages: []
            }, 
            werewolf: {
                messages: []
            }
        };
    }

    // 判断所有玩家是否已准备
    isAllReady() {
        if (this.users.size < 2) return false;
        return Array.from(this.users.values()).every(user => user.isReady || user.isAI);
    }

    // 检查房间状态并更新
    updateState() {
        if (this.isAllReady()) {
            this.state = 'ready';
        } else {
            this.state = 'waiting';
        }
        return this.state;
    }

    // 添加用户
    addUser(userData) {
        const existingUser = this.users.get(userData.userId);
        
        if (existingUser) {
            // 更新现有用户
            Object.assign(existingUser, userData);
        } else {
            // 创建新用户
            const isRoomOwner = userData.userId === this.creatorId;
            const user = new User({...userData, isRoomOwner});
            this.users.set(userData.userId, user);
        }
        
        this.updateState();
        return this.getUsersArray();
    }

    // 移除用户
    removeUser(userId) {
        this.users.delete(userId);
        this.updateState();
        return this.getUsersArray();
    }

    // 获取用户
    getUser(userId) {
        return this.users.get(userId);
    }

    // 获取用户数组（用于发送给客户端）
    getUsersArray() {
        return Array.from(this.users.values()).map(user => user.toJSON());
    }

    // 切换用户准备状态
    toggleUserReady(userId) {
        const user = this.users.get(userId);
        if (user) {
            user.toggleReady();
            this.updateState();
        }
        return user;
    }

    // 开始游戏
    startGame() {
        if (this.state !== 'ready') {
            throw new Error('游戏无法开始：不是所有玩家都准备好了');
        }
        
        this.state = 'playing';
        this.game.start();
        
        // 打印角色分配结果
        // const roleAssignmentText = this.game.printRoleAssignments();
        
        // 将角色分配结果添加到游戏频道
        this.addMessage('game', {
            id: Date.now().toString(),
            content: "roleAssignmentText",
            sender: 'system',
            timestamp: new Date().toISOString(),
            type: 'role_assignment'
        });
        
        return this;
    }

    // 结束游戏
    endGame() {
        this.state = 'ended';
        this.game.end();
        
        // 重置所有玩家的准备状态和角色
        this.users.forEach(user => {
            if (!user.isAI) {
                user.isReady = false;
            }
            user.clearRole();
        });
        
        // 更新房间状态
        this.updateState();
        
        return this;
    }

    // 重置房间状态
    resetRoom() {
        this.state = 'waiting';
        this.game.reset();
        
        // 清除所有用户的角色
        this.users.forEach(user => {
            user.clearRole();
        });
        
        // 更新房间状态
        this.updateState();
        
        return this;
    }

    // 添加AI玩家
    addAIPlayers(aiPlayers) {
        const existingUserIds = new Set(Array.from(this.users.keys()));
        const newAiPlayers = [];
        
        for (const aiData of aiPlayers) {
            if (!existingUserIds.has(aiData.userId)) {
                const aiUser = new User({...aiData, isAI: true, isReady: true});
                this.users.set(aiData.userId, aiUser);
                newAiPlayers.push(aiUser);
            }
        }
        
        this.updateState();
        return newAiPlayers.map(ai => ai.toJSON());
    }

    // 添加消息到频道
    addMessage(channelName, message) {
        if (!this.channels[channelName]) {
            this.channels[channelName] = { messages: [] };
        }
        
        this.channels[channelName].messages.push(message);
        
        if (this.channels[channelName].messages.length > 100) {
            this.channels[channelName].messages.shift();
        }
        
        return this.channels[channelName].messages;
    }
    
    // 获取用户角色
    getUserRole(userId) {
        return this.game.getUserRole(userId);
    }
    
    // 获取用户位置 
    getUserPosition(userId) {
        return this.game.getUserPosition(userId);
    }
    
    // 转移房主权限
    transferOwnership(newOwnerId) {
        const newOwner = this.users.get(newOwnerId);
        if (newOwner) {
            // 先重置所有用户的房主状态
            this.users.forEach(user => user.setRoomOwner(false));
            
            // 设置新房主
            newOwner.setRoomOwner(true);
            this.creator = newOwner.username;
            this.creatorId = newOwnerId;
            
            return true;
        }
        return false;
    }
}

export default Room;