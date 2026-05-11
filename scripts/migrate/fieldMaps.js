// Maps AirTable column names → Supabase column names for each table.
// Update these to match your actual AirTable export headers.

export const fieldMaps = {
  members: {
    // AirTable field : Supabase column
    'Member Number':    'member_number',
    'Login Name':       'login_name',
    'First Name':       'first_name',
    'Last Name':        'last_name',
    'Email':            'email',
    'Phone':            'phone',
    'Mobile':           'mobile',
    'Access Level':     'access_level',    // must be 'admin'|'rundown'|'member'
    'Active':           'is_active',       // '1'/'0' or 'true'/'false'
    'Games Played':     'games_played',
    'Times as Booker':  'times_as_booker',
    'Last Booker Date': 'last_booker_date',
    'First Tee Count':  'first_tee_count',
    'Tenth Tee Count':  'tenth_tee_count',
  },

  events: {
    'Event Date':       'event_date',
    'Course Layout':    'course_layout',
    'Scoring Format':   'scoring_format',  // 'stableford'|'gross'|'net'|'par'
    'Group Size':       'group_size',
    'Start Time':       'start_time',
    'Tee Interval':     'tee_interval_mins',
    'Reg Closes':       'registration_closes',
    'Notes':            'notes',
  },

  red_book: {
    'Event ID':   'event_id',   // UUID from migrated events
    'Member ID':  'member_id',  // UUID from migrated members
    'Registered': 'registered_at',
  },

  draw_groups: {
    'Event ID':      'event_id',
    'Group Number':  'group_number',
    'Tee Time':      'tee_time',
    'Start Tee':     'start_tee',
  },

  draw_group_members: {
    'Group ID':   'group_id',
    'Member ID':  'member_id',
    'Is Booker':  'is_booker',
  },

  playing_partners: {
    'Member ID':  'member_id',
    'Partner ID': 'partner_id',
    'Play Count': 'play_count',
  },

  results: {
    'Event ID':       'event_id',
    'Member ID':      'member_id',
    'Score':          'score',
    'Actually Played':'actually_played',
    'Entered By':     'entered_by',
    'Entered At':     'entered_at',
  },

  announcements: {
    'Title':          'title',
    'Body':           'body',
    'Recipient Type': 'recipient_type',
    'Sent At':        'sent_at',
  },

  documents: {
    'Title':        'title',
    'File URL':     'file_url',
    'File Type':    'file_type',
    'Access Level': 'access_level',
    'Uploaded At':  'uploaded_at',
  },
}

// Coerce types after field mapping
export function coerceRow(table, row) {
  const coerced = { ...row }

  if (table === 'members') {
    if ('is_active' in coerced) {
      coerced.is_active = ['1', 'true', 'yes', 'y'].includes(String(coerced.is_active).toLowerCase())
    }
    for (const field of ['games_played', 'times_as_booker', 'first_tee_count', 'tenth_tee_count']) {
      if (field in coerced && coerced[field] !== '') {
        coerced[field] = parseInt(coerced[field], 10) || 0
      }
    }
    if (!coerced.access_level) coerced.access_level = 'member'
    coerced.access_level = coerced.access_level.toLowerCase()
  }

  if (table === 'events') {
    if ('group_size' in coerced) coerced.group_size = parseInt(coerced.group_size, 10) || 4
    if ('tee_interval_mins' in coerced) coerced.tee_interval_mins = parseInt(coerced.tee_interval_mins, 10) || 10
    if (coerced.scoring_format) coerced.scoring_format = coerced.scoring_format.toLowerCase()
  }

  if (table === 'draw_groups') {
    if ('group_number' in coerced) coerced.group_number = parseInt(coerced.group_number, 10)
    if ('start_tee' in coerced && coerced.start_tee) coerced.start_tee = parseInt(coerced.start_tee, 10)
  }

  if (table === 'draw_group_members') {
    if ('is_booker' in coerced) {
      coerced.is_booker = ['1', 'true', 'yes', 'y'].includes(String(coerced.is_booker).toLowerCase())
    }
  }

  if (table === 'playing_partners') {
    if ('play_count' in coerced) coerced.play_count = parseInt(coerced.play_count, 10) || 1
  }

  if (table === 'results') {
    if ('score' in coerced && coerced.score !== '') coerced.score = parseFloat(coerced.score)
    else coerced.score = null
    if ('actually_played' in coerced) {
      coerced.actually_played = !['0', 'false', 'no', 'n'].includes(String(coerced.actually_played).toLowerCase())
    }
  }

  if (table === 'documents') {
    if (coerced.access_level) coerced.access_level = coerced.access_level.toLowerCase()
  }

  // Remove empty strings for optional fields
  for (const key of Object.keys(coerced)) {
    if (coerced[key] === '') coerced[key] = null
  }

  return coerced
}
