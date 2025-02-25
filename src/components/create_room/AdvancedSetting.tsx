import React, { useState } from 'react'

const AdvancedSetting = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 cursor-pointer flex items-center"
                onClick={() => setIsExpanded(!isExpanded)}>
                [高级选项 {isExpanded ? '▲' : '▼'}]
            </h2>
            <div
                className={`p-4 border rounded-lg space-y-4 overflow-hidden transition-all duration-300 
                    ${ isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`
                }>
                <div>
                <h3 className="font-semibold">🎯 投票方式</h3>
                <div className="space-y-2">
                    <label className="flex items-center">
                    <input type="radio" name="vote" className="mr-2" />
                    实时显示票数
                    </label>
                    <label className="flex items-center">
                    <input type="radio" name="vote" className="mr-2" />
                    结算后显示
                    </label>
                </div>
                </div>
                <div>
                <h3 className="font-semibold">🌙 夜晚行动顺序</h3>
                <ol className="list-decimal list-inside">
                    <li>狼人杀人</li>
                    <li>女巫救人/毒人</li>
                    <li>预言家验人</li>
                </ol>
                </div>
            </div>
        </div>
    )
}

export default AdvancedSetting
