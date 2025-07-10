import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Bell, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificaitonProps } from '@/types/chat';

const GameNotifications: React.FC<NotificaitonProps> = ({ messages = [] }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 使用 ref 跟踪之前的消息数量
  const prevMessageCountRef = useRef(messages.length);
  
  // 新消息到达时自动显示通知
  useEffect(() => {
    const currentMessageCount = messages.length;
    
    // 检测到新消息
    if (currentMessageCount > prevMessageCountRef.current) {
      // 有新消息时自动显示通知
      setShowNotification(true);
      setUnreadCount(prev => prev + (currentMessageCount - prevMessageCountRef.current));
      
      // 如果历史面板是打开的，关闭通知（可选）
      if (isHistoryOpen) {
        setShowNotification(false);
      }
    }
    
    // 更新消息计数
    prevMessageCountRef.current = currentMessageCount;
  }, [messages, isHistoryOpen]);
  
  // 自动关闭通知的定时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showNotification && messages.length > 0) {
      timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000); // 5秒后自动关闭
    }
    
    return () => clearTimeout(timer);
  }, [showNotification, messages]);
  
  const openHistoryPanel = () => {
    setIsHistoryOpen(true);
    setUnreadCount(0); 
    setShowNotification(false); 
  };
  
  const closeHistoryPanel = () => {
    setIsHistoryOpen(false);
    
    if (messages.length > prevMessageCountRef.current) {
      setShowNotification(true);
    }
  };

  const getMessageStyle = (isSystem: boolean | undefined) => {
    return isSystem 
      ? 'bg-blue-50 border-blue-200' 
      : 'bg-gray-50 border-gray-200';
  };

  const getMessageIcon = (isSystem: boolean | undefined) => {
    return isSystem ? '🎮' : '💬';
  };

  const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <>
      <div className="relative">
        <motion.div
          className="fixed bottom-4 right-4 z-50"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <button
            onClick={openHistoryPanel}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors relative"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {showNotification && latestMessage && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`fixed bottom-20 right-4 w-80 border rounded-lg p-3 shadow-lg z-40 ${getMessageStyle(
                latestMessage.isSystem
              )}`}
            >
              <button
                onClick={() => setShowNotification(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-start gap-2">
                <span className="text-lg">{getMessageIcon(latestMessage.isSystem)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{latestMessage.sender}</div>
                  <div className="text-sm mt-1">{latestMessage.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(latestMessage.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={isHistoryOpen}
        onClose={closeHistoryPanel}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                消息历史
              </span>
              <button
                onClick={closeHistoryPanel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Title>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {messages && messages.length > 0 ? (
                messages.slice().reverse().map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border rounded-lg p-3 ${getMessageStyle(msg.isSystem)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getMessageIcon(msg.isSystem)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{msg.sender}</div>
                        <div className="text-sm mt-1">{msg.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="mb-2">📭</div>
                  <p>暂无消息</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-500">
              {messages.length} 条消息
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default GameNotifications;