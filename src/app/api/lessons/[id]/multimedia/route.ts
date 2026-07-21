import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateVideoScript } from "@/lib/anthropic";
import { generateSlideDeck, generateVideo, IntegrationNotConfiguredError } from "@/lib/multimedia";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const kind = body?.kind as "script" | "slides" | "video";

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, content")
    .eq("id", id)
    .single();
  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  if (!lesson.content) {
    return NextResponse.json({ error: "Generate the lesson content first" }, { status: 400 });
  }

  try {
    if (kind === "script") {
      const script = await generateVideoScript({
        lessonTitle: lesson.title,
        lessonContent: lesson.content,
        language: "he",
      });
      await supabase.from("lessons").update({ video_script: script }).eq("id", id);
      return NextResponse.json({ video_script: script });
    }

    if (kind === "slides") {
      const { url } = await generateSlideDeck({ lessonTitle: lesson.title, lessonContent: lesson.content });
      await supabase.from("lessons").update({ slides_url: url }).eq("id", id);
      return NextResponse.json({ slides_url: url });
    }

    if (kind === "video") {
      if (!lesson.content) {
        return NextResponse.json({ error: "Generate a video script first" }, { status: 400 });
      }
      const { data: lessonWithScript } = await supabase
        .from("lessons")
        .select("video_script")
        .eq("id", id)
        .single();
      if (!lessonWithScript?.video_script) {
        return NextResponse.json({ error: "Generate a video script first" }, { status: 400 });
      }
      const { url } = await generateVideo({ lessonTitle: lesson.title, script: lessonWithScript.video_script });
      await supabase.from("lessons").update({ video_url: url }).eq("id", id);
      return NextResponse.json({ video_url: url });
    }

    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  } catch (error) {
    if (error instanceof IntegrationNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    throw error;
  }
}
