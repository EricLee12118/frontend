import React from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';

const Navbar: React.FC = () => {
  const { user } = useUser();
  return (
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold">🐺 狼人杀</span>
      </div>
      {
        user ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">👤 {user.username}</span>
            <SignOutButton>
              🚪 登出
            </SignOutButton>
            <button className="text-gray-600 hover:text-gray-800">🔔</button>
            <button className="text-gray-600 hover:text-gray-800">⚙️</button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-gray-800">
              🚪 登录
            </button>
            <button className="text-gray-600 hover:text-gray-800">🔔</button>
            <button className="text-gray-600 hover:text-gray-800">⚙️</button>
          </div>
        )
      }
    </div>
  );
}

export default Navbar;