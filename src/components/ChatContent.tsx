import { useChatContext } from '@/contexts/ChatContext';
import RoomsList from './RoomList';
import ChatRoom from './ChatRoom';

export const ChatContent = () => {
  const { create } = useChatContext();
  return create ? <ChatRoom /> : <RoomsList />;
};