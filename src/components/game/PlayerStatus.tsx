import React from 'react';
import Image from 'next/image';
import { User } from '@/types/chat';
import { useRoomContext } from '@/contexts/ChatContext';

const PlayerStatus = () => {
  const { users, gameState } = useRoomContext();
  const getRoleEmoji = (user: User) => {
    if (!user.hasRole) return '❓';
    return user.isAlive ? '😊' : '💀';
  };

  const getStatusEmoji = (user: User) => {
    const emojis = [];
    
    if (user.isAI) emojis.push('🤖');
    if (!user.isAlive) emojis.push('💀');
    if (user.hasVoted && gameState.phase === 'vote') emojis.push('✅');
    
    return emojis.join(' ');
  };

  const sortedUsers = [...users].sort((a, b) => (a.pos || 0) - (b.pos || 0));
  
  const leftColumn = sortedUsers.filter(user => user.pos && user.pos <= 4);
  const rightColumn = sortedUsers.filter(user => user.pos && user.pos > 4);

  const renderPlayer = (user: User) => (
    <div
      key={user.userId}
      className={`relative ${!user.isAlive ? 'opacity-50 grayscale' : ''}`}
    >
      <div className="flex items-center gap-3 p-2 rounded-lg bg-white bg-opacity-5 hover:bg-opacity-10 transition-all">
        {/* 位置号码 */}
        <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {user.pos}
        </div>
        
        {/* 头像 */}
        <div className="relative">
          <div className={`w-16 h-16 rounded-full overflow-hidden border-3 ${
            user.isAlive ? 'border-green-400' : 'border-red-400'
          } ${!user.isAlive ? 'bg-gray-800' : 'bg-white'}`}>
            {user.userAvatar ? (
              <Image
                src={user.userAvatar}
                alt={user.username}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-2xl ${
                user.isAlive ? 'bg-blue-100' : 'bg-gray-700'
              }`}>
                {getRoleEmoji(user)}
              </div>
            )}
          </div>
          
          {/* 状态标识 */}
          {getStatusEmoji(user) && (
            <div className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full px-1 border shadow-sm">
              {getStatusEmoji(user)}
            </div>
          )}
        </div>
        
        {/* 用户信息 */}
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${
            user.isAlive ? 'text-white' : 'text-red-400'
          }`}>
            {user.username}
          </div>
          {user.isAI && (
            <div className="text-xs text-purple-300 mt-0.5">AI玩家</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-white text-lg font-semibold mb-6 text-center">玩家状态</h3>
      
      <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="space-y-3">
          <div className="text-white text-sm font-medium text-center mb-2 opacity-75">
            1-4号位
          </div>
          {leftColumn.map(renderPlayer)}
        </div>
        
        <div className="space-y-3">
          <div className="text-white text-sm font-medium text-center mb-2 opacity-75">
            5-8号位
          </div>
          {rightColumn.map(renderPlayer)}
        </div>
      </div>
      
      <div className="mt-6 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span className="text-white opacity-75">
            存活: {users.filter(u => u.isAlive).length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <span className="text-white opacity-75">
            死亡: {users.filter(u => !u.isAlive).length}
          </span>
        </div>
        {users.some(u => u.isAI) && (
          <div className="flex items-center gap-2">
            <span className="text-purple-300">🤖</span>
            <span className="text-white opacity-75">
              AI: {users.filter(u => u.isAI).length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerStatus;