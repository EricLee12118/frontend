import React from 'react'

const RoleAssignment = () => {
    const roles = [
        { id: 1, name: '🐺 狼人', min: 3, max: 5, description: '夜晚可以杀死一名玩家。' },
        { id: 2, name: '👥 村民', min: 3, max: 5, description: '白天通过讨论和投票找出狼人。' },
        { id: 3, name: '🔍 预言家', min: 1, max: 2, description: '每晚可以查验一名玩家的身份。' },
        { id: 4, name: '💊 女巫', min: 1, max: 2, description: '拥有一瓶解药和一瓶毒药，可以救人或毒人。' },
        { id: 5, name: '🛡️ 守卫', min: 0, max: 2, description: '每晚可以守护一名玩家，防止被狼人杀害。' },
        { id: 6, name: '🎭 丘比特', min: 0, max: 1, description: '可以将两名玩家设为情侣，情侣一方死亡，另一方也会殉情。' },
        { id: 7, name: '🏹 猎人', min: 0, max: 1, description: '被放逐或被狼人杀死时，可以开枪带走一名玩家。' },
        { id: 8, name: '🤪 白痴', min: 0, max: 1, description: '被放逐时不会死亡，但失去投票权。' },
    ];

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">[身份分配]</h2>
                <div className="p-4 border rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {roles.map((role) => (
                        <div key={role.id} className="flex flex-col items-center">
                        <div className="relative group">
                            <span className="text-lg cursor-pointer hover:text-blue-500">
                                {role.name}
                            </span>
                            <div className="absolute hidden group-hover:block bg-black text-white text-sm p-2 rounded-lg mt-2 w-48 z-10">
                            {role.description}
                            </div>
                        </div>
                        <input
                            type="number"
                            min={role.min}
                            max={role.max}
                            defaultValue={role.min}
                            className="mt-2 p-1 border rounded w-16 text-center"
                        />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default RoleAssignment
