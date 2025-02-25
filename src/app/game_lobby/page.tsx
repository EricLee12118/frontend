'use client';
import Footer from '@/components/Footer';
import RoomList from '@/components/game_lobby/RoomList';
import RoomSearch from '@/components/game_lobby/RoomSearch';
import RoomType from '@/components/game_lobby/RoomType';
import Navbar from '@/components/Navbar';
import React from 'react';

const Page = () => {
  return (
    <div className="min-h-screen p-6">
      <Navbar />
      <RoomSearch/>
      <RoomList/>
      <RoomType/>
      <Footer/>
    </div>
  );
};

export default Page;