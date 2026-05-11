-- ============================================================
-- Early Birds Golf Club - Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type access_level_enum as enum ('admin', 'rundown', 'member');
create type scoring_format_enum as enum ('stableford', 'gross', 'net', 'par');
create type recipient_type_enum as enum ('all', 'specific');
create type document_access_enum as enum ('all', 'rundown', 'admin');

-- ============================================================
-- MEMBERS
-- ============================================================

create table public.members (
  id                uuid primary key references auth.users(id) on delete cascade,
  member_number     varchar(6)        not null unique,
  login_name        varchar(50)       not null unique,
  first_name        varchar(100)      not null,
  last_name         varchar(100)      not null,
  email             varchar(255)      not null unique,
  phone             varchar(20),
  mobile            varchar(20),
  access_level      access_level_enum not null default 'member',
  is_active         boolean           not null default true,
  games_played      int               not null default 0,
  times_as_booker   int               not null default 0,
  last_booker_date  date,
  first_tee_count   int               not null default 0,
  tenth_tee_count   int               not null default 0,
  created_at        timestamptz       not null default now()
);

-- Sync access_level into app_metadata for JWT-based auth decisions.
-- app_metadata is not user-editable, making it safe for RLS policies.
create or replace function public.sync_member_access_level()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('access_level', new.access_level::text)
  where id = new.id;
  return new;
end;
$$;

create trigger sync_access_level_trigger
  after insert or update of access_level on public.members
  for each row execute function public.sync_member_access_level();

-- ============================================================
-- EVENTS
-- ============================================================

create table public.events (
  id                    uuid primary key default gen_random_uuid(),
  event_date            date              not null,
  course_layout         varchar(100)      not null,
  scoring_format        scoring_format_enum not null default 'stableford',
  group_size            int               not null default 4 check (group_size in (4, 6)),
  start_time            time              not null,
  tee_interval_mins     int               not null default 10,
  registration_closes   date,
  draw_generated_at     timestamptz,
  draw_pdf_url          varchar(500),
  notes                 text,
  created_at            timestamptz       not null default now()
);

-- Auto-set registration_closes to 16 days before event if not provided
create or replace function public.set_registration_closes()
returns trigger
language plpgsql
as $$
begin
  if new.registration_closes is null then
    new.registration_closes := new.event_date - interval '16 days';
  end if;
  return new;
end;
$$;

create trigger set_registration_closes_trigger
  before insert on public.events
  for each row execute function public.set_registration_closes();

-- ============================================================
-- RED BOOK (REGISTRATIONS)
-- ============================================================

create table public.red_book (
  id             uuid        primary key default gen_random_uuid(),
  event_id       uuid        not null references public.events(id) on delete cascade,
  member_id      uuid        not null references public.members(id) on delete cascade,
  registered_at  timestamptz not null default now(),
  unique (event_id, member_id)
);

-- ============================================================
-- DRAW GROUPS
-- ============================================================

create table public.draw_groups (
  id            uuid  primary key default gen_random_uuid(),
  event_id      uuid  not null references public.events(id) on delete cascade,
  group_number  int   not null,
  tee_time      time,
  start_tee     int   check (start_tee in (1, 10)),
  created_at    timestamptz not null default now(),
  unique (event_id, group_number)
);

create table public.draw_group_members (
  id          uuid    primary key default gen_random_uuid(),
  group_id    uuid    not null references public.draw_groups(id) on delete cascade,
  member_id   uuid    not null references public.members(id) on delete cascade,
  is_booker   boolean not null default false,
  unique (group_id, member_id)
);

-- ============================================================
-- PLAYING PARTNERS
-- ============================================================

create table public.playing_partners (
  id          uuid  primary key default gen_random_uuid(),
  member_id   uuid  not null references public.members(id) on delete cascade,
  partner_id  uuid  not null references public.members(id) on delete cascade,
  play_count  int   not null default 1,
  unique (member_id, partner_id),
  -- Canonical ordering ensures each pair is stored once
  check (member_id < partner_id)
);

-- ============================================================
-- RESULTS
-- ============================================================

