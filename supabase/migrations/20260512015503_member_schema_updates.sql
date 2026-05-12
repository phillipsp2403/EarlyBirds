-- Member schema updates
-- - Add status (Active / Lapsed / Associated)
-- - Add committee boolean
-- - Add does_not_book boolean
-- - Rename mobile -> alt_phone
-- - Add joined date (defaults to today)

alter table public.members
  add column status        text    not null default 'Active'
    check (status in ('Active', 'Lapsed', 'Associated')),
  add column committee     boolean not null default false,
  add column does_not_book boolean not null default false,
  add column joined        date    not null default current_date;

alter table public.members
  rename column mobile to alt_phone;
