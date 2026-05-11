# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

The details for the project are described in the markdown file EarlyBirds.md.

## Supabase

This project uses the Supabase MCP server (available as `mcp__plugin_supabase_supabase__*` tools). Prefer MCP tools for schema inspection, running migrations, and executing SQL rather than the Supabase CLI where possible.

When writing or reviewing SQL, apply the `supabase:supabase-postgres-best-practices` skill.

## Current state

All 11 phases of the portal are implemented and pushed to GitHub (commit 32a6f04). See the session summary in auto-memory for the full route/API inventory, key decisions, and remaining TODOs (Resend email, draw PDF, Vercel deployment, AirTable data migration).

The Next.js app lives in `web/`. The Supabase project ref is `xqnyxhmdvfqdabahvzli` (Tokyo). Link the CLI before running migrations: `supabase link --project-ref xqnyxhmdvfqdabahvzli`.
