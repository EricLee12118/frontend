// DiscussionPanel.tsx
import React, { useEffect, useState } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';
import { Mic, MicOff, Users, MessageSquare, Timer } from 'lucide-react';

const DiscussionPanel: React.FC = () => {
  const { 
    discussionState, 
    canSpeak, 
    endSpeech,
    message,
    setMessage,
    sendMessage,
    gameState,
    users
  } = useRoomContext();
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!discussionState?.currentSpeaker || !discussionState?.speakingStartTime) return;
    
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - discussionState.speakingStartTime!;
      const remaining = Math.max(0, discussionState.timeLimit - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(intervalId);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [discussionState?.currentSpeaker, discussionState?.speakingStartTime, discussionState?.timeLimit]);

  // 检查是否应该显示组件
  const shouldDisplay = gameState.phase === 'day' && 
                       discussionState && 
                       discussionState.totalSpeakers > 0;

  if (!shouldDisplay) {
    return null;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSpeakingOrder = () => {
    return users
      .filter(u => u.isAlive && u.pos)
      .sort((a, b) => (a.pos || 0) - (b.pos || 0));
  };

  const speakingOrder = getSpeakingOrder();

  // 如果没有有效的发言顺序，显示加载状态
  if (speakingOrder.length === 0) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
        <p className="text-white text-center">等待发言顺序分配...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 标题区域 */}
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
        <h2 className="text-white text-xl font-bold flex items-center">
          <MessageSquare className="w-6 h-6 mr-2" />
          讨论发言阶段
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 左侧：当前发言者和发言控制 */}
        <div className="space-y-4">
          {/* 当前发言者信息 */}
          {discussionState.currentSpeaker && (
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Mic className="w-5 h-5 mr-2" />
                当前发言者
              </h3>
              
              <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-400 border-opacity-30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${canSpeak ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse mr-3`} />
                    <span className="text-white text-lg font-medium">
                      {discussionState.currentSpeaker.position}号位
                    </span>
                    <span className="text-white text-lg mx-2">-</span>
                    <span className="text-white text-lg">
                      {discussionState.currentSpeaker.username}
                    </span>
                  </div>
                  {discussionState.isMySpeakingTurn && (
                    <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full">
                      您的发言时间
                    </span>
                  )}
                </div>
                
                {/* 时间显示 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-white">
                    <Timer className="w-5 h-5 mr-2" />
                    <span>剩余时间</span>
                  </div>
                  <span className={`font-mono text-xl ${timeRemaining < 30000 ? 'text-red-400' : 'text-white'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                
                {/* 发言进度条 */}
                <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                  <div 
                    className="bg-blue-400 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${((discussionState.timeLimit - timeRemaining) / discussionState.timeLimit) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 发言控制 */}
          {canSpeak && (
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
              <h3 className="text-white font-semibold mb-3">发言输入</h3>
              <div className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  placeholder="请输入您的发言内容..."
                  className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-3 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px] resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={sendMessage}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                  >
                    发送消息
                  </button>
                  <button
                    onClick={endSpeech}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                  >
                    结束发言
                  </button>
                </div>
                <p className="text-xs text-white opacity-75">
                  提示：您可以在时限内多次发言，或点击`结束发言`提前结束
                </p>
              </div>
            </div>
          )}

          {/* 发言进度概览 */}
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">发言进度</h4>
              <span className="text-sm text-white opacity-75">
                {discussionState.speakerIndex + 1} / {discussionState.totalSpeakers}
              </span>
            </div>
            <div className="mt-3 w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((discussionState.speakerIndex + 1) / discussionState.totalSpeakers) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* 右侧：发言顺序列表 */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-4 border border-white border-opacity-20">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            发言顺序
          </h3>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {speakingOrder.map((user, index) => {
              const isCurrent = index === discussionState.speakerIndex;
              const hasSpoken = index < discussionState.speakerIndex;
              
              return (
                <div
                  key={user.userId}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    isCurrent 
                      ? 'bg-blue-500 bg-opacity-30 border-2 border-blue-400 shadow-lg' 
                      : hasSpoken 
                      ? 'bg-gray-500 bg-opacity-20 opacity-60' 
                      : 'bg-white bg-opacity-5 hover:bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-3">
                      {isCurrent ? (
                        <Mic className="w-5 h-5 text-blue-400 animate-pulse" />
                      ) : hasSpoken ? (
                        <MicOff className="w-5 h-5 text-gray-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-white font-medium">
                        {user.pos}号位
                      </span>
                      <span className="text-white opacity-75 mx-2">-</span>
                      <span className="text-white">
                        {user.username}
                      </span>
                      {user.isAI && (
                        <span className="ml-2 text-xs bg-purple-500 bg-opacity-30 text-purple-200 px-2 py-0.5 rounded">
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {isCurrent && (
                      <span className="text-xs text-blue-300 font-medium">发言中</span>
                    )}
                    {hasSpoken && (
                      <span className="text-xs text-green-400">已发言</span>
                    )}
                    {!isCurrent && !hasSpoken && (
                      <span className="text-xs text-gray-400">等待中</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPanel;