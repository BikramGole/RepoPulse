import { NextRequest, NextResponse } from "next/server";
import { fetchUserAudience } from "@/lib/gitcharta/audience";
import { isValidGitHubLogin } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    if (!isValidGitHubLogin(username)) {
      return NextResponse.json(
        { error: { code: "INVALID_USERNAME", message: "Username is invalid." } },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const data = await fetchUserAudience(username, undefined, forceRefresh);
    return NextResponse.json(
      { data, meta: { username } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Audience API Error:", error);
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "Audience network is temporarily unavailable." } },
      { status: 502 }
    );
  }
}
