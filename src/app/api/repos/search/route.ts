import { NextRequest, NextResponse } from "next/server";
import { searchRepositories } from "@/lib/repoTracker";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await searchRepositories(q);
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Repository search error:", error);
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }
}
