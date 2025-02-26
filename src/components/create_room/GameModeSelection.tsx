import React, { useState } from 'react';

const GameModeSelection = () => {
    const [selectedMode, setSelectedMode] = useState('classic');

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">[游戏模式选择]</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    className={`p-4 border rounded-lg text-center hover:shadow-md transition duration-300 cursor-pointer ${selectedMode === 'classic' ? 'bg-gray-200' : ''}`}
                    onClick={() => setSelectedMode('classic')}
                >
                    <div className="text-2xl">🌙 经典模式</div>
                    <ul className="mt-2 text-left list-disc list-inside">
                        <li>标准玩法</li>
                        <li>适合新手</li>
                    </ul>
                </div>
                <div
                    className={`p-4 border rounded-lg text-center hover:shadow-md transition duration-300 cursor-pointer ${selectedMode === 'advanced' ? 'bg-gray-200' : ''}`}
                    onClick={() => setSelectedMode('advanced')}
                >
                    <div className="text-2xl">🎭 进阶模式</div>
                    <ul className="mt-2 text-left list-disc list-inside">
                        <li>更多特殊身份</li>
                        <li>增加游戏变数</li>
                    </ul>
                </div>
                <div
                    className={`p-4 border rounded-lg text-center hover:shadow-md transition duration-300 cursor-pointer ${selectedMode === 'brawl' ? 'bg-gray-200' : ''}`}
                    onClick={() => setSelectedMode('brawl')}
                >
                    <div className="text-2xl">⚔️ 混战模式</div>
                    <ul className="mt-2 text-left list-disc list-inside">
                        <li>PK场模式</li>
                        <li>快速游戏</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GameModeSelection;