import { Socket } from 'socket.io-client';

export type RoomState = 'waiting' | 'ready' | 'playing' | 'ended';
export interface Message {
  sender: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
  content?: string;
  type?: string;
}

export interface RoomInfo {
  roomId: string;
  userCount: number;
  humanCount: number;
  aiCount: number;
  creator: string;
  createdAt: string;
  state: RoomState;
}

export interface User {
  userId: string;
  username: string;
  isRoomOwner: boolean;
  userAvatar: string;
  isReady: boolean;
  isAI: boolean;
  hasRole?: boolean;
  isAlive?: boolean;
}

export interface GameState {
  isActive: boolean;
  round?: number;
  phase?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  duration?: number;
  playerCount?: number;
  deadPlayersCount?: number;
}

export interface RoleInfo {
  role: string;
  position?: number;
  description: string;
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
  
  // 新增的游戏相关属性和方法
  roleInfo: RoleInfo | null;
  gameMessages: Message[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seerResult: any;
  getRoleInfo: () => void;
  nextRound: () => void;
  changeGamePhase: (phase: string) => void;
  castVote: (targetId: string) => void;
  seerCheckPlayer: (targetId: string) => void;
}