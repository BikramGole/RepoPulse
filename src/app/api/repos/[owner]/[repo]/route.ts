import { NextRequest, NextResponse } from "next/server";
import { fetchRepoInsights } from "@/lib/repoTracker";
import { isValidGitHubLogin, isValidRepoName } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await context.params;

  if (!owner || !repo || !isValidGitHubLogin(owner) || !isValidRepoName(repo.replace(/\.git$/, ""))) {
    return NextResponse.json(
      { error: { code: "INVALID_SLUG", message: "Owner and repository name are invalid." } },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    const data = await fetchRepoInsights(owner, repo, { forceRefresh });
    return NextResponse.json({ data, meta: { owner, repo } }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error: unknown) {
    console.error(`Error fetching insights for ${owner}/${repo}:`, error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Invalid repository") || message.includes("Invalid GitHub")) {
      return NextResponse.json(
        { error: { code: "INVALID_SLUG", message: "Owner and repository name are invalid." } },
        { status: 400 }
      );
    }
    const status = message.includes("not found") ? 404 : 502;
    const publicMessage =
      status === 404
        ? `Repository "${owner}/${repo}" was not found.`
        : "Repository insights are temporarily unavailable.";
    return NextResponse.json(
      { error: { code: status === 404 ? "NOT_FOUND" : "UPSTREAM_ERROR", message: publicMessage } },
      { status }
    );
  }
}
