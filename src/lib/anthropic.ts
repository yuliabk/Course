import Anthropic from "@anthropic-ai/sdk";
import type { CourseOutline, LessonContent } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-5";

/** Forces structured JSON output by making the model call a single tool. */
async function generateStructured<T>(params: {
  system: string;
  prompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
}): Promise<T> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
    tools: [
      {
        name: params.toolName,
        description: params.toolDescription,
        input_schema: params.inputSchema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: params.toolName },
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return structured output");
  }
  return toolUse.input as T;
}

export async function generateCourseOutline(input: {
  topic: string;
  audience?: string;
  level?: string;
  language: string;
}): Promise<CourseOutline> {
  return generateStructured<CourseOutline>({
    system:
      "You are an instructional designer who builds well-structured course curricula. " +
      "Break topics into logical modules and lessons that build on each other.",
    prompt:
      `Design a course outline.\n` +
      `Topic: ${input.topic}\n` +
      `Audience: ${input.audience ?? "general"}\n` +
      `Level: ${input.level ?? "beginner"}\n` +
      `Language for all titles/summaries: ${input.language}\n` +
      `Produce 3-6 modules, each with 3-6 lessons.`,
    toolName: "record_course_outline",
    toolDescription: "Record the generated course outline",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              lessons: {
                type: "array",
                items: {
                  type: "object",
                  properties: { title: { type: "string" } },
                  required: ["title"],
                },
              },
            },
            required: ["title", "summary", "lessons"],
          },
        },
      },
      required: ["title", "modules"],
    },
  });
}

export async function generateLessonContent(input: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  language: string;
}): Promise<LessonContent> {
  return generateStructured<LessonContent>({
    system:
      "You are an instructional designer who writes clear, engaging lesson content " +
      "with practical exercises and a short quiz to check understanding.",
    prompt:
      `Write the full content for one lesson.\n` +
      `Course: ${input.courseTitle}\n` +
      `Module: ${input.moduleTitle}\n` +
      `Lesson: ${input.lessonTitle}\n` +
      `Language: ${input.language}\n` +
      `Include the lesson body (explanation + examples), 2-4 exercises, and a 3-question quiz.`,
    toolName: "record_lesson_content",
    toolDescription: "Record the generated lesson content",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: { prompt: { type: "string" } },
            required: ["prompt"],
          },
        },
        quiz: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
              correct_index: { type: "number" },
            },
            required: ["question", "options", "correct_index"],
          },
        },
      },
      required: ["content", "exercises", "quiz"],
    },
  });
}

export async function generateVideoScript(input: {
  lessonTitle: string;
  lessonContent: string;
  language: string;
}): Promise<string> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system:
      "You turn lesson content into a spoken video script: natural narration, " +
      "short sentences, with [VISUAL: ...] cues for what should appear on screen.",
    messages: [
      {
        role: "user",
        content:
          `Lesson title: ${input.lessonTitle}\n` +
          `Language: ${input.language}\n\n` +
          `Lesson content:\n${input.lessonContent}\n\n` +
          `Write a 2-4 minute narration script for recording this lesson as a video.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : "";
}
