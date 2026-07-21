"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [level, setLevel] = useState("");
  const [language, setLanguage] = useState("he");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, level, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה ביצירת הקורס");
      router.push(`/courses/${data.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-6" dir="rtl">
      <h1 className="mb-6 text-2xl font-semibold">קורס חדש</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          נושא הקורס
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded border px-3 py-2"
            placeholder="לדוגמה: יסודות שיווק דיגיטלי"
          />
        </label>
        <label className="flex flex-col gap-1">
          קהל יעד
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="rounded border px-3 py-2"
            placeholder="לדוגמה: בעלי עסקים קטנים"
          />
        </label>
        <label className="flex flex-col gap-1">
          רמה
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded border px-3 py-2">
            <option value="">בחר/י</option>
            <option value="מתחילים">מתחילים</option>
            <option value="בינוני">בינוני</option>
            <option value="מתקדם">מתקדם</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          שפה
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded border px-3 py-2">
            <option value="he">עברית</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {loading ? "יוצר תוכנית לימודים..." : "צור קורס"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </main>
  );
}
