import React from 'react';

interface UserType {
  userId: string;
  username: string;
  userAvatar: string;
  isReady: boolean;
  isRoomOwner?: boolean;
  isAI?: boolean;
}

interface PlayerListProps {
  users: UserType[];
  isAIUser: (user: UserType) => boolean;
}

const PlayerList: React.FC<PlayerListProps> = ({ users, isAIUser }) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">房间玩家 ({users.length}/8)</h2>
      <ul className="space-y-2">
        {users.map((user) => (
          <li
            key={user.userId || user.username}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span>
                {user.isRoomOwner ? '👑 房主' : 
                 isAIUser(user) ? '🤖 AI' : '👤'}
              </span>
              <span className="truncate">{user.username}</span>
            </div>
            <span
              className={`${
                user.isReady ? 'text-green-500' : 'text-yellow-500'
              }`}
            >
              {user.isReady ? '✅ 已准备' : '⏳ 未准备'}
            </span>
          </li>
        ))}

        {Array.from({ length: 8 - users.length }).map((_, index) => (
          <li
            key={`empty-${index}`}
            className="flex items-center justify-between p-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400"
          >
            <span>空闲中</span>
            <span>🕳️ 空闲中</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;