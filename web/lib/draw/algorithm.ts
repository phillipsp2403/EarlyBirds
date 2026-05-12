export interface DrawMember {
  id: string
  first_name: string
  last_name: string
  games_played: number
  times_as_booker: number
  last_booker_date: string | null
  first_tee_count: number
  tenth_tee_count: number
  does_not_book: boolean
}

export interface DrawPartnerHistory {
  member_id: string
  partner_id: string
  play_count: number
}

export interface DrawGroup {
  group_number: number
  tee_time: string
  start_tee: number | null
  members: string[]
  booker: string
}

interface AlgorithmInput {
  members: DrawMember[]
  partnerHistory: DrawPartnerHistory[]
  groupSize: number
  courseName: string // 'Pines' triggers tee balance
  startTime: string // 'HH:MM'
  teeIntervalMins: number
  today: string // YYYY-MM-DD
}

// Score for booker selection — lower is more "due" to book
function bookerScore(m: DrawMember, today: string): number {
  const ratio = m.games_played > 0 ? m.times_as_booker / m.games_played : 0
  const daysSince = m.last_booker_date
    ? (new Date(today).getTime() - new Date(m.last_booker_date).getTime()) / 86400_000
    : 9999
  // Recency bonus: higher days_since lowers the score (more due)
  return ratio - daysSince / 365
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function lookupPlayCount(
  a: string,
  b: string,
  historyMap: Map<string, number>
): number {
  const key = a < b ? `${a}|${b}` : `${b}|${a}`
  return historyMap.get(key) ?? 0
}

function groupPlayDiversity(memberIds: string[], historyMap: Map<string, number>): number {
  let maxCount = 0
  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      maxCount = Math.max(maxCount, lookupPlayCount(memberIds[i], memberIds[j], historyMap))
    }
  }
  return maxCount
}

// Shuffle using Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateDraw(input: AlgorithmInput): DrawGroup[] {
  const { members, partnerHistory, groupSize, courseName, startTime, teeIntervalMins, today } = input

  if (members.length < 3) {
    throw new Error('Need at least 3 members to generate a draw')
  }

  // Build history lookup map
  const historyMap = new Map<string, number>()
  for (const p of partnerHistory) {
    const key = p.member_id < p.partner_id
      ? `${p.member_id}|${p.partner_id}`
      : `${p.partner_id}|${p.member_id}`
    historyMap.set(key, p.play_count)
  }

  // Determine group count ensuring minimum 3 per group
  const n = members.length
  let numGroups = Math.floor(n / groupSize)
  if (numGroups === 0) numGroups = 1

  // Adjust if remainders would create groups < 3
  let remainder = n - numGroups * groupSize
  if (remainder > 0 && remainder < 3) {
    // Absorb remainder into existing groups (up to groupSize + remainder/numGroups)
    numGroups = Math.max(1, Math.floor(n / Math.ceil(n / numGroups)))
  }

  // Members who do not book are never assigned as booker
  const eligibleBookers = members.filter(m => !m.does_not_book)
  const forcedNonBookers = members.filter(m => m.does_not_book).map(m => m.id)

  // Sort eligible bookers by score (ascending = most due first)
  const sorted = [...eligibleBookers].sort((a, b) => bookerScore(a, today) - bookerScore(b, today))

  // Assign bookers — one per group (most due first)
  const bookers = sorted.slice(0, numGroups).map(m => m.id)
  const nonBookers = [...sorted.slice(numGroups).map(m => m.id), ...forcedNonBookers]

  // Distribute non-bookers to minimise playing partner repeats
  // Start with a random shuffle then do a greedy local swap improvement
  let nonBookerShuffled = shuffle(nonBookers)

  // Build initial group buckets (booker + filled non-bookers)
  function buildGroups(ordering: string[]): string[][] {
    const groups: string[][] = Array.from({ length: numGroups }, (_, i) => [bookers[i]])
    let idx = 0
    for (const memberId of ordering) {
      // Find smallest group that hasn't hit its target size
      const targetSize = Math.ceil((n - numGroups) / numGroups)
      const minGroup = groups.reduce((best, g, i) =>
        g.length < groups[best].length ? i : best, 0)
      groups[minGroup].push(memberId)
      idx++
    }
    return groups
  }

  let bestGroups = buildGroups(nonBookerShuffled)
  let bestScore = Math.max(...bestGroups.map(g => groupPlayDiversity(g, historyMap)))

  // Simple improvement: try 200 swaps
  for (let attempt = 0; attempt < 200; attempt++) {
    const i = Math.floor(Math.random() * nonBookerShuffled.length)
    const j = Math.floor(Math.random() * nonBookerShuffled.length)
    if (i === j) continue
    const candidate = [...nonBookerShuffled]
    ;[candidate[i], candidate[j]] = [candidate[j], candidate[i]]
    const candidateGroups = buildGroups(candidate)
    const candidateScore = Math.max(...candidateGroups.map(g => groupPlayDiversity(g, historyMap)))
    if (candidateScore < bestScore) {
      bestScore = candidateScore
      bestGroups = candidateGroups
      nonBookerShuffled = candidate
    }
  }

  const isPines = courseName.toLowerCase().includes('pines')

  // Tee assignment for Pines: balance first_tee_count vs tenth_tee_count
  function assignTees(groups: string[][]): (1 | 10)[] {
    if (!isPines) return groups.map(() => null as unknown as 1 | 10)

    // Count current balance per group: sum(first_tee - tenth_tee) for members
    const groupBalances = groups.map(memberIds => {
      return memberIds.reduce((sum, id) => {
        const m = members.find(x => x.id === id)!
        return sum + (m.first_tee_count - m.tenth_tee_count)
      }, 0)
    })

    // Groups with positive balance (more first tees) should go to tee 10, and vice versa
    const sorted = groupBalances
      .map((b, i) => ({ balance: b, idx: i }))
      .sort((a, b) => b.balance - a.balance)

    const half = Math.floor(groups.length / 2)
    const tees = new Array(groups.length).fill(10)
    for (let i = 0; i < half; i++) {
      tees[sorted[i].idx] = 10
    }
    for (let i = half; i < groups.length; i++) {
      tees[sorted[i].idx] = 1
    }
    return tees
  }

  const tees = assignTees(bestGroups)

  return bestGroups.map((memberIds, i) => ({
    group_number: i + 1,
    tee_time: addMinutes(startTime, i * teeIntervalMins),
    start_tee: tees[i],
    members: memberIds,
    booker: bookers[i],
  }))
}
