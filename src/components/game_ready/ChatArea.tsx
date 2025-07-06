import React from 'react';
import { NotificaitonProps } from '@/types/chat';

const ChatArea: React.FC<NotificaitonProps> = ({ 
  messages, 
  message, 
  setMessage, 
  sendMessage, 
  leaveRoom, 
  roomState 
}) => {
  return (
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
          disabled={roomState === 'playing'}
          className={`text-white px-4 py-2 rounded-lg transition duration-300 ${
            roomState === 'playing' 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          退出房间
        </button>
      </form>
    </div>
  );
};

export default ChatArea;