'use client';
import { useRoomContext } from '@/contexts/ChatContext';
import { useUser } from '@clerk/nextjs';

import Header from '@/components/game_ready/Header';
import PlayerGrid from '@/components/game_ready/PlayerGrid';
import GameConfig from '@/components/game_ready/GameConfig';
import ChatArea from '@/components/game_ready/ChatArea';
import OwnerControls from '@/components/game_ready/OwnerControls';
import PlayerList from '@/components/game_ready/PlayerList';
import RoomSettings from '@/components/game_ready/RoomSettings';
import GameStatus from '@/components/game_ready/GameStatus';
import PlayerControls from '@/components/game_ready/PlayerControls';

import { useAI } from '@/hooks/useAI';
import { useGameControls } from '@/hooks/useGameControls';

const GameRoom = () => {
  const { user } = useUser(); 
  const { 
    roomId, 
    users, 
    messages, 
    message, 
    setMessage, 
    sendMessage, 
    leaveRoom,
    socket,
    roomState, 
  } = useRoomContext();
  
  // 从钩子中获取AI相关功能
  const { 
    isLoadingAI, 
    fillWithAI, 
    isAIUser 
  } = useAI(socket, roomId, users, roomState);
  
  // 从钩子中获取游戏控制功能
  const {
    isReady,
    isTogglingReady,
    isStartingGame,
    isEndingGame,
    toggleReady,
    startGame,
    endGame
  } = useGameControls(socket, roomId, users, user, roomState);

  console.log("roomState:", roomState);

  return (
    <div>
      {/* 头部信息始终显示 */}
      <Header 
        roomId={roomId} 
        usersCount={users.length} 
        roomState={roomState} 
        onLeave={leaveRoom} 
      />

      {roomState === 'playing' ? (
        /* 游戏进行中只显示GameStatus */
        <GameStatus />
      ) : (
        /* 其他状态显示原有内容 */
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white bg-opacity-90 p-6 rounded-lg shadow-md space-y-6">
            {/* 状态提示 */}
            <div className="text-center text-gray-600 text-lg">
              {roomState === 'waiting' && '等待玩家加入...'}
              {roomState === 'ready' && '所有玩家已准备就绪，等待游戏开始...'}
              {roomState === 'ended' && '游戏已结束，可以开始新游戏'}
            </div>
            
            {/* 玩家头像区 */}
            <PlayerGrid 
              users={users} 
              isAIUser={isAIUser} 
            />

            {/* 游戏配置 */}
            <GameConfig />
            {/* 聊天区 */}
            <ChatArea 
              messages={messages} 
              message={message} 
              setMessage={setMessage} 
              sendMessage={sendMessage} 
              leaveRoom={leaveRoom} 
              roomState={roomState} 
            />

            {/* 房主控制区 */}
            <OwnerControls 
              roomState={roomState}
              startGame={startGame}
              endGame={endGame}
              fillWithAI={fillWithAI}
              isStartingGame={isStartingGame}
              isEndingGame={isEndingGame}
              isLoadingAI={isLoadingAI}
              users={users}
              socket={socket}
            />
          </div>

          <div className="col-span-1 bg-white bg-opacity-90 p-6 rounded-lg shadow-md">
            {/* 玩家列表 */}
            <PlayerList 
              users={users} 
              isAIUser={isAIUser} 
            />

            {/* 房间设置 */}
            <RoomSettings />

            {/* 玩家控制区 */}
            <PlayerControls 
              toggleReady={toggleReady}
              isTogglingReady={isTogglingReady}
              isReady={isReady}
              roomState={roomState}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameRoom;