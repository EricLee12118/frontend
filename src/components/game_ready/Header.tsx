import React from 'react';

interface HeaderProps {
  roomId: string;
  usersCount: number;
  roomState: string;
  onLeave: () => void;
}

const Header: React.FC<HeaderProps> = ({ roomId, usersCount, roomState, onLeave }) => {
  return (
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold">🐺 房间名称：{roomId} </span>
          <span className="text-gray-600">🎮 当前人数：{usersCount}</span>
          <span className="text-gray-600">
            {roomState === 'waiting' && '⏳ 等待中'}
            {roomState === 'ready' && '✅ 准备就绪'}
            {roomState === 'playing' && '🎮 游戏中'}
            {roomState === 'ended' && '🏁 游戏结束'}
          </span>
        </div>
        <div className="flex space-x-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            onClick={onLeave}
            disabled={roomState === 'playing'}
          >
            🏠 返回大厅
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;