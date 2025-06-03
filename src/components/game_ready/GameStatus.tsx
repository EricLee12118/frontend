import React from 'react';

const GameStatus: React.FC = () => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">游戏状态</h2>
      <ul className="space-y-2">
        <li>🔄 当前回合：1</li>
        <li>🌙 当前阶段：黑夜</li>
        <li>⏱️ 游戏时长：0 分钟</li>
      </ul>
    </div>
  );
};

export default GameStatus;