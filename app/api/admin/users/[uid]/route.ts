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

export async function DELETE(_req: NextRequest, { params }: { params: { uid: string } }) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(params.uid);
    // Optionally also delete profile
    await supabaseAdmin.from("app_users").delete().eq("id", params.uid);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
