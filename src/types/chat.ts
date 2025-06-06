import { Socket } from 'socket.io-client';

export type Message = {
  sender: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
};

export type RoomInfo = {
  roomId: string;
  numUsers: number;
  creator: string;
  createdAt: string;
};

export type ChatContextType = {
  socket: Socket | null;
  username: string;
  roomId: string;
  setRoomId: (id: string) => void;
  message: string;
  setMessage: (msg: string) => void;
  messages: Message[];
  users: string[];
  rooms: RoomInfo[];
  create: boolean;
  setCreate: (value: boolean) => void;
  joinRoom: () => void;
  leaveRoom: () => void;
  sendMessage: (e: React.FormEvent) => void;
};