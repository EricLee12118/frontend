import { useRoomContext } from '@/contexts/ChatContext';
import RoomsList from './RoomList';
import GameRoom from './GameRoom';

export const RoomContent = () => {
  const { create } = useRoomContext();
  return create ? <GameRoom /> : <RoomsList />;
};