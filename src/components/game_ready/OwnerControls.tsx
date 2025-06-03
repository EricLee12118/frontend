import React from 'react';
import { Socket } from 'socket.io-client';

interface UserType {
  userId: string;
  username: string;
  userAvatar: string;
  isReady: boolean;
  isAI?: boolean;
}

interface OwnerControlsProps {
  roomState: string;
  startGame: () => void;
  endGame: () => void;
  fillWithAI: () => void;
  isStartingGame: boolean;
  isEndingGame: boolean;
  isLoadingAI: boolean;
  users: UserType[];
  socket: Socket | null;
}

const OwnerControls: React.FC<OwnerControlsProps> = ({
  roomState,
  startGame,
  endGame,
  fillWithAI,
  isStartingGame,
  isEndingGame,
  isLoadingAI,
  users,
  socket
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">🎮 房主控制区</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* 开始游戏按钮 */}
        {roomState === 'ready' && (
          <button
            onClick={startGame}
            disabled={isStartingGame}
            className={`text-white px-4 py-2 rounded-lg transition duration-300 ${
              isStartingGame 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isStartingGame ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                开始中...
              </>
            ) : (
              <>🎮 开始游戏</>
            )}
          </button>
        )}
        
        {/* 结束游戏按钮 */}
        {roomState === 'playing' && (
          <button
            onClick={endGame}
            disabled={isEndingGame}
            className={`text-white px-4 py-2 rounded-lg transition duration-300 ${
              isEndingGame 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isEndingGame ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                结束中...
              </>
            ) : (
              <>🛑 结束游戏</>
            )}
          </button>
        )}
        
        {/* 重置游戏按钮 */}
        {roomState === 'ended' && (
          <button
            onClick={() => socket?.emit('reset_room', { roomId: 'roomId' })}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            🔄 重置游戏
          </button>
        )}
        
        {/* 一键填充AI按钮 */}
        <button 
          onClick={fillWithAI}
          disabled={isLoadingAI || users.length >= 8 || !socket || roomState === 'playing'}
          className={`text-white px-4 py-2 rounded-lg transition duration-300 flex items-center justify-center ${
            isLoadingAI || users.length >= 8 || !socket || roomState === 'playing'
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
        >
          {isLoadingAI ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              添加中...
            </>
          ) : roomState === 'playing' ? (
            <>🤖 游戏中无法添加AI</>
          ) : (
            <>🤖 一键填充AI</>
          )}
        </button>
      </div>
    </div>
  );
};

export default OwnerControls;