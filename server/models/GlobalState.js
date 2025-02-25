class GlobalState {
    constructor() {
        if (GlobalState.instance) return GlobalState.instance;
        this.rooms = new Map();
        this.messageHistory = {};
        this.rateLimit = {};
        this.activeUsers = new Map();
        GlobalState.instance = this;
    }

    static getInstance() {
        return GlobalState.instance || new GlobalState();
    }
}

export default GlobalState;