import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, roomId } = await request.json();

    if (!userId || !roomId) {
      return NextResponse.json(
        { error: 'userId and roomId are required' },
        { status: 400 }
      );
    }

    const existingRoomUser = await prisma.roomUser.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (existingRoomUser) {
      return NextResponse.json(
        { error: 'User already joined this room' },
        { status: 400 }
      );
    }

    const roomUser = await prisma.roomUser.create({
      data: {
        userId,
        roomId,
      },
    });

    return NextResponse.json(roomUser, { status: 201 });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}