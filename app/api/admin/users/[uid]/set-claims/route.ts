import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSupabaseAdmin } from "@/lib/supabase/server";

async function requireAdmin() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data } = await supabase.from("app_users").select("id, role").eq("id", uid).single();
  if (!data) return null;
  const roles: string[] = Array.isArray(data.role) ? (data.role as string[]) : [];
  return roles.includes("Admin") ? { uid } : null;
}

export async function POST(req: NextRequest, { params }: { params: { uid: string } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    const { admin } = body as { admin?: boolean };
    // Update app_users role array
    if (admin === true) {
      // Ensure Admin role present
      const { data } = await supabaseAdmin.from("app_users").select("role").eq("id", params.uid).single();
      const roles = Array.isArray(data?.role) ? (data!.role as string[]) : [];
      if (!roles.includes("Admin")) roles.push("Admin");
      await supabaseAdmin.from("app_users").update({ role: roles }).eq("id", params.uid);
    } else if (admin === false) {
      const { data } = await supabaseAdmin.from("app_users").select("role").eq("id", params.uid).single();
      const roles = Array.isArray(data?.role) ? (data!.role as string[]) : [];
      await supabaseAdmin.from("app_users").update({ role: roles.filter((r) => r !== "Admin") }).eq("id", params.uid);
    }
    // Optionally reflect in user app_metadata
    await supabaseAdmin.auth.admin.updateUserById(params.uid, { app_metadata: { admin: !!admin } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
