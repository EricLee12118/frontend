import React, { useEffect, useState, useRef } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';
import { Mic, MicOff, Users, MessageSquare, Timer, Send } from 'lucide-react';

const DiscussionPanel: React.FC = () => {
  const { 
    discussionState, 
    canSpeak, 
    endSpeech,
    message,
    setMessage,
    sendMessage,
    gameState,
    users,
    messages
  } = useRoomContext();
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  
  // 获取游戏消息（非系统消息）
  const gameMessages = messages.filter(msg => !msg.isSystem);

  if (speakingOrder.length === 0) {
    return (
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-6 border border-white border-opacity-20">
        <p className="text-white text-center">等待发言顺序分配...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl border border-white border-opacity-20 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white border-opacity-10">
        <h2 className="text-white text-xl font-bold flex items-center">
          <MessageSquare className="w-6 h-6 mr-2" />
          讨论发言阶段
        </h2>
      </div>

      {/* 内容区域 - 固定高度 */}
      <div className="h-[500px] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-6 h-full">
          {/* 左侧：发言顺序 (3列) */}
          <div className="col-span-3 h-full overflow-hidden">
            <div className="bg-white bg-opacity-5 rounded-lg p-4 h-full flex flex-col overflow-hidden">
              <h3 className="text-white font-semibold mb-4 flex items-center flex-shrink-0">
                <Users className="w-5 h-5 mr-2" />
                发言顺序
                <span className="ml-auto text-sm opacity-75">
                  {discussionState.speakerIndex + 1} / {discussionState.totalSpeakers}
                </span>
              </h3>
              
              {/* 发言进度条 */}
              <div className="mb-4 w-full bg-white bg-opacity-20 rounded-full h-2 flex-shrink-0">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((discussionState.speakerIndex + 1) / discussionState.totalSpeakers) * 100}%`
                  }}
                />
              </div>
              
              {/* 发言顺序列表 - 可滚动 */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-2">
                  {speakingOrder.map((user, index) => {
                    const isCurrent = index === discussionState.speakerIndex;
                    const hasSpoken = index < discussionState.speakerIndex;
                    
                    return (
                      <div
                        key={user.userId}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                          isCurrent 
                            ? 'bg-blue-500 bg-opacity-30 border border-blue-400' 
                            : hasSpoken 
                            ? 'bg-gray-500 bg-opacity-20 opacity-60' 
                            : 'bg-white bg-opacity-5 hover:bg-opacity-10'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="mr-2">
                            {isCurrent ? (
                              <Mic className="w-4 h-4 text-blue-400 animate-pulse" />
                            ) : hasSpoken ? (
                              <MicOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                                {index + 1}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-white text-sm">
                              {user.pos}号 - {user.username}
                            </span>
                            {user.isAI && (
                              <span className="ml-1 text-xs bg-purple-500 bg-opacity-30 text-purple-200 px-1 rounded">
                                AI
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 中间：发言输入 (6列) */}
          <div className="col-span-6 h-full overflow-hidden">
            <div className="bg-white bg-opacity-5 rounded-lg p-4 h-full flex flex-col overflow-hidden">
              {/* 当前发言者信息 */}
              {discussionState.currentSpeaker && (
                <div className="mb-4 flex-shrink-0">
                  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-4 border border-blue-400 border-opacity-30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${canSpeak ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse mr-3`} />
                        <span className="text-white font-medium">
                          {discussionState.currentSpeaker.position}号位 - {discussionState.currentSpeaker.username}
                        </span>
                      </div>
                      {discussionState.isMySpeakingTurn && (
                        <span className="text-xs bg-green-500 text-white px-3 py-1 rounded-full">
                          您的发言时间
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-white text-sm">
                        <Timer className="w-4 h-4 mr-2" />
                        <span>剩余时间</span>
                      </div>
                      <span className={`font-mono text-lg ${timeRemaining < 30000 ? 'text-red-400' : 'text-white'}`}>
                        {formatTime(timeRemaining)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 发言输入区 */}
              <div className="flex-1 flex flex-col min-h-0">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (canSpeak) sendMessage(e);
                    }
                  }}
                  placeholder={canSpeak ? "请输入您的发言内容..." : "等待您的发言时间..."}
                  disabled={!canSpeak}
                  className={`flex-1 w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-4 py-3 text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none min-h-0 ${
                    !canSpeak ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                
                {canSpeak && (
                  <>
                    <div className="mt-3 flex gap-2 flex-shrink-0">
                      <button
                        onClick={sendMessage}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 font-medium flex items-center justify-center"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        发送消息
                      </button>
                      <button
                        onClick={endSpeech}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                      >
                        结束发言
                      </button>
                    </div>
                    <p className="text-xs text-white opacity-75 mt-2 text-center flex-shrink-0">
                      提示：您可以在时限内多次发言，或点击`结束发言`提前结束
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：游戏消息记录 (3列) */}
          <div className="col-span-3 h-full overflow-hidden">
            <div className="bg-white bg-opacity-5 rounded-lg p-4 h-full flex flex-col overflow-hidden">
              <h3 className="text-white font-semibold mb-4 flex items-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 mr-2" />
                发言记录
                <span className="ml-auto text-xs opacity-75">
                  {gameMessages.length} 条消息
                </span>
              </h3>
              
              {/* 消息列表 - 可滚动 */}
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-2">
                  {gameMessages.length === 0 ? (
                    <p className="text-white opacity-50 text-center text-sm">暂无发言记录</p>
                  ) : (
                    gameMessages.map((msg, index) => (
                      <div key={index} className="bg-white bg-opacity-5 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-blue-300 font-medium text-sm">
                                {msg.sender}
                              </span>
                              <span className="text-white opacity-50 text-xs">
                                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-white text-sm break-words">
                              {msg.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPanel;