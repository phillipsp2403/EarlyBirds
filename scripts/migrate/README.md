# AirTable → Supabase Migration Scripts

## Setup

```bash
cd /Users/paul/earlybirds/scripts/migrate
npm install
```

## Usage

Place AirTable CSV exports in `scripts/migrate/csv/`:

```
csv/
  members.csv
  events.csv
  red_book.csv
  draw_groups.csv
  draw_group_members.csv
  playing_partners.csv
  results.csv
  announcements.csv
  documents.csv
```

Run migrations in order (FK dependencies):

```bash
node migrate.js members
node migrate.js events
node migrate.js red_book
node migrate.js draw_groups
node migrate.js draw_group_members
node migrate.js playing_partners
node migrate.js results
node migrate.js announcements
node migrate.js documents
```

Or run all at once:

```bash
node migrate.js all
```

## Column Mapping

Each table has a `fieldMap` in `fieldMaps.js`. Update these to match your
AirTable export column names if they differ.

## Validation

After each table, the script logs:
- Rows read from CSV
- Rows inserted successfully
- Any rows that failed (with reason)
