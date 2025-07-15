// types/chat.ts
import { Socket } from 'socket.io-client';

export type RoomState = 'waiting' | 'ready' | 'playing' | 'ended';
export type GamePhase = 'night' | 'day' | 'vote' | 'discussion';

export interface Message {
  sender: string;
  message: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface NotificaitonProps {
  messages: Message[];
  message: string;
  setMessage: (message: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  leaveRoom: () => void;
  roomState: string;
}

export interface VoteResult {
  targetId: string;
  targetName: string;
  voteCount: number;
  voters: Array<{ userId: string; username: string }>;
}

export interface VoteResultData {
  totalVotes: number;
  alivePlayers: number;
  results: VoteResult[];
  notVoted: Array<{ userId: string; username: string }>;
}

export interface PhaseProgress {
  completed: number;
  required: number;
  type: 'night' | 'day' | 'vote' | 'unknown';
}

export interface GameNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'death' | 'elimination' | 'phase' | 'vote';
  title: string;
  message: string;
  timestamp: string;
  duration?: number;
}


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
  hasVoted?: boolean;
  nightActionCompleted?: boolean;
  pos?: number;
}

export interface GameState {
  isActive: boolean;
  round?: number;
  phase?: GamePhase | null;
  dayCount?: number;
  startTime?: string | null;
  endTime?: string | null;
  phaseStartTime?: number | null;
  witchItems?: {
    hasAntidote: boolean;
    hasPoison: boolean;
  };
  deathRecord?: Array<{
    userId: string;
    username: string;
    role: string;
    cause: string;
    day: number;
  }>;
  lastNightDeath?: string | null;
  phaseProgress?: PhaseProgress;
}

export interface RoleInfo {
  role: string;
  position?: number;
  description: string;
}

export interface VoteTarget {
  userId: string;
  username: string;
  position?: number;
}

export interface SpeakerInfo {
  userId: string;
  username: string;
  position: number;
}

export interface DiscussionState {
  currentSpeaker: SpeakerInfo | null;
  speakerIndex: number;
  totalSpeakers: number;
  timeLimit: number;
  isMySpeakingTurn: boolean;
  speakingStartTime: number | null;
}

export interface SpeechEvent {
  speakerId: string;
  nextSpeakerIndex: number;
}

export interface NightActionData {
  action: 'werewolf_kill' | 'seer_check' | 'witch_action';
  phase: string;
  targets?: VoteTarget[];
  hasAntidote?: boolean;
  hasPoison?: boolean;
  deadPlayer?: { userId: string; username: string } | null;  
  potentialVictim?: { userId: string; username: string } | null;  
  alivePlayers?: VoteTarget[];
  message: string;
  timeLimit: number;
  isFirstNight?: boolean;
}

export interface VoteStats {
  voteResults: Record<string, {
    count: number;
    voters: Array<{ userId: string; username: string }>;
  }>;
  voterDetails: Record<string, {
    voterName: string;
    targetId: string;
    targetName: string;
    timestamp: string;
  }>;
  totalVotes: number;
  alivePlayers: number;
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

  // 游戏相关属性和方法
  roleInfo: RoleInfo | null;
  gameMessages: Message[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seerResult: any;
  nightActionRequired: NightActionData | null;
  voteRequired: { phase: string; targets: VoteTarget[]; message: string; timeLimit: number } | null;
  hunterSkillRequired: { targets: VoteTarget[]; message: string; timeLimit: number } | null;
  currentVoteStats: VoteStats | null;
  phaseProgress: PhaseProgress | null;
  gameNotifications: GameNotification[];
  discussionState: DiscussionState;
  canSpeak: boolean;
  endSpeech: () => void;
  
  // 游戏操作方法
  getRoleInfo: () => void;
  forceNextPhase: () => void;
  restartGame: () => void;
  playerVote: (targetId: string) => void;
  werewolfVote: (targetId: string) => void;
  seerCheck: (targetId: string) => void;
  witchAction: (action: 'save' | 'poison', targetId?: string) => void;
  hunterShoot: (targetId: string) => void;
  skipAction: (actionType: string) => void;
}