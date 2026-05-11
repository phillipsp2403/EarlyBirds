#!/usr/bin/env node
/**
 * AirTable → Supabase migration script
 * Usage: node migrate.js <table|all>
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { fieldMaps, coerceRow } from './fieldMaps.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env from web/.env.local
function loadEnv() {
  const envPath = join(__dirname, '../../web/.env.local')
  if (!existsSync(envPath)) throw new Error('web/.env.local not found')
  const lines = readFileSync(envPath, 'utf8').split('\n')
  const env = {}
  for (const line of lines) {
    const m = line.match(/^([^=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

const TABLES_IN_ORDER = [
  'members',
  'events',
  'red_book',
  'draw_groups',
  'draw_group_members',
  'playing_partners',
  'results',
  'announcements',
  'documents',
]

async function migrateTable(tableName) {
  const csvPath = join(__dirname, 'csv', `${tableName}.csv`)
  if (!existsSync(csvPath)) {
    console.warn(`⚠  Skipping ${tableName}: ${csvPath} not found`)
    return
  }

  const raw = readFileSync(csvPath, 'utf8')
  const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true })
  const fieldMap = fieldMaps[tableName]

  if (!fieldMap) {
    console.warn(`⚠  No field map for ${tableName}`)
    return
  }

  console.log(`\n→ Migrating ${tableName} (${records.length} rows)…`)

  let inserted = 0
  let failed = 0

  // Process in batches of 100
  const batchSize = 100
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    const rows = batch
      .map(record => {
        const mapped = {}
        for (const [airtableKey, supabaseKey] of Object.entries(fieldMap)) {
          if (airtableKey in record) {
            mapped[supabaseKey] = record[airtableKey]
          }
        }
        return coerceRow(tableName, mapped)
      })
      .filter(r => Object.keys(r).length > 0)

    const { data, error } = await supabase.from(tableName).insert(rows)

    if (error) {
      console.error(`  ✗ Batch ${i}–${i + batch.length}: ${error.message}`)
      failed += batch.length
    } else {
      inserted += batch.length
    }
  }

  console.log(`  ✓ ${inserted} inserted, ${failed} failed`)
}

async function main() {
  const arg = process.argv[2]

  if (!arg) {
    console.error('Usage: node migrate.js <table|all>')
    console.error('Tables:', TABLES_IN_ORDER.join(', '))
    process.exit(1)
  }

  if (arg === 'all') {
    for (const table of TABLES_IN_ORDER) {
      await migrateTable(table)
    }
  } else if (TABLES_IN_ORDER.includes(arg)) {
    await migrateTable(arg)
  } else {
    console.error(`Unknown table: ${arg}`)
    console.error('Valid tables:', TABLES_IN_ORDER.join(', '))
    process.exit(1)
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
