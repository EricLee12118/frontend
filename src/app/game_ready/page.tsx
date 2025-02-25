// 'use client';
// import { useNavigation } from '@/utils/useNavigation';
// import React from 'react';
// import { useSearchParams } from 'next/navigation'; 
// import { SocketManager } from '@/lib/SocketManager';
// import { useState } from 'react';
// import { useUser } from '@clerk/nextjs';

// const Page = () => {
//   const { user, isLoaded } = useUser();
//   const { handleNavigation } = useNavigation();
//   const searchParams = useSearchParams();
//   const [message, setMessage] = useState('');
//   const roomId = searchParams.get('roomName') || '未知房间';
//   const { socket, messages, users, rooms } = useSocket(user, isLoaded);
//   console.log(users, rooms)

//   const getUsername = () => {
//     return user?.username || 
//       [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 
//       user?.id;
//   };
//   const sendMessage = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (message.trim() && socket && roomId.trim()) {
//       socket.emit('send_msg', {
//         roomId: roomId.trim(),
//         message: message.trim(),
//         sender: getUsername(),  
//         userId: user?.id
//       });
//       setMessage('');
//     } else {
//       alert('请填写消息内容');
//     }
//   };

//   return (
//     <div className="min-h-screen p-6">
//       <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center space-x-2">
//             <span className="text-xl font-bold">🐺 房间名称：{roomId}</span>
//             <span className="text-gray-600">🎮 经典模式 · 8人局</span>
//             <span className="text-gray-600">🔒 密码房</span>
//           </div>
//           <div className="flex space-x-4">
//             <button 
//               className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300" 
//               onClick={() => handleNavigation('/game_lobby')}
//             >
//               🏠 返回大厅
//             </button>
//             <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300">
//               ❓ 帮助
//             </button>
//             <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300">
//               📋 AI设置
//             </button>
//           </div>
//         </div>

//       <div className="mb-6">
//         <h2 className="text-xl mb-2">房间列表</h2>
//         <ul className="list-disc pl-4">
//           {rooms.map(room => (
//             <li key={room.roomId}>
//               {room.roomId} ({room.numUsers}人在线)
//             </li>
//           ))}
//         </ul>
//       </div>

//       <div className="mb-6 h-64 overflow-y-auto border p-2">
//         {messages.map((msg, i) => (
//           <div 
//             key={i}
//             className={`mb-2 p-2 rounded ${msg.isPrivate ? 'bg-pink-100' : 'bg-gray-100'}`}
//           >
//             <span className="font-bold">{msg.sender}</span>
//             <span className="text-black text-sm ml-2">
//               {new Date(msg.timestamp).toLocaleTimeString()}
//             </span>
//             <p className="mt-1">{msg.message}</p>
//             {msg.isPrivate && <span className="text-xs text-pink-500">[私信]</span>}
//           </div>
//         ))}
//       </div>
      
//       <form onSubmit={sendMessage} className="mb-6">
//         <input
//           type="text"
//           placeholder="输入消息"
//           value={message}
//           onChange={(e) => {
//             setMessage(e.target.value);
//             if (socket) {
//               socket.emit('typing', { 
//                 roomId: roomId.trim(), 
//                 isTyping: e.target.value.length > 0 
//               });
//             }
//           }}
//           className="w-full p-2 border mb-2"
//           required
//         />
//         <button 
//           type="submit"
//           className="bg-green-500 text-white p-2 rounded w-full"
//         >
//           发送消息
//         </button>
//       </form>
//       </div>
//     </div>
//   );
// };

// export default Page;