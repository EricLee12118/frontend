// components/game/GameNotifications.tsx
import React from 'react';
import { GameNotification } from '@/types/chat';

interface GameNotificationsProps {
  notifications: GameNotification[];
  onRemove: (id: string) => void;
}

const GameNotifications: React.FC<GameNotificationsProps> = ({ notifications, onRemove }) => {
  const getNotificationStyles = (type: GameNotification['type']) => {
    switch (type) {
      case 'death':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'elimination':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'phase':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getNotificationIcon = (type: GameNotification['type']) => {
    switch (type) {
      case 'death':
        return '💀';
      case 'elimination':
        return '🗳️';
      case 'success':
        return '🎉';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'phase':
        return '⏰';
      default:
        return 'ℹ️';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        暂无消息
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {notifications.slice(-5).map(notification => (
        <div
          key={notification.id}
          className={`border rounded-lg p-3 ${getNotificationStyles(notification.type)} relative animate-fade-in`}
        >
          <button
            onClick={() => onRemove(notification.id)}
            className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 text-xs"
          >
            ✕
          </button>
          
          <div className="flex items-start gap-2">
            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">{notification.title}</div>
              <div className="text-sm mt-1">{notification.message}</div>
              <div className="text-xs opacity-75 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameNotifications;