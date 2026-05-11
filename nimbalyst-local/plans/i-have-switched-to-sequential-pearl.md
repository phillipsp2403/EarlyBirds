# Early Birds Portal — Implementation Plan

## Context

The Early Birds Golf Club runs a weekly golf group (~100 members) that relies on an AirTable + MiniExtensions + CraftMyPDF stack. This is being replaced with a modern web app to reduce subscription costs, gain a proper relational database, and provide a better member experience. The new stack is **Next.js + Supabase**.

The core functions to replicate and improve:
- Member management and portal access
- Event registration (Red Book)
- Draw generation with a fairness algorithm
- Score/results entry
- Statistics derived from draws and results
- Announcements (email to members)
- Document library

---

## Architecture

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router) |
| Backend/DB | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Frontend hosting | Vercel free tier |
| PDF generation | `react-pdf` / `@react-pdf/renderer` in Next.js API route |
| Email | Resend (recommended — to confirm with user) |
| File storage | Supabase Storage |

---

## Authentication

Supabase Auth is used as the underlying auth engine, but with a **custom login flow**:

1. Member enters either their **login name** or **4–6 digit member number**, plus a **4-digit PIN**
2. The app looks up the member's email from the `members` table
3. Authenticates via Supabase Auth using `email + PIN` (PIN treated as password)
4. Admin sets the initial PIN when creating a member account; member can change it after login

Three access levels enforced via Supabase RLS and a `access_level` column:
- `admin` — full CRUD on all tables
- `rundown` — can enter results; same view access as member
- `member` — can register for events, view draws, view documents, update own profile

---

## Database Schema

### `members`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | Supabase Auth user id |
| member_number | varchar(6) | Assigned by golf club, permanent |
| login_name | varchar | Unique, chosen by admin |
| first_name | varchar |  |
| last_name | varchar |  |
| email | varchar |  |
| phone | varchar |  |
| mobile | varchar |  |
| access_level | enum | admin / rundown / member |
| is_active | boolean | Inactive members excluded from draws |
| games_played | int | Derived / cached stat |
| times_as_booker | int | Derived / cached stat |
| last_booker_date | date | For Draw algorithm priority |
| first_tee_count | int | Pines first tee starts (for tee balance) |
| tenth_tee_count | int | Pines tenth tee starts |
| created_at | timestamptz |  |

### `events`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| event_date | date | Wednesday or Saturday |
| course_layout | varchar | e.g., Pines, Hills, etc. |
| scoring_format | enum | stableford / gross / net / par |
| group_size | int | 4 or 6 |
| start_time | time | First tee time |
| tee_interval_mins | int | Minutes between groups |
| registration_closes | date | 16 days before event_date |
| draw_generated_at | timestamptz | Null until draw generated |
| draw_pdf_url | varchar | Supabase Storage URL |
| notes | text |  |
| created_at | timestamptz |  |

### `red_book` (registrations)
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| event_id | uuid (FK events) |  |
| member_id | uuid (FK members) |  |
| registered_at | timestamptz |  |

Unique constraint: `(event_id, member_id)`

### `draw_groups`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| event_id | uuid (FK events) |  |
| group_number | int | 1, 2, 3, … |
| tee_time | time | Calculated from event start + interval |
| start_tee | int | 1 or 10 (Pines only) |
| created_at | timestamptz |  |

### `draw_group_members`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| group_id | uuid (FK draw_groups) |  |
| member_id | uuid (FK members) |  |
| is_booker | boolean | One per group |

### `playing_partners`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| member_id | uuid (FK members) |  |
| partner_id | uuid (FK members) |  |
| play_count | int | Times drawn together |

Unique constraint: `(member_id, partner_id)` — stored once per pair (member_id < partner_id)

### `results`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| event_id | uuid (FK events) |  |
| member_id | uuid (FK members) |  |
| score | numeric | Pre-calculated (Stableford pts, gross, net, par total) |
| actually_played | boolean | May differ from Draw |
| entered_by | uuid (FK members) | RunDown member who entered |
| entered_at | timestamptz |  |

### `announcements`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| title | varchar |  |
| body | text | HTML content |
| recipient_type | enum | all / specific |
| sent_at | timestamptz |  |
| created_by | uuid (FK members) |  |

### `announcement_recipients`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| announcement_id | uuid (FK) |  |
| member_id | uuid (FK members) |  |

