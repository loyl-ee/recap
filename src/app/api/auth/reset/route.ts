import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.includes("authjs") || cookie.name.includes("next-auth")) {
      cookieStore.delete(cookie.name);
    }
  }

  // Build redirect URL from the incoming request's host
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  return NextResponse.redirect(new URL("/login", `${proto}://${host}`));
}
