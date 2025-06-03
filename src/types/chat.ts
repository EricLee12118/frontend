import { Socket } from 'socket.io-client';

export type RoomState = 'waiting' | 'ready' | 'playing' | 'ended';
export interface Message {
  sender: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface RoomInfo {
  roomId: string;
  numUsers: number;
  creator: string;
  createdAt: string;
}

export interface User {
  userId: string;
  username: string;
  isRoomOwner: boolean;
  userAvatar: string;
  isReady: boolean;
  isAI: boolean;
}

export interface GameState {
  isActive: boolean;
  // round?: number;
  // phase?: string;
  // startTime?: string;
  // endTime?: string;
}

export interface RoomContextType {
  socket: Socket | null;
  username: string;
  roomId: string;
  setRoomId: (id: string) => void;
  message: string;
  setMessage: (msg: string) => void;
  messages: Message[];
  users: User[];
  setUsers: (users: User[]) => void; 
  rooms: RoomInfo[];
  create: boolean;
  setCreate: (value: boolean) => void;
  joinRoom: () => void;
  leaveRoom: () => void;
  sendMessage: (e: React.FormEvent) => void;
  roomState: RoomState;
  gameState: GameState;
  isRoomOwner: boolean;
}