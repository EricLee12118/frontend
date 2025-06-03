import React from 'react';

const GameConfig: React.FC = () => {
  return (
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
  );
};

export default GameConfig;