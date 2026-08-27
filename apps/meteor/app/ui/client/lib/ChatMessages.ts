import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.headers.get("authorization");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Add a CSS class to the profile card to prevent it from moving when scrolling
  const response = await NextResponse.next();
  const html = await response.clone().text();
  const updatedHtml = html.replace(/<div class="profile-card">/, '<div class="profile-card fixed-position">');
  response.headers.set("Content-Type", "text/html");
  response.body = updatedHtml;
  return response;
}