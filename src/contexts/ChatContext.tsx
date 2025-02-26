// contexts/ChatContext.tsx

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';
import { ChatContextType, Message, RoomInfo, User } from '@/types/chat'; // 确保导入 User 类型

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
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
  const [users, setUsers] = useState<User[]>([]); // 更改为 User 对象数组
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [shouldAutoJoin, setShouldAutoJoin] = useState(true);
  const [create, setCreate] = useState(false);
  const roomIdRef = useRef(roomId);
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
    
    // 接收消息
    newSocket.on('receive_msg', (msg: Message) => setMessages(prev => [...prev, msg]));
    
    newSocket.on('room_users', (receivedUsers: User[]) => setUsers(receivedUsers));

    newSocket.on('message_history', setMessages);
    
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
      setIsConnecting(false);
    };
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}