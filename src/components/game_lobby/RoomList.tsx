import React from 'react'

const RoomList = () => {
  return (
    <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">在线房间 (28)</h2>
          <span className="text-gray-600">在线人数：168</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 1,
              name: '🔥 欢乐民牌局 #1024',
              mode: '8人经典模式',
              players: '5/8 (2AI)',
              status: '进行中 12:31',
              tag: '👁️ 可观战',
            },
            {
              id: 2,
              name: '🌟 高手进阶局 #1025',
              mode: '12人进阶模式',
              players: '11/12',
              status: '等待中',
              tag: '🔒 密码房',
            },
            {
              id: 3,
              name: '新手友好局 #1026',
              mode: '6人基础模式',
              players: '2/6',
              status: '等待中',
              tag: '🎓 新手教学',
            },
            {
              id: 4,
              name: '⚔️ 大神局 #1027',
              mode: '8人混战模式',
              players: '4/8',
              status: '等待中',
              tag: '🏆 段位限制 >黄金',
            },
            {
              id: 5,
              name: '🤖 AI练习房 #1028',
              mode: '8人经典模式',
              players: '1/8 (6AI)',
              status: '等待中',
              tag: '🤖 AI难度：中级',
            },
            {
              id: 6,
              name: '🎭 趣味模式 #1029',
              mode: '10人趣味模式',
              players: '7/10',
              status: '等待中',
              tag: '🎪 换皮节目组',
            },
          ].map((room) => (
            <div
              key={room.id}
              className="p-4 border rounded-lg hover:shadow-md transition duration-300"
            >
              <h3 className="text-lg font-semibold mb-2">{room.name}</h3>
              <ul className="text-sm text-gray-600">
                <li>├── 👥 {room.mode}</li>
                <li>├── 👤 {room.players}</li>
                <li>├── {room.status}</li>
                <li>└── {room.tag}</li>
              </ul>
            </div>
          ))}
        </div>
    </div>
  )
}

export default RoomList
