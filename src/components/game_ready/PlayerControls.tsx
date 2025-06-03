import React from 'react';

interface PlayerControlsProps {
  toggleReady: () => void;
  isTogglingReady: boolean;
  isReady: boolean;
  roomState: string;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  toggleReady,
  isTogglingReady,
  isReady,
  roomState
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">[玩家控制区]</h2>
      <div className="flex justify-center">
        <button
          onClick={toggleReady}
          disabled={isTogglingReady || roomState === 'playing'}
          className={`relative px-4 py-2 rounded-lg transition duration-300 text-white w-full ${
            isTogglingReady || roomState === 'playing'
              ? 'bg-gray-400 cursor-not-allowed' 
              : isReady 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isTogglingReady ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              处理中...
            </>
          ) : roomState === 'playing' ? (
            <>🎮 游戏中</>
          ) : isReady ? (
            <>❌ 取消准备</>
          ) : (
            <>✅ 准备</>
          )}
          {!isTogglingReady && roomState !== 'playing' && (
            <span 
              className={`absolute inset-0 rounded-lg ${
                isReady 
                  ? 'bg-orange-400' 
                  : 'bg-green-400'
              } animate-pulse opacity-0 group-hover:opacity-20`}>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlayerControls;