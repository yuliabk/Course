# Course

AI-powered course creation platform. Give it a topic, audience, and level; it
generates a full curriculum, then lets you generate and edit each lesson's
content, and turn lessons into slides / video scripts / video.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth) for data and per-user ownership (RLS)
- Claude API for curriculum and lesson generation
- Gamma / InVideo for slide decks and video (optional, stage 3)

## Data model

`courses` → `modules` → `lessons`. See `supabase/migrations/0001_init.sql`.

## Getting started

1. Create a Supabase project, run the migration in `supabase/migrations/0001_init.sql`
   (SQL editor or `supabase db push`), and enable email OTP auth.
2. Copy `.env.example` to `.env.local` and fill in the Supabase and Anthropic
   keys. `GAMMA_API_KEY` / `INVIDEO_API_KEY` are optional — those features
   return a clear "not configured" error until set.
3. `npm install`
4. `npm run dev`

## Current scope (MVP)

- Curriculum generation (topic → modules → lessons)
- Lesson content generation (explanation, exercises, quiz) + manual editing
- Per-lesson video script, slide deck (Gamma), and full video (InVideo)

Not yet built: the learner-facing distribution/LMS platform (stage 4).