create table public.results (
  id              uuid      primary key default gen_random_uuid(),
  event_id        uuid      not null references public.events(id) on delete cascade,
  member_id       uuid      not null references public.members(id) on delete cascade,
  score           numeric,
  actually_played boolean   not null default true,
  entered_by      uuid      references public.members(id),
  entered_at      timestamptz not null default now(),
  unique (event_id, member_id)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

create table public.announcements (
  id              uuid               primary key default gen_random_uuid(),
  title           varchar(255)       not null,
  body            text               not null,
  recipient_type  recipient_type_enum not null default 'all',
  sent_at         timestamptz,
  created_by      uuid               references public.members(id),
  created_at      timestamptz        not null default now()
);

create table public.announcement_recipients (
  id               uuid primary key default gen_random_uuid(),
  announcement_id  uuid not null references public.announcements(id) on delete cascade,
  member_id        uuid not null references public.members(id) on delete cascade,
  unique (announcement_id, member_id)
);

-- ============================================================
-- DOCUMENTS
-- ============================================================

create table public.documents (
  id            uuid                 primary key default gen_random_uuid(),
  title         varchar(255)         not null,
  file_url      varchar(500)         not null,
  file_type     varchar(20),
  access_level  document_access_enum not null default 'all',
  uploaded_by   uuid                 references public.members(id),
  uploaded_at   timestamptz          not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.red_book (event_id);
create index on public.red_book (member_id);
create index on public.draw_groups (event_id);
create index on public.draw_group_members (group_id);
create index on public.draw_group_members (member_id);
create index on public.playing_partners (member_id);
create index on public.playing_partners (partner_id);
create index on public.results (event_id);
create index on public.results (member_id);
create index on public.announcements (sent_at);
create index on public.announcement_recipients (announcement_id);
create index on public.documents (access_level);
create index on public.events (event_date);
create index on public.members (member_number);
create index on public.members (login_name);
create index on public.members (is_active);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.members               enable row level security;
alter table public.events                enable row level security;
alter table public.red_book              enable row level security;
alter table public.draw_groups           enable row level security;
alter table public.draw_group_members    enable row level security;
alter table public.playing_partners      enable row level security;
alter table public.results               enable row level security;
alter table public.announcements         enable row level security;
alter table public.announcement_recipients enable row level security;
alter table public.documents             enable row level security;

-- Helper: read access_level from app_metadata (safe — not user-editable)
create or replace function public.current_access_level()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'access_level'),
    'member'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_access_level() = 'admin';
$$;

create or replace function public.is_rundown_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_access_level() in ('admin', 'rundown');
$$;

-- --------------------
-- MEMBERS policies
-- --------------------

create policy "members_read_own" on public.members
  for select using (auth.uid() = id);

create policy "members_read_all_admin" on public.members
  for select using (public.is_admin());

create policy "members_admin_insert" on public.members
  for insert with check (public.is_admin());

create policy "members_admin_update" on public.members
  for update using (public.is_admin());

create policy "members_admin_delete" on public.members
  for delete using (public.is_admin());

create policy "members_update_own" on public.members
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- --------------------
-- EVENTS policies
-- --------------------

create policy "events_read_authenticated" on public.events
  for select using (auth.role() = 'authenticated');

create policy "events_admin_write" on public.events
  for all using (public.is_admin());

-- --------------------
-- RED BOOK policies
-- --------------------

create policy "red_book_read_own" on public.red_book
  for select using (member_id = auth.uid());

create policy "red_book_read_admin_rundown" on public.red_book
  for select using (public.is_rundown_or_admin());

create policy "red_book_insert_own" on public.red_book
  for insert with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.registration_closes >= current_date
    )
  );

create policy "red_book_delete_own" on public.red_book
  for delete using (
    member_id = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.registration_closes >= current_date
    )
  );

create policy "red_book_admin_all" on public.red_book
  for all using (public.is_admin());

-- --------------------
-- DRAW GROUPS policies
-- --------------------

create policy "draw_groups_read_authenticated" on public.draw_groups
  for select using (auth.role() = 'authenticated');

create policy "draw_groups_admin_write" on public.draw_groups
  for all using (public.is_admin());

-- --------------------
-- DRAW GROUP MEMBERS policies
-- --------------------

create policy "draw_group_members_read_authenticated" on public.draw_group_members
  for select using (auth.role() = 'authenticated');

create policy "draw_group_members_admin_write" on public.draw_group_members
  for all using (public.is_admin());

-- --------------------
-- PLAYING PARTNERS policies
-- --------------------

create policy "playing_partners_read_authenticated" on public.playing_partners
  for select using (auth.role() = 'authenticated');

create policy "playing_partners_admin_write" on public.playing_partners
  for all using (public.is_admin());

-- --------------------
-- RESULTS policies
-- --------------------

create policy "results_read_authenticated" on public.results
  for select using (auth.role() = 'authenticated');

create policy "results_write_rundown_admin" on public.results
  for insert with check (public.is_rundown_or_admin());

create policy "results_update_rundown_admin" on public.results
  for update using (public.is_rundown_or_admin());

create policy "results_delete_admin" on public.results
  for delete using (public.is_admin());

-- --------------------
-- ANNOUNCEMENTS policies
-- --------------------

create policy "announcements_read_authenticated" on public.announcements
  for select using (auth.role() = 'authenticated');

create policy "announcements_admin_write" on public.announcements
  for all using (public.is_admin());

-- --------------------
-- ANNOUNCEMENT RECIPIENTS policies
-- --------------------

create policy "announcement_recipients_read_own" on public.announcement_recipients
  for select using (member_id = auth.uid() or public.is_admin());

create policy "announcement_recipients_admin_write" on public.announcement_recipients
  for all using (public.is_admin());

-- --------------------
-- DOCUMENTS policies
-- --------------------

create policy "documents_read_all_level" on public.documents
  for select using (
    auth.role() = 'authenticated'
    and access_level = 'all'
  );

create policy "documents_read_rundown_level" on public.documents
  for select using (
    access_level = 'rundown'
    and public.is_rundown_or_admin()
  );

create policy "documents_read_admin_level" on public.documents
  for select using (
    access_level = 'admin'
    and public.is_admin()
  );

create policy "documents_admin_write" on public.documents
  for all using (public.is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('documents', 'documents', false),
  ('draw-pdfs', 'draw-pdfs', false);

create policy "documents_bucket_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and public.is_admin()
  );

create policy "documents_bucket_read" on storage.objects
  for select using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "documents_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'documents' and public.is_admin());

create policy "draw_pdfs_bucket_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'draw-pdfs'
    and public.is_admin()
  );

create policy "draw_pdfs_bucket_read" on storage.objects
  for select using (bucket_id = 'draw-pdfs' and auth.role() = 'authenticated');

create policy "draw_pdfs_bucket_update" on storage.objects
  for update using (bucket_id = 'draw-pdfs' and public.is_admin());
