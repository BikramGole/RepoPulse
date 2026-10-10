import { NextRequest, NextResponse } from "next/server";
import { fetchRepoInsights } from "@/lib/repoTracker";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await context.params;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Owner and repository name are required" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    const data = await fetchRepoInsights(owner, repo, { forceRefresh });
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: any) {
    console.error(`Error fetching insights for ${owner}/${repo}:`, error);
    const status = error.message?.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to fetch repository insights" },
      { status }
    );
  }
}
