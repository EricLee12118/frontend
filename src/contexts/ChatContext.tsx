import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';
import { RoomContextType, Message, RoomInfo, User, RoomState, GameState } from '@/types/chat'; 

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
  const [gameState, setGameState] = useState<GameState>({ isActive: false });
  const [isRoomOwner, setIsRoomOwner] = useState(false);

  const handleRoomState = (state: { state: RoomState; creator: string }) => {
    setRoomState(state.state);
    setIsRoomOwner(state.creator === username);
  };

  const handleGameState = (state: GameState) => {
    setGameState(state);
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
      newSocket.off('receive_msg', (msg: Message) => setMessages(prev => [...prev, msg]));
      newSocket.off('room_users', setUsers);
      newSocket.off('message_history', setMessages);
      newSocket.off('validation_error', errorHandler);
      // 在清理函数中移除事件监听
      newSocket.off('room_state', handleRoomState);
      newSocket.off('game_state', handleGameState);
      setIsConnecting(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded]);

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
    isRoomOwner
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}