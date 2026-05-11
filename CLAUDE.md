# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

The details for the project are described in the markdown file EarlyBirds.md.

## Supabase

This project uses the Supabase MCP server (available as `mcp__plugin_supabase_supabase__*` tools). Prefer MCP tools for schema inspection, running migrations, and executing SQL rather than the Supabase CLI where possible.

When writing or reviewing SQL, apply the `supabase:supabase-postgres-best-practices` skill.
