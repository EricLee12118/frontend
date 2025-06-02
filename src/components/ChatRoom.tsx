'use client';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@/utils/useNavigation';
import { useRoomContext } from '@/contexts/ChatContext';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
const ChatRoom = () => {
  const { handleNavigation } = useNavigation();
  const { user } = useUser(); 
  const { 
    roomId, 
    users, 
    messages, 
    message, 
    setMessage, 
    sendMessage, 
    leaveRoom,
    socket
  } = useRoomContext();
  console.log(user, users)
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isTogglingReady, setIsTogglingReady] = useState(false);

  // 检查当前用户是否已准备
  useEffect(() => {
    if (users.length && user) {
      const currentUser = users.find(u => u.userId === user.id);
      if (currentUser) {
        setIsReady(currentUser.isReady);
      }
    }
  }, [users, user]);

  // 切换准备状态
  const toggleReady = () => {
    if (!socket || isTogglingReady) return;
    
    setIsTogglingReady(true);
    
    try {
      // 发送切换准备状态的事件到服务器
      socket.emit('toggle_ready', { 
        roomId, 
        userId: user?.id,
        ready: !isReady 
      });
      
      // 系统会通过room_users事件返回更新后的用户列表，所以这里不需要手动更新本地状态
    } catch (error) {
      console.error("切换准备状态失败:", error);
    } finally {
      // 延迟一下，防止按钮连续点击
      setTimeout(() => {
        setIsTogglingReady(false);
      }, 500);
    }
  };

  // 模拟从API获取随机AI名字和头像
  const fetchRandomAIProfile = async () => {
    try {
      // 模拟API返回数据
      return new Promise<{name: string, avatar: string}>((resolve) => {
        setTimeout(() => {
          // 随机AI名字列表
          const aiNames = [
            "AI智者", "电子玩家", "数字灵魂", "逻辑思维", "矩阵行者",
            "代码大师", "虚拟玩家", "像素战士", "量子思维", "自动决策",
            "机器智能", "运算高手", "数据分析", "算法精灵", "神经网络"
          ];
          
          // 使用最新的DiceBear API
          const styles = ['bottts', 'pixel-art', 'icons', 'shapes', 'thumbs'];
          const randomStyle = styles[Math.floor(Math.random() * styles.length)];
          const seed = `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const avatar = `https://api.dicebear.com/9.x/${randomStyle}/png?seed=${seed}`;
          
          // 随机选择一个名字
          const randomName = aiNames[Math.floor(Math.random() * aiNames.length)] + 
                            Math.floor(Math.random() * 100);
          
          resolve({
            name: randomName,
            avatar: avatar
          });
        }, 300); // 模拟网络延迟
      });
    } catch (error) {
      console.error("获取AI档案失败:", error);
      // 提供默认值以防API调用失败
      return {
        name: `AI玩家${Math.floor(Math.random() * 1000)}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=fallback-${Math.floor(Math.random() * 1000)}`
      };
    }
  };

  const fillWithAI = async () => {
    if (!socket) {
      console.error("Socket未连接");
      return;
    }
    
    try {
      setIsLoadingAI(true);
      const maxPlayers = 8;
      const currentPlayerCount = users.length;
      const aiNeeded = maxPlayers - currentPlayerCount;
      
      if (aiNeeded <= 0) {
        socket.emit('send_msg', {
          roomId,
          message: "房间已满，无需添加AI玩家",
          sender: "系统",
          userId: "system"
        });
        return;
      }
      
      // 生成AI玩家资料
      const aiPlayers = [];
      for (let i = 0; i < aiNeeded; i++) {
        const aiProfile = await fetchRandomAIProfile();
        
        aiPlayers.push({
          userId: `ai-${Date.now()}-${i}`,
          username: aiProfile.name,
          userAvatar: aiProfile.avatar,
          isReady: true, 
          isRoomOwner: false,
          isAI: true
        });
      }
      
      // 发送到服务器
      socket.emit('add_ai_players', {
        roomId,
        aiPlayers
      });
      
    } catch (error) {
      console.error("填充AI失败:", error);
      if (socket) {
        socket.emit('send_msg', {
          roomId,
          message: "添加AI玩家失败，请稍后重试",
          sender: "系统",
          userId: "system"
        });
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div>
      <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">🐺 房间名称：{roomId} </span>
            <span className="text-gray-600">🎮 当前人数：{users.length}</span>
          </div>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              onClick={() => handleNavigation('/lobby')}
            >
              🏠 返回大厅
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white bg-opacity-90 p-6 rounded-lg shadow-md space-y-6">
          <div className="text-center text-gray-600 text-lg">等待玩家加入...</div>
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
                  {((user as any).isAI || (user as any).isAI) && (
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

          <div>
            <h2 className="text-xl font-semibold mb-4">🎲 游戏配置 (经典8人局)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 狼人 */}
              <div className="bg-red-50 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                <span className="text-2xl">🐺</span>
                <div>
                  <p className="font-semibold text-gray-800">狼人</p>
                  <p className="text-sm text-gray-600">x3</p>
                </div>
              </div>

              {/* 村民 */}
              <div className="bg-green-50 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-semibold text-gray-800">村民</p>
                  <p className="text-sm text-gray-600">x3</p>
                </div>
              </div>

              {/* 预言家 */}
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <p className="font-semibold text-gray-800">预言家</p>
                  <p className="text-sm text-gray-600">x1</p>
                </div>
              </div>

              {/* 女巫 */}
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                <span className="text-2xl">💊</span>
                <div>
                  <p className="font-semibold text-gray-800">女巫</p>
                  <p className="text-sm text-gray-600">x1</p>
                </div>
              </div>
            </div>
          </div>

          {/* 聊天区 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">💬 聊天区域</h2>
            <div className="h-64 overflow-y-auto border p-2 mb-4 bg-white rounded-lg shadow-inner">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`mb-2 p-2 rounded ${msg.isSystem ? 'bg-pink-100' : 'bg-gray-100'}`}
                >
                  <span className="font-bold">{msg.sender}</span>
                  <span className="text-black text-sm ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  <p className="mt-1">{msg.message}</p>
                  {msg.isSystem && <span className="text-xs text-pink-500">[系统信息]</span>}
                </div>
              ))}
            </div>

            <form onSubmit={sendMessage} className="flex flex-col">
              <input
                type="text"
                placeholder="输入消息..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                required
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300 mb-2"
              >
                发送
              </button>
              <button
                type="button"
                onClick={leaveRoom}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
              >
                退出房间
              </button>
            </form>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🎮 房主控制区</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
              >
                🎮 开始游戏
              </button>
              <button 
                onClick={fillWithAI}
                disabled={isLoadingAI || users.length >= 8 || !socket}
                className={`text-white px-4 py-2 rounded-lg transition duration-300 flex items-center justify-center ${
                  isLoadingAI || users.length >= 8 || !socket
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
                ) : (
                  <>🤖 一键填充AI</>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-white bg-opacity-90 p-6 rounded-lg shadow-md">
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
                       ((user as any).isAI || (user as any).isAI) ? '🤖 AI' : '👤'}
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

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">房间设置</h2>
            <ul className="space-y-2">
              <li>🕒 讨论时间：3分钟</li>
              <li>🗣️ 发言时间：30秒</li>
              <li>👁️ 允许观战：是</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">[玩家控制区]</h2>
            <div className="flex justify-center">
              <button
                onClick={toggleReady}
                disabled={isTogglingReady}
                className={`relative px-4 py-2 rounded-lg transition duration-300 text-white w-full ${
                  isTogglingReady 
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
                ) : isReady ? (
                  <>❌ 取消准备</>
                ) : (
                  <>✅ 准备</>
                )}
                {!isTogglingReady && (
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
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;