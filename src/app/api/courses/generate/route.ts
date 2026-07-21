import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCourseOutline } from "@/lib/anthropic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { topic, audience, level, language } = body as {
    topic?: string;
    audience?: string;
    level?: string;
    language?: string;
  };
  if (!topic || !language) {
    return NextResponse.json({ error: "topic and language are required" }, { status: 400 });
  }

  const outline = await generateCourseOutline({ topic, audience, level, language });

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      owner_id: user.id,
      title: outline.title,
      topic,
      audience: audience ?? null,
      level: level ?? null,
      language,
    })
    .select()
    .single();
  if (courseError || !course) {
    return NextResponse.json({ error: courseError?.message ?? "Failed to create course" }, { status: 500 });
  }

  for (const [moduleIndex, mod] of outline.modules.entries()) {
    const { data: moduleRow, error: moduleError } = await supabase
      .from("modules")
      .insert({
        course_id: course.id,
        title: mod.title,
        summary: mod.summary,
        position: moduleIndex,
      })
      .select()
      .single();
    if (moduleError || !moduleRow) {
      return NextResponse.json({ error: moduleError?.message ?? "Failed to create module" }, { status: 500 });
    }

    const lessonRows = mod.lessons.map((lesson, lessonIndex) => ({
      module_id: moduleRow.id,
      title: lesson.title,
      position: lessonIndex,
      status: "draft" as const,
    }));
    const { error: lessonsError } = await supabase.from("lessons").insert(lessonRows);
    if (lessonsError) {
      return NextResponse.json({ error: lessonsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ courseId: course.id });
}
