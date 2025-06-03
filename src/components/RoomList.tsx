import { useState } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';

export const RoomsList = () => {
  const { rooms, username, roomId, setRoomId, joinRoom, leaveRoom } = useRoomContext();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');

  const handleJoinRoom = () => {
    setShowJoinModal(false);
    joinRoom();
  };

  const handleCreateRoom = () => {
    console.log('创建房间:', newRoomId);
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center">
        <div
          className="p-5 rounded-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          创建房间
        </div>
      </div>

      <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md mt-6 my-6">
        <h2 className="text-xl font-semibold mb-4">推荐房间</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="p-4 border rounded-lg hover:shadow-md transition duration-300 cursor-pointer"
              onClick={() => {
                setRoomId(room.roomId);
                setShowJoinModal(true);
              }}
            >
              <h3 className="text-lg font-semibold mb-2">{room.roomId}</h3>
              <ul className="text-sm text-gray-600">
                <li>房间名 {room.roomId}</li>
                <li>人数 {room.numUsers}</li>
                <li>房主 {room.creator}</li>
                <li>创建时间 {room.createdAt}</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 加入房间的模态框 */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">确认加入房间 {roomId}?</h2>
            <div className="flex justify-end">
              <button
                onClick={() => setShowJoinModal(false)}
                className="mr-2 text-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleJoinRoom}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建房间的模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">创建新房间</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">房间ID</label>
              <input
                type="text"
                placeholder="输入房间ID"
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="mr-2 text-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleCreateRoom}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
              >
                创建房间
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={joinRoom} className="mb-6 p-6 border rounded-lg bg-gray-50">
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              placeholder="用户名"
              value={username}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">房间ID</label>
            <input
              type="text"
              placeholder="房间ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors"
            >
              加入房间
            </button>
            <button
              type="button"
              onClick={leaveRoom}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors"
            >
              退出房间
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RoomsList;