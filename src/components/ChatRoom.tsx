import { useChatContext } from '@/contexts/ChatContext';

export const ChatRoom = () => {
  const { roomId, users, messages, message, setMessage, sendMessage, leaveRoom } = useChatContext();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl mb-2">
          当前房间: {roomId} ({users.length}人在线)
        </h2>
        <div className="mb-2">{users.join(', ')}</div>
      </div>
      
      <div className="mb-6 h-64 overflow-y-auto border p-2">
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

      <div className="mb-4">
        <form onSubmit={sendMessage} className="mb-6">
          <input
            type="text"
            placeholder="输入消息"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border mb-2"
            required
          />
          <button
            type="submit"
            className="bg-green-500 text-white p-2 rounded w-full"
          >
            发送消息
          </button>
          <button
            onClick={leaveRoom}
            className="bg-red-500 text-white p-2 rounded mt-2 w-full"
          >
            退出房间
          </button>
        </form>
      </div>
    </div>
  );
};