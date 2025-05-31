'use client';
import React from 'react';
import { useNavigation } from '@/utils/useNavigation';
import { useRoomContext } from '@/contexts/ChatContext';
import Image from 'next/image';
import request from '../utils/request';
import { useUser } from '@clerk/nextjs';

const ChatRoom = () => {
  const { handleNavigation } = useNavigation();
  const { roomId, users, username, messages, message, setMessage, sendMessage, leaveRoom } = useRoomContext();
  const { user } = useUser();
  return (
    <div>
      <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">🐺 房间名称：{roomId} </span>
            <span className="text-gray-600">🎮 当前人数：{users.length}</span>
            <span className="text-gray-600">🔒 密码房</span>
          </div>
          <div className="flex space-x-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              onClick={() => handleNavigation('/lobby')}
            >
              🏠 返回大厅
            </button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
              ❓ 帮助
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">
              📋 AI设置
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

          {/* 游戏配置区保持不变 */}
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

          {/* 聊天区保持不变 */}
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
              >
                🎮 开始游戏
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                🔄 更换配置
              </button>
              <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-300">
                🤖 一键填充AI
              </button>
              <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300">
                ⚙️ AI难度设置
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
                  key={user.username}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span>{user.isRoomOwner ? '👑 房主' : '👤'}</span>
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
              <li>🎙️ 语音聊天：开启</li>
              <li>🤖 AI行为模式：真实</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">[玩家控制区]</h2>
            <div className="flex space-x-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
                onClick={()=>{
                  users.map((user) =>{
                    if(user.username = username){
                      user.isReady = !user.isReady;
                    }
                  })
                }}
              >
                ✅ 准备/取消
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              >
                🔄 换房
              </button>
              <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-300">
                📢 语音开关
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;