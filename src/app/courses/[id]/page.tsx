import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseEditor } from "./course-editor";
import type { CourseModule } from "@/lib/types";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("*, lessons(*)")
    .eq("course_id", id)
    .order("position", { ascending: true });

  const sortedModules: CourseModule[] = (modules ?? []).map((mod) => ({
    ...mod,
    lessons: [...(mod.lessons ?? [])].sort((a, b) => a.position - b.position),
  }));

  return <CourseEditor course={course} modules={sortedModules} />;
}
