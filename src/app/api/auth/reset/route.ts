import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  // Clear all auth-related cookies
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.includes("authjs") || cookie.name.includes("next-auth")) {
      cookieStore.delete(cookie.name);
    }
  }
  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));
}
