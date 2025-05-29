import React from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';

const Navbar = () => {
  const { user } = useUser();

  return (
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <span className="text-xl font-bold">🐺 狼人杀</span>
      </div>
      {user ? (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {user.imageUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Image
                    src={user.imageUrl}
                    alt={user.username || '用户头像'}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-lg">
                    {(user.username || user.firstName || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">
                {user.username || `${user.firstName} ${user.lastName}` || '用户'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="通知">
              <span className="relative">
                🔔
                <span className="absolute -top-1 -right-1 w-2 h-2"></span>
              </span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="设置">
              ⚙️
            </button>
            <SignOutButton>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="登出">
                🚪
              </button>
            </SignOutButton>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            🚪 登录
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="通知">
            🔔
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="设置">
            ⚙️
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;