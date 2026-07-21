-- Core content model: courses -> modules -> lessons.
-- Multimedia assets (slides/video) hang off a lesson once generated (stage 3).

create type lesson_status as enum ('draft', 'generated', 'edited', 'approved');

create table courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  topic text not null,
  audience text,
  level text,
  language text not null default 'he',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  title text not null,
  summary text,
  position integer not null,
  created_at timestamptz not null default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules (id) on delete cascade,
  title text not null,
  position integer not null,
  status lesson_status not null default 'draft',
  content text,
  exercises jsonb,
  quiz jsonb,
  slides_url text,
  video_script text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index modules_course_id_idx on modules (course_id);
create index lessons_module_id_idx on lessons (module_id);

alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;

create policy "Owners manage their courses"
  on courses for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners manage modules of their courses"
  on modules for all
  using (exists (
    select 1 from courses
    where courses.id = modules.course_id
    and courses.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from courses
    where courses.id = modules.course_id
    and courses.owner_id = auth.uid()
  ));

create policy "Owners manage lessons of their courses"
  on lessons for all
  using (exists (
    select 1 from modules
    join courses on courses.id = modules.course_id
    where modules.id = lessons.module_id
    and courses.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from modules
    join courses on courses.id = modules.course_id
    where modules.id = lessons.module_id
    and courses.owner_id = auth.uid()
  ));
