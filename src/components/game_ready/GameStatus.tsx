import React, { useEffect, useState } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';

const GameStatus: React.FC = () => {
  const { 
    socket, 
    roomId, 
    gameState, 
    roleInfo, 
    isRoomOwner,
    getRoleInfo,
    nextRound,
    changeGamePhase
  } = useRoomContext();
  console.log(roleInfo);
  const [gameDuration, setGameDuration] = useState(0);

  // 计算游戏时长
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

  useEffect(() => {
    if (socket && roomId && !roleInfo) {
      getRoleInfo();
    }
  }, [socket, roomId, roleInfo, getRoleInfo]);

  const exitGame = () => {
    if (socket && roomId) {
      socket.emit('end_game', { roomId });
    }
  };

  const handleNextRound = () => {
    nextRound();
  };

  const handlePhaseChange = (phase: string) => {
    changeGamePhase(phase);
  };

  // 获取角色对应的emoji
  const getRoleEmoji = (role: string) => {
    switch(role) {
      case 'werewolf': return '🐺';
      case 'villager': return '👨‍🌾';
      case 'seer': return '👁️';
      case 'witch': return '🧙‍♀️';
      default: return '👤';
    }
  };

  // 获取阶段对应的emoji和名称
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

  // 将角色名称转换为中文
  const getRoleNameInChinese = (role: string) => {
    switch(role) {
      case 'werewolf': return '狼人';
      case 'villager': return '村民';
      case 'seer': return '预言家';
      case 'witch': return '女巫';
      default: return role;
    }
  };

  return (
    <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">游戏状态</h2>
      
      {/* 角色信息 */}
      {roleInfo && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold flex items-center">
            <span className="text-xl mr-2">{getRoleEmoji(roleInfo.role)}</span>
            你的角色: {getRoleNameInChinese(roleInfo.role)}
          </h3>
          <p className="text-sm mt-2 text-gray-600">{roleInfo.description}</p>
          <p className="text-sm mt-2 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">位置: {roleInfo.position}号</span>
          </p>
        </div>
      )}
      
      {/* 游戏状态信息 */}
      <ul className="space-y-3 mb-6">
        <li className="flex items-center">
          <span className="text-xl mr-2">🔄</span>
          <span>当前回合：{gameState.round || 0}</span>
        </li>
        <li className="flex items-center">
          <span className="text-xl mr-2">{phaseInfo.emoji}</span>
          <span>当前阶段：{phaseInfo.name}</span>
        </li>
        <li className="flex items-center">
          <span className="text-xl mr-2">⏱️</span>
          <span>游戏时长：{gameDuration} 分钟</span>
        </li>
      </ul>
      
      {/* 房主控制按钮 */}
      {isRoomOwner && (
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold">游戏控制</h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleNextRound}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm"
            >
              下一回合
            </button>
            <button 
              onClick={() => handlePhaseChange(gameState.phase === 'night' ? 'day' : 'night')}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm"
            >
              {gameState.phase === 'night' ? '切换到白天' : '切换到夜晚'}
            </button>
            <button 
              onClick={() => handlePhaseChange('vote')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm"
            >
              进入投票阶段
            </button>
            <button 
              onClick={() => handlePhaseChange('discussion')}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm"
            >
              进入讨论阶段
            </button>
          </div>
        </div>
      )}
      
      {/* 结束游戏按钮 */}
      {isRoomOwner && (
        <button 
          onClick={exitGame}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
        >
          <span className="mr-2">🚪</span>
          结束游戏
        </button>
      )}
      
      {/* 非房主信息 */}
      {!isRoomOwner && (
        <div className="text-center text-gray-500 mt-4">
          游戏进行中，请等待房主的操作...
        </div>
      )}
    </div>
  );
};

export default GameStatus;