import React from 'react'

const SelectedSetting = () => {
  return (
    <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">[可选设置]</h2>
        <div className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center">
            <label className="w-24">🔒 房间密码:</label>
            <input
                type="text"
                placeholder="请输入房间密码"
                className="flex-1 p-2 border rounded-lg"
            />
            </div>
            <div className="flex items-center">
            <label className="w-24">🗣️ 发言时间:</label>
            <select className="p-2 border rounded-lg">
                {[...Array(6).keys()].map((i) => (
                <option key={i} value={(i + 1) * 10}>
                    {(i + 1)} 分钟
                </option>
                ))}
            </select>
            </div>
            <div className="space-y-2">
            <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                允许观战
            </label>
            <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                开启语音聊天
            </label>
            </div>
        </div>
    </div>
  )
}

export default SelectedSetting
