'use client';

import { useUser } from '@clerk/nextjs';
import { ChatProvider } from '@/contexts/ChatContext';
import { RoomContent } from '@/components/ChatContent';
import Navbar from '@/components/Navbar';

export default function ChatTestPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <Navbar />
      <ChatProvider>
          <RoomContent />
      </ChatProvider>
    </div>
  );
}