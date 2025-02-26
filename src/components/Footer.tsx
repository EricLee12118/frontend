import React from 'react'

const Footer = () => {
  return (
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md flex justify-between items-center">
        <div className="flex space-x-4">
            <button className="text-gray-600 hover:text-gray-800">📊 游戏数据</button>
            <button className="text-gray-600 hover:text-gray-800">👥 好友列表</button>
            <button className="text-gray-600 hover:text-gray-800">📢 公告</button>
        </div>
    </div>
  )
}

export default Footer
