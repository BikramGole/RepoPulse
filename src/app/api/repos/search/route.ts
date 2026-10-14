import { NextRequest, NextResponse } from "next/server";
import { searchRepositories } from "@/lib/repoTracker";
import { sanitizeSearchQuery } from "@/lib/validation";

function errorEnvelope(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q") ?? "";
  const q = sanitizeSearchQuery(raw, 100);

  if (!raw.trim()) {
    return NextResponse.json(
      { data: { items: [] }, meta: { query: "" } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  }

  if (!q || q.length < 2) {
    return errorEnvelope("INVALID_QUERY", "Search query must be at least 2 characters.", 400);
  }

  try {
    const items = await searchRepositories(q);
    return NextResponse.json(
      { data: { items }, meta: { query: q, count: items.length } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Repository search error:", error);
    // Do not leak upstream messages (best-practices + data-protection)
    return errorEnvelope("UPSTREAM_ERROR", "Repository search is temporarily unavailable.", 502);
  }
}
