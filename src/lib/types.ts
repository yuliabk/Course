export type LessonStatus = "draft" | "generated" | "edited" | "approved";

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  status: LessonStatus;
  content: string | null;
  exercises: unknown | null;
  quiz: unknown | null;
  slides_url: string | null;
  video_script: string | null;
  video_url: string | null;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  position: number;
  lessons?: Lesson[];
}

export interface Course {
  id: string;
  owner_id: string;
  title: string;
  topic: string;
  audience: string | null;
  level: string | null;
  language: string;
  modules?: CourseModule[];
}

export interface CourseOutline {
  title: string;
  modules: {
    title: string;
    summary: string;
    lessons: { title: string }[];
  }[];
}

export interface LessonContent {
  content: string;
  exercises: { prompt: string }[];
  quiz: { question: string; options: string[]; correct_index: number }[];
}
