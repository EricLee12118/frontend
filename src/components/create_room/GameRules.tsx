import React from 'react'

const GameRules = () => {
  return (
    <div className="mb-8">
        <div className="relative group inline-block">
            <h2 className="text-xl font-semibold mb-4 cursor-pointer">
            [游戏规则]
            </h2>
            <div className="absolute hidden group-hover:block bg-black text-white text-sm p-3 rounded-lg mt-2 w-64 z-10">
                <ul className="list-disc list-inside">
                    <li>每个角色都有特殊技能</li>
                    <li>游戏目标是找出并清除狼人</li>
                    <li>白天投票放逐玩家</li>
                    <li>夜晚角色轮流行动</li>
                </ul>
            </div>
        </div>
    </div>
  )
}

export default GameRules
