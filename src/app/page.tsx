'use client';
import Navbar from '@/components/Navbar';
import { useNavigation } from '@/utils/useNavigation';

export default function Home() {
  const { handleNavigation } = useNavigation();
  
  return (
    <div className="min-h-screen p-6">
      <Navbar />
      <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center">
        <div
          className="p-5 rounded-lg mb-4 hover:bg-gray-100 transition duration-300 cursor-pointer"
          onClick={() => handleNavigation('/game_ready')}
        >
          快速开始
        </div>
        <div
          className="p-5 rounded-lg mb-4 hover:bg-gray-100 transition duration-300 cursor-pointer"
          onClick={() => handleNavigation('/game_lobby')}
        >
          加入房间
        </div>
        <div
          className="p-5 rounded-lg hover:bg-gray-100 transition duration-300 cursor-pointer"
          onClick={() => handleNavigation('/create_room')}
        >
          自定义房间
        </div>
      </div>

      {/* <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-md mt-6">
        <h2 className="text-xl font-semibold mb-4">推荐房间</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className="p-4 border rounded-lg hover:shadow-md transition duration-300 cursor-pointer"
                onClick={() => handleJoinRoom(room.roomId)} 
              >
                <h3 className="text-lg font-semibold mb-2">{room.roomName}</h3>
                <ul className="text-sm text-gray-600">
                  <li>├── 👥 {room.roomId}</li>
                  <li>├── 👤 {room.playerCount}</li>
                  <li>├── {room.RoomOwner}</li>
                  <li>└── {room.roomName}</li>
                </ul>
              </div>
            ))}
          </div>
      </div> */}
    </div>
  );
}