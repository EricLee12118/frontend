// components/game_ready/GameStatus.tsx
import React, { useEffect, useState } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';
import GameActions from '@/components/game/GameActions';
import PlayerStatus from '@/components/game/PlayerStatus';

const GameStatus: React.FC = () => {
  const { 
    socket, 
    roomId, 
    gameState, 
    roleInfo, 
    isRoomOwner,
    users,
    forceNextPhase,
    restartGame
  } = useRoomContext();

  const [gameDuration, setGameDuration] = useState(0);

  useEffect(() => {
    if (!gameState.isActive) return;
    const intervalId = setInterval(() => {
      const startTime = gameState.startTime ? new Date(gameState.startTime).getTime() : 0;
      if (startTime) {
        const currentDuration = Math.floor((Date.now() - startTime) / 1000 / 60);
        setGameDuration(currentDuration);
      }
    }, 10000); 
    
    return () => clearInterval(intervalId);
  }, [gameState.isActive, gameState.startTime]);

  const exitGame = () => {
    if (socket && roomId) {
      socket.emit('end_game', { roomId });
    }
  };

  const getRoleEmoji = (role: string) => {
    switch(role) {
      case 'werewolf': return '🐺';
      case 'villager': return '👨‍🌾';
      case 'seer': return '👁️';
      case 'witch': return '🧙‍♀️';
      case 'hunter': return '🏹';
      default: return '👤';
    }
  };

  const getPhaseInfo = (phase: string | null | undefined) => {
    switch(phase) {
      case 'night': return { emoji: '🌙', name: '夜晚' };
      case 'day': return { emoji: '☀️', name: '白天' };
      case 'vote': return { emoji: '🗳️', name: '投票' };
      case 'discussion': return { emoji: '💬', name: '讨论' };
      default: return { emoji: '⏳', name: '等待中' };
    }
  };

  const phaseInfo = getPhaseInfo(gameState.phase);

  const getRoleNameInChinese = (role: string) => {
    switch(role) {
      case 'werewolf': return '狼人';
      case 'villager': return '村民';
      case 'seer': return '预言家';
      case 'witch': return '女巫';
      case 'hunter': return '猎人';
      default: return role;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* 左侧：角色信息和游戏状态 */}
      <div className="col-span-1 space-y-4">
        {/* 角色信息 */}
        {roleInfo && (
          <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="text-2xl mr-2">{getRoleEmoji(roleInfo.role)}</span>
              你的角色
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-medium text-blue-600">
                {getRoleNameInChinese(roleInfo.role)}
              </p>
              <p className="text-sm text-gray-600">{roleInfo.description}</p>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm inline-block">
                位置: {roleInfo.position}号
              </div>
            </div>
          </div>
        )}
        
        {/* 游戏状态信息 */}
        <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">游戏状态</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-lg mr-2">📅</span>
              <span>第 {gameState.dayCount || 1} 天</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">{phaseInfo.emoji}</span>
              <span>{phaseInfo.name}</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">⏱️</span>
              <span>游戏时长: {gameDuration} 分钟</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">👥</span>
              <span>存活: {users.filter(u => u.isAlive).length}/{users.length}</span>
            </div>
          </div>
        </div>

        {/* 房主控制按钮 */}
        {isRoomOwner && (
          <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">房主控制</h3>
            <div className="space-y-2">
              <button 
                onClick={forceNextPhase}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200"
              >
                强制下一阶段
              </button>
              <button 
                onClick={restartGame}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200"
              >
                重新开始游戏
              </button>
              <button 
                onClick={exitGame}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200"
              >
                结束游戏
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 中间：玩家状态 */}
      <div className="col-span-1">
        <PlayerStatus users={users} gameState={gameState} />
      </div>

      {/* 右侧：游戏操作 */}
      <div className="col-span-1">
        <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">游戏操作</h3>
          <GameActions />
        </div>
      </div>
    </div>
  );
};

export default GameStatus;