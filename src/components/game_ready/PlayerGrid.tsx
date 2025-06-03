import React from 'react';
import Image from 'next/image';

interface UserType {
  userId: string;
  username: string;
  userAvatar: string;
  isReady: boolean;
  isAI?: boolean;
}

interface PlayerGridProps {
  users: UserType[];
  isAIUser: (user: UserType) => boolean;
}

const PlayerGrid: React.FC<PlayerGridProps> = ({ users, isAIUser }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {users.map((user, index) => (
        <div
          key={user.userId || index}
          className="w-20 h-20 flex items-center justify-center relative rounded-full overflow-hidden"
        >
          {user.userAvatar ? (
            <Image
              src={user.userAvatar}
              alt={user.username || '用户头像'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-2xl text-gray-400">
                {user.username?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="absolute bottom-0 right-0 flex space-x-1">
            {isAIUser(user) && (
              <div className="bg-blue-500 text-white text-xs px-1 rounded-sm">
                AI
              </div>
            )}
            {user.isReady && (
              <div className="bg-green-500 text-white text-xs px-1 rounded-sm">
                ✓
              </div>
            )}
          </div>
        </div>
      ))}
      
      {Array.from({ length: Math.max(0, 8 - users.length) }).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-full cursor-pointer hover:bg-gray-50 transition duration-300"
        >
          <span className="text-2xl text-gray-400">+</span>
        </div>
      ))}
    </div>
  );
};

export default PlayerGrid;