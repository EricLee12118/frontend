class Room {
    constructor(roomId, creator) {
        this.roomId = roomId;
        this.creator = creator;
        this.createdAt = new Date().toISOString();
        this.users = [];
        this.state = 'waiting'; // 房间状态: waiting, ready, playing, ended
        this.game = {
            isActive: false,
            startTime: null,
            endTime: null,
            round: 0,
            currentPhase: null,
            settings: {
                werewolves: 3,
                villagers: 3,
                seer: 1,
                witch: 1
            }
        };
        this.channels = {
            main: {
                messages: []
            },
            werewolf: {
                messages: []
            }
        };
    }

    // 判断所有玩家是否已准备
    isAllReady() {
        if (this.users.length < 2) return false;
        return this.users.every(user => user.isReady || user.isAI);
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
    addUser(user) {
        const existingUserIndex = this.users.findIndex(u => u.userId === user.userId);
        
        if (existingUserIndex === -1) {
            this.users.push(user);
        } else {
            this.users[existingUserIndex] = {
                ...this.users[existingUserIndex],
                ...user
            };
        }
        
        this.updateState();
        return this.users;
    }

    // 移除用户
    removeUser(userId) {
        this.users = this.users.filter(user => user.userId !== userId);
        this.updateState();
        return this.users;
    }

    // 切换用户准备状态
    toggleUserReady(userId) {
        const user = this.users.find(u => u.userId === userId);
        if (user) {
            user.isReady = !user.isReady;
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
        this.game.isActive = true;
        this.game.startTime = new Date().toISOString();
        this.game.round = 1;
        this.game.currentPhase = 'night';
        
        return this;
    }

    // 结束游戏
    endGame() {
        this.state = 'ended';
        this.game.isActive = false;
        this.game.endTime = new Date().toISOString();
        
        // 重置所有玩家的准备状态
        this.users.forEach(user => {
            if (!user.isAI) {
                user.isReady = false;
            }
        });
        
        // 更新房间状态
        this.updateState();
        
        return this;
    }

    // 返回房间状态
    resetRoom() {
        this.state = 'waiting';
        this.game.isActive = false;
        this.game.round = 0;
        this.game.currentPhase = null;
        this.game.startTime = null;
        this.game.endTime = null;
        
        // 更新房间状态
        this.updateState();
        
        return this;
    }

    // 添加AI玩家
    addAIPlayers(aiPlayers) {
        const existingUserIds = new Set(this.users.map(u => u.userId));
        const newAiPlayers = aiPlayers.filter(ai => !existingUserIds.has(ai.userId));
        
        this.users.push(...newAiPlayers);
        this.updateState();
        
        return newAiPlayers;
    }

    // 添加消息到频道
    addMessage(channelName, message) {
        if (!this.channels[channelName]) {
            this.channels[channelName] = { messages: [] };
        }
        
        this.channels[channelName].messages.push(message);
        
        // 限制消息历史记录数量
        if (this.channels[channelName].messages.length > 100) {
            this.channels[channelName].messages.shift();
        }
        
        return this.channels[channelName].messages;
    }
}

export default Room;