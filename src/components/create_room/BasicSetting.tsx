import React, { useState } from 'react';

interface BasicSettingProps {
    onRoomNameChange?: (roomName: string) => void;
}

const generateRandomRoomName = () => {
    const adjectives = ['神秘', '快乐', '疯狂', '勇敢', '安静'];
    const nouns = ['冒险', '旅行', '聚会', '挑战', '游戏'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${randomAdjective}${randomNoun}`;
};

const BasicSetting: React.FC<BasicSettingProps> = ({ onRoomNameChange }) => {
    const [roomName, setRoomName] = useState('');

    const handleGenerateRoomName = () => {
        const newRoomName = generateRandomRoomName();
        setRoomName(newRoomName);
        if (onRoomNameChange) {
            onRoomNameChange(newRoomName); 
        }
    };

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">[基础设置]</h2>
            <div className="space-y-4">
                <div className="flex items-center">
                    <label className="w-24">房间名称:</label>
                    <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="请输入房间名称"
                        className="flex-1 p-2 border rounded-lg"
                    />
                    <button
                        className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
                        onClick={handleGenerateRoomName}
                    >
                        🎲 随机生成
                    </button>
                </div>
                <div className="flex items-center">
                    <label className="w-24">游戏人数:</label>
                    <select className="p-2 border rounded-lg">
                        {[...Array(5).keys()].map((i) => (
                            <option key={i} value={i + 8}>
                                {i + 8} 人
                            </option>
                        ))}
                    </select>
                    <span className="ml-2 text-gray-600">(8-12人)</span>
                </div>
            </div>
        </div>
    );
};

export default BasicSetting;