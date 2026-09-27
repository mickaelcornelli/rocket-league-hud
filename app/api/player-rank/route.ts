import { NextRequest, NextResponse } from "next/server";
import { getPlayerRankByPrimaryId } from "@/server/player-service";

export async function GET(request: NextRequest) {
    const primaryId = request.nextUrl.searchParams.get("primaryId");
    
    if (!primaryId) {
        return NextResponse.json(
            { error: "Missing primaryId" },
            { status: 400 }
        );
    }

    const data = await getPlayerRankByPrimaryId(primaryId);

    return NextResponse.json({ data });
}