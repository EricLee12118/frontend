import React from 'react';

const RoomSettings: React.FC = () => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">房间设置</h2>
      <ul className="space-y-2">
        <li>🕒 讨论时间：3分钟</li>
        <li>🗣️ 发言时间：30秒</li>
        <li>👁️ 允许观战：是</li>
      </ul>
    </div>
  );
};

export default RoomSettings;