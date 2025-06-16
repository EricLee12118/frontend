import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface UserType {
  userId: string;
  username: string;
  userAvatar: string;
  isReady: boolean;
  isAI?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useGameControls = (socket: Socket | null, roomId: string, users: UserType[], user: any, roomState: string) => {
  const [isReady, setIsReady] = useState(false);
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);

  // 检查当前用户是否已准备
  useEffect(() => {
    if (users.length && user) {
      const currentUser = users.find(u => u.userId === user.id);
      if (currentUser) {
        setIsReady(currentUser.isReady);
      }
    }
  }, [users, user]);

  // 切换准备状态
  const toggleReady = () => {
    if (!socket || isTogglingReady || roomState === 'playing') return;
    
    setIsTogglingReady(true);
    
    try {
      socket.emit('toggle_ready', { roomId });
    } catch (error) {
      console.error("切换准备状态失败:", error);
    } finally {
      setTimeout(() => {
        setIsTogglingReady(false);
      }, 500);
    }
  };

  // 开始游戏
  const startGame = () => {
    if (!socket || isStartingGame || roomState !== 'ready') return;
  
    setIsStartingGame(true);
    
    try {
      socket.emit('start_game', { roomId });
    } catch (error) {
      console.error("开始游戏失败:", error);
    } finally {
      setTimeout(() => {
        setIsStartingGame(false);
      }, 500);
    }
  };

  // 结束游戏
  const endGame = () => {
    if (!socket || isEndingGame || roomState !== 'playing') return;
    
    setIsEndingGame(true);
    
    try {
      socket.emit('end_game', { roomId });
    } catch (error) {
      console.error("结束游戏失败:", error);
    } finally {
      setTimeout(() => {
        setIsEndingGame(false);
      }, 500);
    }
  };

  return {
    isReady,
    isTogglingReady,
    isStartingGame,
    isEndingGame,
    toggleReady,
    startGame,
    endGame
  };
};