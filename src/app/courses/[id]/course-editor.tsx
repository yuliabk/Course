"use client";

import { useState } from "react";
import type { Course, CourseModule, Lesson } from "@/lib/types";

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "שגיאה");
  return data;
}

export function CourseEditor({ course, modules }: { course: Course; modules: CourseModule[] }) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    modules[0]?.lessons?.[0]?.id ?? null,
  );
  const [lessonsById, setLessonsById] = useState<Record<string, Lesson>>(() => {
    const map: Record<string, Lesson> = {};
    for (const mod of modules) for (const lesson of mod.lessons ?? []) map[lesson.id] = lesson;
    return map;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedLesson = selectedLessonId ? lessonsById[selectedLessonId] : null;

  function updateLesson(id: string, patch: Partial<Lesson>) {
    setLessonsById((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleGenerateContent() {
    if (!selectedLesson) return;
    setBusy(true);
    setError(null);
    try {
      const { content } = await postJson(`/api/lessons/${selectedLesson.id}/generate`);
      updateLesson(selectedLesson.id, {
        content: content.content,
        exercises: content.exercises,
        quiz: content.quiz,
        status: "generated",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!selectedLesson) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${selectedLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: selectedLesson.content, status: "edited" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "שגיאה בשמירה");
      updateLesson(selectedLesson.id, { status: "edited" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  async function handleMultimedia(kind: "script" | "slides" | "video") {
    if (!selectedLesson) return;
    setBusy(true);
    setError(null);
    try {
      const data = await postJson(`/api/lessons/${selectedLesson.id}/multimedia`, { kind });
      if (kind === "script") updateLesson(selectedLesson.id, { video_script: data.video_script });
      if (kind === "slides") updateLesson(selectedLesson.id, { slides_url: data.slides_url });
      if (kind === "video") updateLesson(selectedLesson.id, { video_url: data.video_url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-5xl gap-6 p-6" dir="rtl">
      <aside className="w-64 shrink-0">
        <h1 className="mb-1 text-xl font-semibold">{course.title}</h1>
        <p className="mb-4 text-sm text-gray-500">{course.topic}</p>
        <nav className="flex flex-col gap-3">
          {modules.map((mod) => (
            <div key={mod.id}>
              <div className="text-sm font-medium text-gray-700">{mod.title}</div>
              <ul className="mt-1 flex flex-col gap-1">
                {(mod.lessons ?? []).map((lesson) => {
                  const current = lessonsById[lesson.id];
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => setSelectedLessonId(lesson.id)}
                        className={`w-full rounded px-2 py-1 text-right text-sm ${
                          selectedLessonId === lesson.id ? "bg-black text-white" : "hover:bg-gray-100"
                        }`}
                      >
                        {current.title}
                        <span className="mr-1 text-xs opacity-60"> · {current.status}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <section className="flex-1">
        {!selectedLesson ? (
          <p className="text-gray-500">בחרי שיעור מהרשימה</p>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">{selectedLesson.title}</h2>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleGenerateContent}
                disabled={busy}
                className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                {selectedLesson.content ? "צור מחדש תוכן" : "צור תוכן שיעור"}
              </button>
              <button
                onClick={handleSave}
                disabled={busy || !selectedLesson.content}
                className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                שמור עריכה
              </button>
              <button
                onClick={() => handleMultimedia("script")}
                disabled={busy || !selectedLesson.content}
                className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                צור סקריפט וידאו
              </button>
              <button
                onClick={() => handleMultimedia("slides")}
                disabled={busy || !selectedLesson.content}
                className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                צור מצגת (Gamma)
              </button>
              <button
                onClick={() => handleMultimedia("video")}
                disabled={busy || !selectedLesson.video_script}
                className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                צור וידאו אוטומטי (InVideo)
              </button>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <textarea
              value={selectedLesson.content ?? ""}
              onChange={(e) => updateLesson(selectedLesson.id, { content: e.target.value })}
              placeholder="תוכן השיעור יופיע כאן לאחר יצירה"
              className="min-h-[300px] rounded border p-3 leading-relaxed"
            />

            {selectedLesson.video_script && (
              <div>
                <h3 className="mb-1 font-medium">סקריפט וידאו</h3>
                <pre className="whitespace-pre-wrap rounded border bg-gray-50 p-3 text-sm">
                  {selectedLesson.video_script}
                </pre>
              </div>
            )}

            {selectedLesson.slides_url && (
              <p>
                מצגת:{" "}
                <a className="underline" href={selectedLesson.slides_url} target="_blank" rel="noreferrer">
                  {selectedLesson.slides_url}
                </a>
              </p>
            )}
            {selectedLesson.video_url && (
              <p>
                וידאו:{" "}
                <a className="underline" href={selectedLesson.video_url} target="_blank" rel="noreferrer">
                  {selectedLesson.video_url}
                </a>
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
