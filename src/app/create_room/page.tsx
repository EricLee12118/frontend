// 'use client';
// import React, { useState } from 'react';
// import useSocket from '@/lib/SocketManager';
// import { useNavigation } from '@/utils/useNavigation';
// import GameModeSelection from '@/components/create_room/GameModeSelection';
// import BasicSetting from '@/components/create_room/BasicSetting';
// import RoleAssignment from '@/components/create_room/RoleAssignment';
// import SelectedSetting from '@/components/create_room/SelectedSetting';
// import AdvancedSetting from '@/components/create_room/AdvancedSetting';
// import GameRules from '@/components/create_room/GameRules';
// import { useUser } from '@clerk/nextjs';

// const Page = () => {
//     const [roomId, setRoomId] = useState('');
//     const { socket, messages, users, rooms } = useSocket(roomId);
//     const { user, isLoaded } = useUser();
//     console.log(messages, users, rooms, isLoaded);
//     const { handleNavigation } = useNavigation();
//     const [roomName, setRoomName] = useState('');
//     console.log(roomName);

//     const handleRoomNameChange = (roomName: string) => {
//         setRoomName(roomName);
//         setRoomId(roomName);
//     };

//     const getUsername = () => {
//         return user?.username || 
//                [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 
//                user?.id;
//     };

//     const create_room = async () => {
//         if (socket && roomId.trim()) {
//             try {
//                 const response = await fetch('/api/rooms/join', {
//                     method: 'POST',
//                     headers: {
//                         'Content-Type': 'application/json',
//                     },
//                     body: JSON.stringify({
//                         userId: user?.id,
//                         roomId: roomId.trim(),
//                     }),
//                 });

//                 if (!response.ok) {
//                     throw new Error('Failed to join room');
//                 }

//                 socket.emit('join_room', { 
//                     username: getUsername(),  
//                     roomId: roomId.trim() 
//                 });

//                 console.log('Joined room:', roomId);
//                 handleNavigation(`/game_ready?roomName=${encodeURIComponent(roomName.trim())}`); 
//             } catch (error) {
//                 console.error('Error joining room:', error);
//                 alert('加入房间失败，请重试');
//             }
//         } else {
//             alert('请填写房间ID');
//         }
//     };

//     return (
//         <div className="flex justify-center items-center min-h-screen p-4">
//             <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-4xl w-full">
//                 <h1 className="text-3xl font-bold text-center mb-6">创建狼人杀游戏房间</h1>
                
//                 <BasicSetting onRoomNameChange={handleRoomNameChange} />
//                 <GameModeSelection />
//                 <RoleAssignment />
//                 <SelectedSetting />
//                 <AdvancedSetting />
//                 <GameRules />
                
//                 <div className="flex justify-center space-x-4">
//                     <button className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300" onClick={create_room}>
//                         🎮 创建房间
//                     </button>
//                     <button className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300" onClick={() => handleNavigation('/game_lobby')}>
//                         👥 返回大厅
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Page;