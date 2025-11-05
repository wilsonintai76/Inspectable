import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const url = req.nextUrl.clone();
  const { data: { session } } = await supabase.auth.getSession();

  // Gate dashboard routes: must be authenticated and Verified
  if (url.pathname.startsWith("/dashboard")) {
    if (!session?.user) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    const { data: profile } = await supabase
      .from("app_users")
      .select("status")
      .eq("id", session.user.id)
      .single();
    if (!profile || profile.status !== "Verified") {
      url.pathname = "/";
      url.searchParams.set("reason", "not_verified");
      return NextResponse.redirect(url);
    }
  }

  // Optional UX: if logged-in and verified, redirect root "/" to dashboard
  if (url.pathname === "/" && session?.user) {
    const { data: profile } = await supabase
      .from("app_users")
      .select("status")
      .eq("id", session.user.id)
      .single();
    if (profile?.status === "Verified") {
      url.pathname = "/dashboard/overview";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
