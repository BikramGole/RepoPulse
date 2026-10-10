import { NextRequest, NextResponse } from "next/server";
import { fetchUserAudience } from "@/lib/gitcharta/audience";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const data = await fetchUserAudience(username, undefined, forceRefresh);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Audience API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user audience network" },
      { status: 500 }
    );
  }
}
