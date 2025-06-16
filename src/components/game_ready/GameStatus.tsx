import React from 'react';
import { useRoomContext } from '@/contexts/ChatContext';

const GameStatus: React.FC = () => {
  const { socket, roomId } = useRoomContext();

  const exitGame = () => {
    if (socket && roomId) {
      socket.emit('end_game', { roomId });
    }
  };

  return (
    <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">游戏状态</h2>
      <ul className="space-y-2 mb-6">
        <li>🔄 当前回合：1</li>
        <li>🌙 当前阶段：黑夜</li>
        <li>⏱️ 游戏时长：0 分钟</li>
      </ul>
      
      <button 
        onClick={exitGame}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
      >
        <span className="mr-2">🚪</span>
        结束游戏
      </button>
    </div>
  );
};

export default GameStatus;