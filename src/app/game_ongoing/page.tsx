import React from 'react';

const Page = () => {
  return (
    <div className="min-h-screen p-6">

      <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6 text-center">
        <h1 className="text-xl font-bold">狼人杀 - 第3天 白天阶段</h1>
      </div>

      {/* 主游戏区域 */}
      <div className="grid grid-cols-4 gap-6">
        {/* 左侧玩家列表 */}
        <div className="col-span-1 bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">玩家列表</h2>
          <ul className="space-y-2">
            {[
              { id: 1, name: '张三', status: '🟢 存活', action: '发言中...' },
              { id: 2, name: '李四', status: '💀 死亡', action: '昨晚死亡' },
              { id: 3, name: '王五', status: '🟢 存活', action: '等待中' },
              { id: 4, name: '赵六', status: '🟢 存活', action: '等待中' },
              { id: 5, name: '钱五', status: '🟢 存活', action: '等待中' },
              { id: 6, name: '孙六', status: '🟢 存活', action: '等待中' },
              { id: 7, name: '孙七', status: '🟢 存活', action: '等待中' },
              { id: 8, name: '周八', status: '🟢 存活', action: '等待中' },
              { id: 9, name: '吴九', status: '🟢 存活', action: '等待中' },
              { id: 10, name: '郑十', status: '🟢 存活', action: '等待中' },
              { id: 11, name: '黄十一', status: '🟢 存活', action: '等待中' },
              { id: 12, name: '胡十二', status: '🟢 存活', action: '等待中' },
            ].map((player) => (
              <li key={player.id} className="flex items-center space-x-2">
                {/* 圆形头像 */}
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm">{player.id}号</span>
                </div>
                {/* 玩家信息 */}
                <div className="flex-1">
                  <span className="font-medium">{player.name}</span>
                  <div className="text-sm text-gray-600">
                    <span>{player.status}</span>
                    <span className="ml-2">{player.action}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 主要游戏区域 */}
        <div className="col-span-3 bg-white bg-opacity-90 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">主要游戏区域</h2>
          {/* 全体玩家公告区域 */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">全体玩家公告区域</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>警长竞选阶段，请按顺序发言</p>
            </div>
          </div>
          {/* 历史记录区域 */}
          <div>
            <h3 className="text-md font-semibold mb-2">历史记录区域</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>系统：天亮了</p>
              <p>系统：2号玩家昨晚死亡</p>
              <p>2号玩家：我的遗言是...</p>
              <p>1号玩家：根据昨天的情况...</p>
            </div>
          </div>
        </div>
      </div>

      {/* 个人操作面板 */}
      <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mt-6">
        <h2 className="text-lg font-semibold mb-4 text-center">个人操作面板</h2>
        <div className="space-y-4 flex flex-col items-center">
            {/* 身份信息 */}
            <div>
            <span>你的身份：预言家</span>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-4 justify-center">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
                发言
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">
                技能
            </button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300">
                投票
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition duration-300">
                笔记
            </button>
            </div>

            {/* 快捷操作按钮 */}
            <div className="flex space-x-4 justify-center">
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
                怀疑
            </button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
                信任
            </button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
                清空
            </button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
                结束发言
            </button>
            </div>
        </div>
        </div>
    </div>
  );
};

export default Page;