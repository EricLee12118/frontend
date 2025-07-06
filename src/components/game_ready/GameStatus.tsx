// components/game_ready/GameStatus.tsx
import React, { useEffect, useState } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';
import GameActions from '@/components/game/GameActions';
import PlayerStatus from '@/components/game/PlayerStatus';
import GameNotifications from '@/components/game/GameNotifications';

const GameStatus: React.FC = () => {
  const { 
    socket, 
    roomId, 
    gameState, 
    roleInfo, 
    isRoomOwner,
    users,
    forceNextPhase,
    restartGame,
    phaseProgress,
    gameNotifications,
    messages, 
    message,
    setMessage,
    sendMessage,
    leaveRoom,
    roomState,
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
      case 'villager': return'👨‍🌾';
      case 'seer': return '👁️';
      case 'witch': return '🧙‍♀️';
      case 'hunter': return '🏹';
      default: return '👤';
    }
  };

  const getPhaseInfo = (phase: string | null | undefined) => {
    switch(phase) {
      case 'night': return { emoji: '🌙', name: '夜晚', color: 'bg-indigo-500' };
      case 'day': return { emoji: '☀️', name: '白天', color: 'bg-yellow-500' };
      case 'vote': return { emoji: '🗳️', name: '投票', color: 'bg-red-500' };
      case 'discussion': return { emoji: '💬', name: '讨论', color: 'bg-green-500' };
      default: return { emoji: '⏳', name: '等待中', color: 'bg-gray-500' };
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

  const alivePlayers = users.filter(u => u.isAlive);
  const deadPlayers = users.filter(u => !u.isAlive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 顶部游戏信息栏 */}
        <div className="mb-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${phaseInfo.color} animate-pulse`}></div>
                  <span className="text-white font-medium">
                    <span className="text-xl mr-2">{phaseInfo.emoji}</span>
                    {phaseInfo.name}阶段
                  </span>
                </div>
                
                <div className="text-white">
                  <span className="text-sm opacity-75">第</span>
                  <span className="text-xl font-bold mx-1">{gameState.dayCount || 1}</span>
                  <span className="text-sm opacity-75">天</span>
                </div>
                
                <div className="text-white">
                  <span className="text-sm opacity-75">存活</span>
                  <span className="text-xl font-bold mx-1 text-green-400">{alivePlayers.length}</span>
                  <span className="text-sm opacity-75">/ {users.length}</span>
                </div>
                
                <div className="text-white text-sm opacity-75">
                  游戏时长: {gameDuration} 分钟
                </div>
              </div>
              
              {/* 阶段进度条 */}
              {phaseProgress && phaseProgress.required > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm">
                    进度: {phaseProgress.completed}/{phaseProgress.required}
                  </span>
                  <div className="w-32 bg-white bg-opacity-20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${Math.min((phaseProgress.completed / phaseProgress.required) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 主要游戏区域 */}
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：角色信息和控制 */}
          <div className="col-span-3 space-y-4">
            {/* 角色信息卡片 */}
            {roleInfo && (
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
                <div className="text-center">
                  <div className="text-6xl mb-3">{getRoleEmoji(roleInfo.role)}</div>
                  <h3 className="text-white text-lg font-bold mb-2">
                    {getRoleNameInChinese(roleInfo.role)}
                  </h3>
                  <div className="bg-blue-500 bg-opacity-20 text-blue-200 px-3 py-1 rounded-full text-sm mb-3">
                    {roleInfo.position}号位
                  </div>
                  <p className="text-white text-xs opacity-75 leading-relaxed">
                    {roleInfo.description}
                  </p>
                </div>
              </div>
            )}

            {/* 游戏统计 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <h3 className="text-white font-semibold mb-3">游戏统计</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white opacity-75">存活玩家</span>
                  <span className="text-green-400 font-medium">{alivePlayers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white opacity-75">死亡玩家</span>
                  <span className="text-red-400 font-medium">{deadPlayers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white opacity-75">AI玩家</span>
                  <span className="text-blue-400 font-medium">{users.filter(u => u.isAI).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white opacity-75">游戏轮数</span>
                  <span className="text-yellow-400 font-medium">{gameState.round || 0}</span>
                </div>
              </div>
            </div>

            {/* 房主控制 */}
            {isRoomOwner && (
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
                <h3 className="text-white font-semibold mb-3">房主控制</h3>
                <div className="space-y-2">
                  <button 
                    onClick={forceNextPhase}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm"
                  >
                    强制下一阶段
                  </button>
                  <button 
                    onClick={restartGame}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm"
                  >
                    重新开始
                  </button>
                  <button 
                    onClick={exitGame}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-3 rounded-lg transition duration-200 text-sm"
                  >
                    结束游戏
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 中间：玩家状态圆桌 */}
          <div className="col-span-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
              <PlayerStatus users={users} gameState={gameState} />
            </div>
          </div>

          {/* 右侧：游戏操作和消息 */}
          <div className="col-span-3 space-y-4">
            {/* 游戏操作 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <h3 className="text-white font-semibold mb-4">游戏操作</h3>
              <GameActions />
            </div>

            {/* 游戏消息通知 */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <span className="mr-2">📢</span>
                游戏消息
                {gameNotifications.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {gameNotifications.length}
                  </span>
                )}
              </h3>
              <GameNotifications 
                messages={messages}
                message={message} 
                setMessage={setMessage} 
                sendMessage={sendMessage} 
                leaveRoom={leaveRoom}
                roomState={roomState} 
              />
            </div>

            {/* 死亡玩家列表 */}
            {deadPlayers.length > 0 && (
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <span className="mr-2">💀</span>
                  死亡玩家 ({deadPlayers.length})
                </h3>
                <div className="space-y-2">
                  {deadPlayers.map(player => (
                    <div key={player.userId} className="flex items-center justify-between text-sm">
                      <span className="text-white opacity-75">{player.username}</span>
                      <span className="text-red-400">#{player.pos}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 添加CSS动画 */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GameStatus;