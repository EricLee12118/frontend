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
    
    // 只有在游戏结束时才显示真实角色，否则显示通用图标
    if (gameState.isActive) {
      return user.isAlive ? '😊' : '💀';
    }
    
    // 游戏结束后可以显示角色（如果服务端提供）
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
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">玩家状态</h3>
      
      {/* 圆桌布局 */}
      <div className="relative w-80 h-80 mx-auto mb-4">
        {sortedUsers.map((user, index) => {
          const angle = (index * 360) / sortedUsers.length;
          const radian = (angle * Math.PI) / 180;
          const radius = 120;
          const x = radius * Math.cos(radian - Math.PI / 2);
          const y = radius * Math.sin(radian - Math.PI / 2);
          
          return (
            <div
              key={user.userId}
              className={`absolute w-16 h-16 transform -translate-x-1/2 -translate-y-1/2 ${
                !user.isAlive ? 'opacity-50 grayscale' : ''
              }`}
              style={{
                left: `50%`,
                top: `50%`,
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
              }}
            >
              {/* 位置号码 */}
              <div className="absolute -top-2 -left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {user.pos}
              </div>
              
              {/* 头像 */}
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300">
                {user.userAvatar ? (
                  <Image
                    src={user.userAvatar}
                    alt={user.username}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-2xl">
                    {getRoleEmoji(user)}
                  </div>
                )}
              </div>
              
              {/* 状态标识 */}
              <div className="absolute -bottom-2 -right-2 text-xs">
                {getStatusEmoji(user)}
              </div>
              
              {/* 用户名 */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs text-center whitespace-nowrap">
                {user.username}
              </div>
            </div>
          );
        })}
        
        {/* 中心圆桌 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-amber-100 rounded-full border-4 border-amber-300 flex items-center justify-center">
          <span className="text-2xl">🎯</span>
        </div>
      </div>
      
      {/* 玩家列表 */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {sortedUsers.map(user => (
          <div
            key={user.userId}
            className={`flex items-center justify-between p-2 rounded ${
              !user.isAlive ? 'bg-gray-100 opacity-75' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                {user.pos}
              </span>
              <span className={`${!user.isAlive ? 'line-through text-gray-500' : ''}`}>
                {user.username}
              </span>
            </div>
            <div className="text-sm">
              {getStatusEmoji(user)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerStatus;