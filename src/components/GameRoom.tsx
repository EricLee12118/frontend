// components/GameRoom.jsx
import React from 'react';
import { useRoomContext } from '@/contexts/ChatContext';
import { motion } from 'framer-motion';

const GameRoom = () => {
  const { messages, message, setMessage, sendMessage } = useRoomContext();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* 左侧玩家列表 */}
        {/* <div className="col-span-3 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold mb-4">玩家列表</h2>
          <div className="space-y-3">
            {users.map((user) => (
              <motion.div
                key={user.username}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      {user.username[0]}
                    </div>
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <span className={`text-sm ${user.isAlive ? 'text-green-500' : 'text-red-500'}`}>
                    {user.isAlive ? '存活' : '死亡'}
                  </span>
                </div>
                {user.role && (
                  <div className="mt-2 text-sm text-gray-600">
                    角色: {user.role}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div> */}

        {/* 中间游戏区域 */}
        <div className="col-span-6 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">游戏状态</h2>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <span className="text-lg">当前阶段：夜晚</span>
              <div className="mt-2 text-sm text-gray-600">剩余时间：2:30</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">操作区域</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                查看身份
              </button>
              <button className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                技能操作
              </button>
            </div>
          </div>

          {/* 聊天区域 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">游戏聊天</h2>
            <div className="h-64 overflow-y-auto mb-4 space-y-2">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-2 rounded-lg ${
                    msg.isSystem ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}
                >
                  <span className="font-bold">{msg.sender}: </span>
                  <span>{msg.message}</span>
                </motion.div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-2 border rounded-lg"
                placeholder="输入消息..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                发送
              </button>
            </form>
          </div>
        </div>

        {/* 右侧游戏信息 */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">游戏信息</h2>
            <div className="space-y-2">
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">回合数：3</div>
                <div className="text-sm text-gray-600">死亡玩家：2人</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium">身份信息</div>
                <div className="text-sm text-gray-600">
                  <div>🐺 狼人 x 2</div>
                  <div>👥 村民 x 3</div>
                  <div>🔍 预言家 x 1</div>
                  <div>💊 女巫 x 1</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">游戏记录</h2>
            <div className="space-y-2 text-sm">
              {[
                "第3夜：预言家查验了玩家5",
                "第2夜：女巫使用了解药",
                "第1夜：狼人击杀了玩家2"
              ].map((log, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;