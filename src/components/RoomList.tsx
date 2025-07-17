import { useState } from 'react';
import { useRoomContext } from '@/contexts/ChatContext';
import { Plus, Users, Clock, Crown } from 'lucide-react';

export const RoomsList = () => {
  const { rooms, username, roomId, setRoomId, joinRoom } = useRoomContext();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tempRoomId, setTempRoomId] = useState(''); // 临时存储，用于显示

  const handleJoinRoom = () => {
    setShowJoinModal(false);
    joinRoom();
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateModal(false);
    joinRoom(); // 此时 roomId 已经通过输入实时更新
  };

  const openCreateModal = () => {
    setTempRoomId(roomId); // 保存当前值，以便取消时恢复
    setShowCreateModal(true);
  };

  const cancelCreateModal = () => {
    setRoomId(tempRoomId); // 恢复原值
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen">
      {/* 页面标题和创建房间按钮 */}
      <div className="bg-white bg-opacity-90 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">游戏大厅</h1>
            <p className="text-gray-600 mt-2">欢迎回来，{username}！选择一个房间加入或创建新房间</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transform transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            创建房间
          </button>
        </div>
      </div>

      {/* 房间列表 */}
      <div className="bg-white bg-opacity-90 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          在线房间
        </h2>
        
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无在线房间</p>
            <p className="text-gray-400 mt-2">点击上方按钮创建第一个房间吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className="bg-gray-50 p-5 rounded-lg border border-gray-200 hover:shadow-xl hover:scale-105 transform transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setRoomId(room.roomId);
                  setShowJoinModal(true);
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800">{room.roomId}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    room.userCount >= 10 ? 'bg-red-100 text-red-600' : 
                    room.userCount >= 6 ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-green-100 text-green-600'
                  }`}>
                    {room.userCount}/8
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span>房主：{room.creator}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>玩家：{room.userCount} 人</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span>{new Date(room.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="bg-blue-500 hover:bg-blue-600 text-white text-center py-2 rounded-lg font-medium text-sm transition-colors">
                    点击加入
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 加入房间确认弹窗 */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">加入房间</h2>
            <p className="text-gray-600 mb-6">
              确认要加入房间 <span className="font-bold text-blue-600">{roomId}</span> 吗？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleJoinRoom}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                确认加入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建房间弹窗 - 直接更新 roomId */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">创建新房间</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  房间名称
                </label>
                <input
                  type="text"
                  placeholder="输入房间名称"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)} // 直接更新 roomId
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  请输入一个独特的房间名称，其他玩家将通过此名称加入
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={cancelCreateModal}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  创建并加入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsList;