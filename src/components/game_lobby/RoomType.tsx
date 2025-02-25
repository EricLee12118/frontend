import React from 'react'

const RoomType = () => {
  return (
    <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">房间类型说明</h2>
        <div className="flex space-x-4">
          <span>🔥 热门房间</span>
          <span>🌟 高手房间</span>
          <span>🎓 新手房间</span>
          <span>🤖 AI房间</span>
          <span>🎭 特殊房间</span>
          <span>🔒 密码房</span>
        </div>
      </div>
  )
}

export default RoomType
