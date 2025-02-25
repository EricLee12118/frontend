import { useNavigation } from '@/utils/useNavigation';
import React from 'react'

const RoomSearch = () => {
    const { handleNavigation } = useNavigation();
  return (
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300" onClick={() => handleNavigation('/ready')}>
            快速加入
          </button>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300" onClick={() => handleNavigation('/create')}>
            创建房间
          </button>
          <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
            刷新列表
          </button>
        </div>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="🔍 搜索房间..."
            className="p-2 border rounded-lg"
          />
          <select className="p-2 border rounded-lg">
            <option>所有模式</option>
            <option>经典模式</option>
            <option>进阶模式</option>
            <option>趣味模式</option>
          </select>
          <select className="p-2 border rounded-lg">
            <option>全部</option>
            <option>等待中</option>
            <option>进行中</option>
            <option>可观战</option>
          </select>
        </div>
      </div>
  )
}

export default RoomSearch
