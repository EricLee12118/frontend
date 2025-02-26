// app/api/rooms/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from "next/server";
import { prisma } from  "@/lib/prisma";

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const rooms = await prisma.roomUser.findMany();
        return NextResponse.json(rooms);
    } catch  {
        return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
        );
    }
}
