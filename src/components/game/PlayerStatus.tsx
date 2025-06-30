// components/game/PlayerStatus.tsx
import React from 'react';
import Image from 'next/image';
import { User } from '@/types/chat';

interface PlayerStatusProps {
  users: User[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gameState: any;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ users, gameState }) => {
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

  // 按位置排序
  const sortedUsers = [...users].sort((a, b) => (a.pos || 0) - (b.pos || 0));

  return (
    <div className="relative">
      <h3 className="text-white text-lg font-semibold mb-6 text-center">玩家状态</h3>
      
      {/* 圆桌布局 */}
      <div className="relative w-96 h-96 mx-auto">
        {sortedUsers.map((user, index) => {
          const angle = (index * 360) / sortedUsers.length;
          const radian = (angle * Math.PI) / 180;
          const radius = 150;
          const x = radius * Math.cos(radian - Math.PI / 2);
          const y = radius * Math.sin(radian - Math.PI / 2);
          
          return (
            <div
              key={user.userId}
              className={`absolute w-20 h-20 transform -translate-x-1/2 -translate-y-1/2 ${
                !user.isAlive ? 'opacity-50 grayscale' : ''
              }`}
              style={{
                left: `50%`,
                top: `50%`,
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
              }}
            >
              {/* 位置号码 */}
              <div className="absolute -top-3 -left-3 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold border-2 border-white">
                {user.pos}
              </div>
              
              {/* 头像 */}
              <div className={`w-20 h-20 rounded-full overflow-hidden border-4 ${
                user.isAlive ? 'border-green-400' : 'border-red-400'
              } ${!user.isAlive ? 'bg-gray-800' : 'bg-white'}`}>
                {user.userAvatar ? (
                  <Image
                    src={user.userAvatar}
                    alt={user.username}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-3xl ${
                    user.isAlive ? 'bg-blue-100' : 'bg-gray-700'
                  }`}>
                    {getRoleEmoji(user)}
                  </div>
                )}
              </div>
              
              {/* 状态标识 */}
              <div className="absolute -bottom-2 -right-2 text-sm bg-white rounded-full px-1 border">
                {getStatusEmoji(user)}
              </div>
              
              {/* 用户名 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs text-center whitespace-nowrap">
                <div className={`px-2 py-1 rounded ${
                  user.isAlive ? 'bg-white bg-opacity-20 text-white' : 'bg-red-500 bg-opacity-20 text-red-200'
                }`}>
                  {user.username}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* 中心圆桌 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-amber-900 bg-opacity-50 rounded-full border-4 border-amber-600 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <span className="text-4xl">🎯</span>
            <div className="text-white text-xs mt-1">狼人杀</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatus;