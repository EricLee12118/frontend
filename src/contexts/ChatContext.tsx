/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';
import { 
  RoomContextType, 
  Message, 
  RoomInfo, 
  User, 
  RoomState, 
  GameState,
  RoleInfo,
  NightActionData,
  VoteStats,
  PhaseProgress,
  GameNotification,
  DiscussionState,
  SpeakerInfo,
  SpeechEvent
} from '@/types/chat'; 
import { v4 as uuidv4 } from 'uuid';

const RoomContext = createContext<RoomContextType | null>(null);

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a ChatProvider');
  }
  return context;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [shouldAutoJoin, setShouldAutoJoin] = useState(true);
  const [create, setCreate] = useState(false);
  const roomIdRef = useRef(roomId);
  const [roomState, setRoomState] = useState<RoomState>('waiting');
  const [gameState, setGameState] = useState<GameState>({ 
    isActive: false,
    round: 0,
    phase: null,
    startTime: null,
    endTime: null
  });
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [gameMessages, setGameMessages] = useState<Message[]>([]);
  const [seerResult, setSeerResult] = useState<any>(null);
  const [nightActionRequired, setNightActionRequired] = useState<NightActionData | null>(null);
  const [voteRequired, setVoteRequired] = useState<{ 
    phase: string; 
    targets: any[]; 
    message: string; 
    timeLimit: number 
  } | null>(null);
  const [hunterSkillRequired, setHunterSkillRequired] = useState<{ 
    targets: any[]; 
    message: string; 
    timeLimit: number 
  } | null>(null);
  const [currentVoteStats, setCurrentVoteStats] = useState<VoteStats | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress | null>(null);
  const [gameNotifications, setGameNotifications] = useState<GameNotification[]>([]);
  const [discussionState, setDiscussionState] = useState<DiscussionState>({
    currentSpeaker: null,
    speakerIndex: 0,
    totalSpeakers: 0,
    timeLimit: 300000,
    isMySpeakingTurn: false,
    speakingStartTime: null
  });
  const [canSpeak, setCanSpeak] = useState(false);

  roomIdRef.current = roomId;

  // 定义所有事件处理函数
  const handleRoomState = (state: { 
    state: RoomState; 
    creator: string;
    creatorId: string;
  }) => {
    console.log('Room state updated:', state);
    setRoomState(state.state);
    setIsRoomOwner(!!user?.id && state.creatorId === user.id);
  };

  const handleGameState = (state: GameState) => {
    console.log('Game state updated:', state);
    setGameState(state);
    
    // 如果不是白天阶段，重置讨论状态
    if (state.phase !== 'day') {
      setDiscussionState({
        currentSpeaker: null,
        speakerIndex: 0,
        totalSpeakers: 0,
        timeLimit: 300000,
        isMySpeakingTurn: false,
        speakingStartTime: null
      });
      setCanSpeak(false);
    }
  };

  const handleRoleInfo = (info: RoleInfo) => {
    console.log('Role info received:', info);
    setRoleInfo(info);
  };

  const handleSeerResult = (result: any) => {
    setSeerResult(result);
    setTimeout(() => setSeerResult(null), 5000);
  };

  const handleGameMessage = (msg: Message) => {
    setGameMessages(prev => [...prev, msg]);
  };

  const handleNightActionRequired = (data: NightActionData) => {
    console.log('Night action required:', data);
    setNightActionRequired(data);
  };

  const handleRoomUsers = (receivedUsers: User[]) => {
    console.log('Room users updated:', receivedUsers);
    console.log('Users with pos:', receivedUsers.filter(u => u.pos));
    setUsers(receivedUsers);
  };

  const handleVoteRequired = (data: { phase: string; targets: any[]; message: string; timeLimit: number }) => {
    console.log('Vote required:', data);
    setVoteRequired(data);
  };

  const handleHunterSkillRequired = (data: { targets: any[]; message: string; timeLimit: number }) => {
    console.log('Hunter skill required:', data);
    setHunterSkillRequired(data);
  };

  const handleVoteResults = (data: any) => {
    setMessages(prev => [...prev, {
      sender: '系统',
      message: data.message,
      timestamp: data.timestamp,
      isSystem: true,
      type: 'vote_results'
    }]);
  };

  const handleReceiveMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    
    // 只在游戏进行中显示通知
    if (msg.isSystem && gameState.isActive) {
      let notificationType: GameNotification['type'] = 'info';
      let title = '系统消息';
      
      if (msg.message.includes('被击杀') || msg.message.includes('被毒杀')) {
        notificationType = 'death';
        title = '死亡消息';
      } else if (msg.message.includes('被投票淘汰')) {
        notificationType = 'elimination';
        title = '淘汰消息';
      } else if (msg.message.includes('开始') || msg.message.includes('阶段')) {
        notificationType = 'phase';
        title = '阶段变化';
      } else if (msg.message.includes('胜利') || msg.message.includes('结束')) {
        notificationType = 'success';
        title = '游戏结束';
      }
      
      setGameNotifications(prev => [...prev, {
        id: uuidv4(),
        type: notificationType,
        title,
        message: msg.message,
        timestamp: msg.timestamp
      }]);
    }
  };

  const handleVoteUpdate = (data: any) => {
    setCurrentVoteStats(data.voteStats);
    setMessages(prev => [...prev, {
      sender: '系统',
      message: `${data.voter.username} 投票给 ${data.target.username}`,
      timestamp: data.timestamp,
      isSystem: true,
      type: 'vote_update'
    }]);
  };

  const handleVotePhaseStarted = (data: any) => {
    console.log('Vote phase started:', data);
    setCurrentVoteStats(data.voteStats);
  };

  const handleSpeakerChange = (data: {
    currentSpeaker: SpeakerInfo;
    speakerIndex: number;
    totalSpeakers: number;
    timeLimit: number;
  }) => {
    console.log('Speaker changed:', data);
    const isMySpeakingTurn = data.currentSpeaker?.userId === user?.id;
    
    setDiscussionState({
      currentSpeaker: data.currentSpeaker,
      speakerIndex: data.speakerIndex,
      totalSpeakers: data.totalSpeakers,
      timeLimit: data.timeLimit,
      isMySpeakingTurn,
      speakingStartTime: Date.now()
    });
    
    setCanSpeak(isMySpeakingTurn);
    
    if (isMySpeakingTurn) {
      setGameNotifications(prev => [...prev, {
        id: uuidv4(),
        type: 'info',
        title: '轮到您发言',
        message: '现在是您的发言时间，限时5分钟',
        timestamp: new Date().toISOString(),
        duration: 10000
      }]);
    }
  };

  const handleYourTurnToSpeak = (data: {
    message: string;
    timeLimit: number;
  }) => {
    setCanSpeak(true);
    setGameNotifications(prev => [...prev, {
      id: uuidv4(),
      type: 'warning',
      title: '发言提醒',
      message: data.message,
      timestamp: new Date().toISOString(),
      duration: data.timeLimit
    }]);
  };

  const handleSpeechEnded = (data: SpeechEvent) => {
    console.log('Speech ended:', data);
    setCanSpeak(false);
    setDiscussionState(prev => ({
      ...prev,
      speakingStartTime: null
    }));
  };

  const removeGameNotification = (id: string) => {
    setGameNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const endSpeech = () => {
    if (socket && roomId && canSpeak) {
      socket.emit('end_speech', { roomId });
      setCanSpeak(false);
    }
  };

  // Socket 连接逻辑
  useEffect(() => {
    if (!isLoaded || !user || isConnecting) return;

    setIsConnecting(true);
    setUsername(user.username || user.id);

    const newSocket = io(process.env.SOCKET_URL as string, {
      withCredentials: true,
      auth: {
        userId: user.id,
        username: user.username || user.id,
        userAvatar: user.imageUrl,
        isReady: false,
        isAI: false,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    const handleConnect = () => {
      console.log('Socket connected');
      newSocket.emit('get_rooms');
      const lastRoom = sessionStorage.getItem(`chat_room_${user.id}`);
      if (lastRoom && shouldAutoJoin) {
        setRoomId(lastRoom);
        newSocket.emit('join_room', {
          username: user.username || user.id,
          roomId: lastRoom,
        });
      }
    };

    const handleReconnect = () => {
      console.log('Socket reconnected');
      newSocket.emit('get_rooms');
      if (roomIdRef.current && shouldAutoJoin) {
        newSocket.emit('join_room', {
          username: user.username || user.id,
          roomId: roomIdRef.current,
        });
      }
    };

    const errorHandler = (error: string) => {
      console.error('Socket error:', error);
      alert(error);
    };

    // 注册所有事件监听器
    newSocket.on('connect', handleConnect);
    newSocket.on('reconnect', handleReconnect);
    newSocket.on('rooms_list', setRooms);
    newSocket.on('room_users', handleRoomUsers);
    newSocket.on('message_history', setMessages);
    newSocket.on('room_state', handleRoomState);
    newSocket.on('game_state', handleGameState);
    
    // 游戏相关事件监听
    newSocket.on('role_info', handleRoleInfo);
    newSocket.on('seer_result', handleSeerResult);
    newSocket.on('game_message', handleGameMessage);
    newSocket.on('role_assigned', handleRoleInfo);
    newSocket.on('night_action_required', handleNightActionRequired);
    newSocket.on('vote_required', handleVoteRequired);
    newSocket.on('hunter_skill_required', handleHunterSkillRequired);

    // 投票相关事件
    newSocket.on('vote_results', handleVoteResults);
    newSocket.on('vote_update', handleVoteUpdate);
    newSocket.on('vote_phase_started', handleVotePhaseStarted);
    
    // 错误处理
    newSocket.on('validation_error', errorHandler);
    newSocket.on('room_full', errorHandler);
    newSocket.on('username_error', errorHandler);
    newSocket.on('rate_limit', errorHandler);
    newSocket.on('user_not_found', errorHandler);
    
    // 消息和发言相关
    newSocket.on('receive_msg', handleReceiveMessage);
    newSocket.on('speaker_change', handleSpeakerChange);
    newSocket.on('your_turn_to_speak', handleYourTurnToSpeak);
    newSocket.on('speech_ended', handleSpeechEnded);

    if (!newSocket.connected) {
      newSocket.connect();
    }

    return () => {
      console.log('Cleaning up socket listeners');
      // 清理所有事件监听器
      newSocket.off('connect');
      newSocket.off('reconnect');
      newSocket.off('rooms_list');
      newSocket.off('room_users');
      newSocket.off('message_history');
      newSocket.off('room_state');
      newSocket.off('game_state');
      newSocket.off('role_info');
      newSocket.off('seer_result');
      newSocket.off('game_message');
      newSocket.off('role_assigned');
      newSocket.off('night_action_required');
      newSocket.off('vote_required');
      newSocket.off('hunter_skill_required');
      newSocket.off('vote_results');
      newSocket.off('vote_update');
      newSocket.off('vote_phase_started');
      newSocket.off('validation_error');
      newSocket.off('room_full');
      newSocket.off('username_error');
      newSocket.off('rate_limit');
      newSocket.off('user_not_found');
      newSocket.off('receive_msg');
      newSocket.off('speaker_change');
      newSocket.off('your_turn_to_speak');
      newSocket.off('speech_ended');
      
      newSocket.disconnect();
      setIsConnecting(false);
    };
  }, [user, isLoaded, shouldAutoJoin]);

  // 监听游戏状态变化，获取角色信息
  useEffect(() => {
    if (socket && roomState === 'playing' && !roleInfo && roomId) {
      console.log('Requesting role info');
      socket.emit('get_role', { roomId });
    }
  }, [socket, roomState, roleInfo, roomId]);

  // 公开方法
  const joinRoom = () => {
    setCreate(true);
    if (socket && username.trim() && roomId.trim()) {
      setShouldAutoJoin(true);
      sessionStorage.setItem(`chat_room_${user?.id}`, roomId.trim());
      socket.emit('join_room', {
        username: username.trim(),
        roomId: roomId.trim(),
      });
    }
  };

  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leave_room', { roomId });
      sessionStorage.removeItem(`chat_room_${user?.id}`);
      setMessages([]);
      setUsers([]);
      setRoomId('');
      setShouldAutoJoin(false);
      setCreate(false);
      setRoleInfo(null);
      setGameMessages([]);
      setSeerResult(null);
      setNightActionRequired(null);
      setVoteRequired(null);
      setHunterSkillRequired(null);
      setCurrentVoteStats(null);
      setDiscussionState({
        currentSpeaker: null,
        speakerIndex: 0,
        totalSpeakers: 0,
        timeLimit: 300000,
        isMySpeakingTurn: false,
        speakingStartTime: null
      });
      setCanSpeak(false);
    }
  };
  
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查发言权限
    if (gameState.phase === 'day' && discussionState.totalSpeakers > 0 && !canSpeak) {
      setGameNotifications(prev => [...prev, {
        id: uuidv4(),
        type: 'error',
        title: '无法发言',
        message: '现在不是您的发言时间，请等待轮到您发言',
        timestamp: new Date().toISOString(),
        duration: 5000
      }]);
      return;
    }
    
    if (message.trim() && socket && roomId.trim() && username.trim()) {
      socket.emit('send_msg', {
        roomId: roomId.trim(),
        message: message.trim(),
        sender: username.trim(),
        userId: user?.id,
        channel: gameState.isActive ? 'game' : 'main'
      });
      setMessage('');
    } else {
      alert('请填写消息内容。');
    }
  };

  const getRoleInfo = () => {
    if (socket && roomId) {
      socket.emit('get_role', { roomId });
    }
  };

  const forceNextPhase = () => {
    if (socket && roomId && isRoomOwner) {
      socket.emit('force_next_phase', { roomId });
    }
  };

  const restartGame = () => {
    if (socket && roomId && isRoomOwner) {
      socket.emit('restart_game', { roomId });
    }
  };

  const playerVote = (targetId: string) => {
    if (socket && roomId) {
      socket.emit('player_vote', { roomId, targetId });
      setVoteRequired(null);
    }
  };

  const werewolfVote = (targetId: string) => {
    if (socket && roomId) {
      socket.emit('werewolf_vote', { roomId, targetId });
      setNightActionRequired(null);
    }
  };

  const seerCheck = (targetId: string) => {
    if (socket && roomId) {
      socket.emit('seer_check', { roomId, targetId });
      setNightActionRequired(null);
    }
  };

  const witchAction = (action: 'save' | 'poison', targetId?: string) => {
    if (socket && roomId) {
      socket.emit('witch_action', { roomId, action, targetId });
      setNightActionRequired(null);
    }
  };

  const hunterShoot = (targetId: string) => {
    if (socket && roomId) {
      socket.emit('hunter_shoot', { roomId, targetId });
      setHunterSkillRequired(null);
    }
  };

  const skipAction = (actionType: string) => {
    if (socket && roomId) {
      socket.emit('skip_action', { roomId, actionType });
      setNightActionRequired(null);
      setVoteRequired(null);
      setHunterSkillRequired(null);
    }
  };

  const resetGameState = () => {
    console.log('Resetting game state...');
    
    setGameState({ 
      isActive: false,
      round: 0,
      phase: null,
      startTime: null,
      endTime: null
    });
    
    setRoleInfo(null);
    
    setGameMessages([]);
    
    setSeerResult(null);
    
    setNightActionRequired(null);
    
    setVoteRequired(null);
    setHunterSkillRequired(null);
    setCurrentVoteStats(null);
    
    setPhaseProgress(null);
    
    setGameNotifications([]);
    
    setDiscussionState({
      currentSpeaker: null,
      speakerIndex: 0,
      totalSpeakers: 0,
      timeLimit: 300000,
      isMySpeakingTurn: false,
      speakingStartTime: null
    });
    
    setCanSpeak(false);
    
    setMessages(prev => prev.filter(msg => msg.isSystem));
    
    console.log('Game state has been reset');
  };


  const value = {
    socket,
    username,
    roomId,
    setRoomId,
    message,
    setMessage,
    messages,
    users,
    rooms,
    create,
    setCreate,
    joinRoom,
    leaveRoom,
    sendMessage,
    setUsers,
    roomState,
    gameState,
    isRoomOwner,
    discussionState,
    canSpeak,
    endSpeech,
    // 游戏相关属性和方法
    roleInfo,
    gameMessages,
    seerResult,
    nightActionRequired,
    voteRequired,
    hunterSkillRequired,
    currentVoteStats,
    getRoleInfo,
    forceNextPhase,
    restartGame,
    playerVote,
    werewolfVote,
    seerCheck,
    witchAction,
    hunterShoot,
    skipAction,
    phaseProgress,
    gameNotifications,
    removeGameNotification,
    setPhaseProgress,
    resetGameState
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}