import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { LessonStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, status } = body as { content?: string; status?: LessonStatus };

  const { error } = await supabase
    .from("lessons")
    .update({
      ...(content !== undefined ? { content } : {}),
      ...(status !== undefined ? { status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
