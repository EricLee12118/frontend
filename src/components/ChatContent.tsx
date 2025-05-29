import { useRoomContext } from '@/contexts/ChatContext';
import RoomsList from './RoomList';
import ChatRoom from './ChatRoom';

export const RoomContent = () => {
  const { create } = useRoomContext();
  return create ? <ChatRoom /> : <RoomsList />;
};