import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, topic, language")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl p-6" dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">הקורסים שלי</h1>
        <Link href="/courses/new" className="rounded bg-black px-3 py-2 text-white">
          קורס חדש
        </Link>
      </div>

      {!courses || courses.length === 0 ? (
        <p className="text-gray-500">עדיין אין קורסים. צרי/ה את הראשון!</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                href={`/courses/${course.id}`}
                className="block rounded border px-4 py-3 hover:bg-gray-50"
              >
                <div className="font-medium">{course.title}</div>
                <div className="text-sm text-gray-500">{course.topic}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
