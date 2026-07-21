import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLessonContent } from "@/lib/anthropic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, module_id, modules(title, course_id, courses(title, language))")
    .eq("id", id)
    .single();
  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Supabase nested selects type as arrays for FK joins; unwrap defensively.
  const moduleRow = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
  const courseRow = Array.isArray(moduleRow?.courses) ? moduleRow.courses[0] : moduleRow?.courses;

  const content = await generateLessonContent({
    courseTitle: courseRow?.title ?? "",
    moduleTitle: moduleRow?.title ?? "",
    lessonTitle: lesson.title,
    language: courseRow?.language ?? "he",
  });

  const { error: updateError } = await supabase
    .from("lessons")
    .update({
      content: content.content,
      exercises: content.exercises,
      quiz: content.quiz,
      status: "generated",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, content });
}
