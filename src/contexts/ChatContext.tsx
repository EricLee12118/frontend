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
  RoleInfo 
} from '@/types/chat'; 

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

  const handleRoomState = (state: { 
    state: RoomState; 
    creator: string;
    creatorId: string;
  }) => {
    setRoomState(state.state);
    setIsRoomOwner(!!user?.id && state.creatorId === user.id);
  };

  const handleGameState = (state: GameState) => {
    setGameState(state);
  };

  const handleRoleInfo = (info: RoleInfo) => {
    setRoleInfo(info);
  };

  const handleSeerResult = (result: any) => {
    setSeerResult(result);
  };

  const handleGameMessage = (msg: Message) => {
    setGameMessages(prev => [...prev, msg]);
  };

  roomIdRef.current = roomId;

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
      newSocket.emit('get_rooms');
      if (roomIdRef.current && shouldAutoJoin) {
        newSocket.emit('join_room', {
          username: user.username || user.id,
          roomId: roomIdRef.current,
        });
      }
    };

    newSocket.on('connect', handleConnect);
    newSocket.on('reconnect', handleReconnect);
    newSocket.on('rooms_list', setRooms);
    newSocket.on('receive_msg', (msg: Message) => setMessages(prev => [...prev, msg]));    
    newSocket.on('room_users', (receivedUsers: User[]) => setUsers(receivedUsers));
    newSocket.on('message_history', setMessages);
    newSocket.on('room_state', handleRoomState);
    newSocket.on('game_state', handleGameState);
    
    // 游戏相关事件监听
    newSocket.on('role_info', handleRoleInfo);
    newSocket.on('seer_result', handleSeerResult);
    newSocket.on('game_message', handleGameMessage);
    newSocket.on('role_assigned', handleRoleInfo);
    
    const errorHandler = (error: string) => alert(error);
    newSocket.on('validation_error', errorHandler);
    newSocket.on('room_full', errorHandler);
    newSocket.on('username_error', errorHandler);
    newSocket.on('rate_limit', errorHandler);
    newSocket.on('user_not_found', errorHandler);

    if (!newSocket.connected) newSocket.connect();

    return () => {
      newSocket.off('connect', handleConnect);
      newSocket.off('reconnect', handleReconnect);
      newSocket.off('rooms_list', setRooms);
      newSocket.off('receive_msg');
      newSocket.off('room_users');
      newSocket.off('message_history');
      newSocket.off('validation_error', errorHandler);
      
      // 清理游戏相关事件监听
      newSocket.off('room_state');
      newSocket.off('game_state');
      newSocket.off('role_info');
      newSocket.off('seer_result');
      newSocket.off('game_message');
      newSocket.off('role_assigned');
      
      setIsConnecting(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded]);

  useEffect(() => {
    if (socket && roomState === 'playing' && !roleInfo) {
      socket.emit('get_role', { roomId });
    }
  }, [socket, roomState, roleInfo, roomId]);

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
    }
  };
  
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && socket && roomId.trim() && username.trim()) {
      socket.emit('send_msg', {
        roomId: roomId.trim(),
        message: message.trim(),
        sender: username.trim(),
        userId: user?.id,
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

  const nextRound = () => {
    if (socket && roomId && isRoomOwner) {
      socket.emit('next_round', { roomId });
    }
  };

  const changeGamePhase = (phase: string) => {
    if (socket && roomId && isRoomOwner) {
      socket.emit('change_phase', { roomId, phase });
    }
  };

  const castVote = (targetId: string) => {
    if (socket && roomId) {
      socket.emit('player_vote', { roomId, targetId });
    }
  };

  const seerCheckPlayer = (targetId: string) => {
    if (socket && roomId && roleInfo?.role === 'seer') {
      socket.emit('seer_check', { roomId, targetId });
    }
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
    
    // 新增的游戏相关属性和方法
    roleInfo,
    gameMessages,
    seerResult,
    getRoleInfo,
    nextRound,
    changeGamePhase,
    castVote,
    seerCheckPlayer,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}