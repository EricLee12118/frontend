import User from './User.js';
import Game from './Game.js';

export default class Room {
    constructor(roomId, creatorUsername, creatorUserId) {
        this.roomId = roomId;
        this.creator = creatorUsername;
        this.creatorId = creatorUserId;
        this.createdAt = new Date().toISOString();
        this.users = new Map();
        this.state = 'waiting';
        this.game = new Game(this);
        this.channels = {
            main: { messages: [] },
            game: { messages: [] },
            werewolf: { messages: [] }
        };
    }

    isAllReady() {
        if (this.users.size < 2) return false;
        return Array.from(this.users.values()).every(user => user.isReady || user.isAI);
    }

    updateState() {
        if (this.game.state.isActive) {
            this.state = 'playing';
        } else {
            this.state = this.isAllReady() ? 'ready' : 'waiting';
        }
        return this.state;
    }

    addUser(userData) {
        const existingUser = this.users.get(userData.userId);
        if (existingUser) {
            Object.assign(existingUser, userData);
        } else {
            const isRoomOwner = userData.userId === this.creatorId;
            const user = new User({...userData, isRoomOwner});
            this.users.set(userData.userId, user);
        }
        this.updateState();
        return this.getUsersArray();
    }

    removeUser(userId) {
        this.users.delete(userId);
        this.updateState();
        return this.getUsersArray();
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    getUsersArray() {
        return Array.from(this.users.values()).map(user => user.toJSON());
    }

    toggleUserReady(userId) {
        const user = this.users.get(userId);
        if (user) {
            user.toggleReady();
            this.updateState();
        }
        return user;
    }

    startGame() {
        if (this.state !== 'ready') {
            throw new Error('游戏无法开始：不是所有玩家都准备好了');
        }
        this.state = 'playing';
        this.game.start();
        return this;
    }

    endGame() {
        this.state = 'waiting';
        this.game.reset();;
        this.users.forEach(user => {
            user.clearRole();
            user.isReady = false;
        });
        this.updateState();
        this.channels.game.messages = [];
        this.channels.main.messages = [];
        this.channels.werewolf.messages = [];
        return this;
    }

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

    getUserRoleInfo(userId) {
        return this.game.getUserRoleInfo(userId);
    }

    transferOwnership(newOwnerId) {
        const newOwner = this.users.get(newOwnerId);
        if (newOwner) {
            this.users.forEach(user => user.setRoomOwner(false));
            newOwner.setRoomOwner(true);
            this.creator = newOwner.username;
            this.creatorId = newOwnerId;
            return true;
        }
        return false;
    }
}