### `documents`
| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) |  |
| title | varchar |  |
| file_url | varchar | Supabase Storage URL |
| file_type | varchar | PDF, DOCX, etc. |
| access_level | enum | all / rundown / admin |
| uploaded_by | uuid (FK members) |  |
| uploaded_at | timestamptz |  |

---

## Draw Generation Algorithm

Triggered manually by admin (with option for auto-trigger 16 days before event). Admin can regenerate.

**Inputs:** List of registered members for the event, event group size (4 or 6), event course.

**Constraints:**
- Groups of up to `group_size` players; minimum 3 per group
- Distribute members across groups to avoid groups smaller than 3

**Optimisation priorities (in order):**
1. **Booker fairness:** Select booker for each group by lowest score of:
   `(times_as_booker / games_played)` weighted with recency (`days_since_last_booker`)
2. **Tee balance (Pines only):** Assign groups to start tee (1 or 10) to equalise each member's first_tee_count vs tenth_tee_count across the year
3. **Playing partner diversity:** Minimise the maximum `play_count` between any two members placed in the same group

**Output:**
- `draw_groups` and `draw_group_members` records inserted
- `playing_partners` table updated
- `members` stats updated (booker counts, tee counts)
- PDF generated and stored
- PDF emailed to all registered members (and admins)

---

## Phased Implementation

### Phase 1 — Supabase Foundation
- Create all tables with correct types, constraints, and indexes
- Set up Row Level Security (RLS) policies per access level
- Create Supabase Storage buckets: `documents`, `draw-pdfs`
- Configure Supabase Auth

### Phase 2 — Next.js Project Setup
- Scaffold Next.js app (App Router, TypeScript, Tailwind CSS)
- Configure Supabase client (SSR-compatible)
- Set up environment variables

### Phase 3 — Authentication
- Custom login page (accepts member number or login name + 4-digit PIN)
- Session management via Supabase Auth (SSR cookies)
- PIN change flow for members
- Admin member creation with initial PIN assignment

### Phase 4 — Member Management (Admin)
- Member CRUD (admin only)
- Member list with search/filter
- Access level management

### Phase 5 — Events & Red Book
- Event CRUD (admin)
- Red Book: member registration for events
- Registration window enforcement (closes 16 days before)
- Member view: upcoming events, registration status

### Phase 6 — Draw Generation
- Draw algorithm implementation (TypeScript)
- Admin UI to trigger/regenerate draw
- Draw display page (groups, tee times, bookers)
- PDF generation (react-pdf)
- Email draw PDF to members

### Phase 7 — Results Entry
- Results entry UI (RunDown access)
- Results display per event
- Mark actual players vs drawn players

### Phase 8 — Statistics & Dashboard
- Member statistics page (games played, scoring averages, playing partner history)
- Event history and results summary

### Phase 9 — Announcements
- Admin announcement composer (rich text)
- Send to all / specific members
- Email delivery via Resend

### Phase 10 — Documents
- Admin document upload (Supabase Storage)
- Document library for members (filtered by access level)

### Phase 11 — Data Migration
- Write CSV import scripts (Node.js) for each table from AirTable exports
- Validate data integrity after import
- Migrate playing_partners history from draws history

---

## Data Migration Approach

User will provide CSV exports from AirTable for all tables. Migration will use Node.js scripts that:
1. Parse CSV
2. Map AirTable field names to new schema columns
3. Insert via Supabase service-role client
4. Validate row counts and spot-check key records

Migration order (to respect FK dependencies):
`members` → `events` → `red_book` → `draw_groups` → `draw_group_members` → `playing_partners` → `results` → `announcements` → `documents`

---

## Verification

- **Auth:** Log in as each of the three access levels; verify correct pages/actions are accessible/blocked
- **Registration:** Register a member for an event; confirm it appears in red_book; confirm non-admin cannot see other registrations
- **Draw:** Generate a draw for a test event; verify group constraints (min 3, max 4/6); verify booker assigned; verify PDF generated
- **Algorithm:** Run draw for a synthetic dataset; verify booker fairness scores are respected; verify Pines tee balance; verify playing partner diversity
- **Results:** Enter results as a RunDown member; verify admin can view; verify stats update on member profile
- **Documents:** Upload a document as admin; verify correct access levels can/cannot see it
- **Migration:** After import, spot-check 5 random members, 3 events, and 2 draws against original AirTable data
