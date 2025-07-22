import logger from '../config/logger.js';

export default class NightPhaseManager {
    constructor(io, eventBroadcaster, globalState, timerManager, phaseManager) {
        this.io = io;
        this.eventBroadcaster = eventBroadcaster;
        this.globalState = globalState;
        this.timerManager = timerManager;
        this.phaseManager = phaseManager;
    }

    startNightPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (!room?.game.state.isActive) {
            return { success: false, message: '游戏未在进行中' };
        }

        room.game.state.currentPhase = 'night';
        room.game.state.phaseStartTime = Date.now();
        room.game.state.resetVotes();
        room.game.state.resetNightActions();
        room.game.state.lastNightDeath = null;
        this.setRequiredActors(room, 'night');
        
        this.eventBroadcaster.broadcastRoomUsers(roomId);
        this.eventBroadcaster.broadcastGameState(roomId);
        this.eventBroadcaster.broadcastSystemMessage(roomId,
            `第 ${room.game.state.dayCount} 天夜晚开始，请各角色执行夜间行动。`);

        this.sendNightActionInstructions(roomId);
        this.timerManager.setPhaseTimer(roomId, () => this.finishNightPhase(roomId), 120000);

        return { success: true };
    }

    sendNightActionInstructions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const alivePlayers = room.game.getAlivePlayers();

        alivePlayers.forEach(player => {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(player.userId));
            if (!socket || player.isAI) return;

            const role = room.game.state.roleAssignments[player.userId];
            
            switch (role) {
                case 'werewolf':
                    this.sendWerewolfAction(socket, roomId, player);
                    break;
                case 'seer':
                    this.sendSeerAction(socket, roomId, player);
                    break;
            }
        });
    }

    checkWerewolfActionsComplete(roomId) {
        const room = this.globalState.getRoom(roomId);
        const aliveWerewolves = room.game.getAlivePlayers()
            .filter(p => room.game.state.roleAssignments[p.userId] === 'werewolf');

        const completedWerewolves = aliveWerewolves.filter(p => 
            room.game.state.phaseCompletions.nightActionsCompleted.has(p.userId)
        );

        if (completedWerewolves.length === aliveWerewolves.length && aliveWerewolves.length > 0) {
            this.processWerewolfKillAndNotifyWitch(roomId);
        }
    }

    processWerewolfKillAndNotifyWitch(roomId) {
        const room = this.globalState.getRoom(roomId);
        const state = room.game.state;
        
        const voteCount = {};
        logger.info('狼人投票结果：', state.nightActions.werewolfVotes);

        Object.values(state.nightActions.werewolfVotes).forEach(targetId => {
            voteCount[targetId] = (voteCount[targetId] || 0) + 1;
        });

        let killedTarget = null;
        if (Object.keys(voteCount).length > 0) {
            const maxVotes = Math.max(...Object.values(voteCount));
            const targets = Object.keys(voteCount).filter(id => voteCount[id] === maxVotes);
            
            if (targets.length === 1) {
                killedTarget = room.getUser(targets[0]);
                state.lastNightDeath = targets[0];
                logger.info(`狼人决定击杀: ${killedTarget.username}`);
            } else {
                logger.info('狼人投票平票，无人被击杀');
            }
        } else {
            logger.info('狼人没有投票，无人被击杀');
        }

        this.sendWitchActionInstructions(roomId);
    }

    sendWitchActionInstructions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const alivePlayers = room.game.getAlivePlayers();
        
        const aliveWitches = alivePlayers.filter(player => 
            room.game.state.roleAssignments[player.userId] === 'witch'
        );

        aliveWitches.forEach(player => {
            const socket = this.io.sockets.sockets.get(this.globalState.activeUsers.get(player.userId));
            if (!socket || player.isAI) return;

            this.sendWitchAction(socket, roomId, player);
        });
    }

    sendWerewolfAction(socket, roomId, player) {
        const room = this.globalState.getRoom(roomId);
        const targets = room.game.getAlivePlayers()
            .filter(p => room.game.state.roleAssignments[p.userId] !== 'werewolf')
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        socket.emit('night_action_required', {
            action: 'werewolf_kill',
            phase: 'night',
            player: player,
            targets: targets,
            message: '请选择今晚要击杀的目标',
            timeLimit: 120000
        });
    }

    sendSeerAction(socket, roomId, player) {
        const room = this.globalState.getRoom(roomId);
        const targets = room.game.getAlivePlayers()
            .filter(p => p.userId !== player.userId)
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        socket.emit('night_action_required', {
            action: 'seer_check',
            phase: 'night',
            targets: targets,
            message: '请选择要查验身份的目标',
            timeLimit: 120000
        });
    }

    sendWitchAction(socket, roomId, player) {
        const room = this.globalState.getRoom(roomId);
        const state = room.game.state;
        
        let victimPlayer = null;
        if (state.lastNightDeath) {
            victimPlayer = room.getUser(state.lastNightDeath);
            logger.info(`女巫看到的受害者: ${victimPlayer ? victimPlayer.username : '未知'}`);
        } else {
            logger.info('女巫看到：昨夜无人被狼人击杀');
        }
        
        const alivePlayers = room.game.getAlivePlayers()
            .filter(p => p.userId !== player.userId)
            .map(p => ({ userId: p.userId, username: p.username, position: p.pos }));

        const canSaveSelf = !state.isFirstNight || (victimPlayer && victimPlayer.userId !== player.userId);
        const canSaveVictim = victimPlayer && canSaveSelf;

        socket.emit('night_action_required', {
            action: 'witch_action',
            phase: 'night',
            hasAntidote: state.witchItems.hasAntidote,
            hasPoison: state.witchItems.hasPoison,
            potentialVictim: victimPlayer && canSaveVictim ? { 
                userId: victimPlayer.userId, 
                username: victimPlayer.username 
            } : null,
            deadPlayer: victimPlayer && canSaveVictim ? { 
                userId: victimPlayer.userId, 
                username: victimPlayer.username 
            } : null,
            alivePlayers: alivePlayers,
            message: victimPlayer ? 
                `昨夜 ${victimPlayer.username} 被狼人击杀，请选择是否使用解药或毒药` :
                '昨夜平安无事，请选择是否使用毒药',
            timeLimit: 60000,
            isFirstNight: state.isFirstNight
        });
    }

    finishNightPhase(roomId) {
        const room = this.globalState.getRoom(roomId);
        if (room?.game.state.currentPhase !== 'night') return;

        this.timerManager.clearPhaseTimer(roomId);
        const nightResults = this.executeNightActions(roomId);

        this.phaseManager.dayManager.startDayPhase(roomId, nightResults);
        return { success: true };
    }

    executeNightActions(roomId) {
        const room = this.globalState.getRoom(roomId);
        const results = [];

        const killResult = room.game.actions.werewolfKill();
        if (killResult) {
            results.push({
                type: 'werewolf_kill',
                target: killResult.killed,
                saved: killResult.saved
            });
        }

        const witchResults = room.game.actions.witchAction();
        results.push(...witchResults.map(r => ({ type: 'witch_action', ...r })));

        return results;
    }

    setRequiredActors(room, phase) {
        room.game.state.resetPhaseCompletions();
        const alivePlayers = room.game.getAlivePlayers();
        
        if (phase === 'night') {
            alivePlayers.forEach(player => {
                const role = room.game.state.roleAssignments[player.userId];
                if (['werewolf', 'seer', 'witch'].includes(role)) {
                    room.game.state.phaseCompletions.requiredNightRoles.add(player.userId);
                }
            });
        }
    }
}