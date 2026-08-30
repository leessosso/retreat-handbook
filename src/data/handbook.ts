export type SessionType = '집회' | '특강' | '새벽'

export type Audience = 'all' | 'stay' | 'commute'

export interface HandbookEvent {
  time: string
  title: string
  audience?: Audience
}

export interface ScheduleDay {
  day: string
  date: string
  events: HandbookEvent[]
}

export interface Session {
  id: string
  type: SessionType
  title: string
  speaker: string
  passage: string
  scriptureText: string
}

export interface SharingQuestion {
  id: string
  text: string
}

export interface RetreatDay {
  dayNumber: number
  date: string
  label: string
  sessions: Session[]
  sharingQuestions: SharingQuestion[]
}

export interface HandbookData {
  title: string
  subtitle: string
  theme: string
  themeVerse: { passage: string; text: string }
  schedule: ScheduleDay[]
  days: RetreatDay[]
}

export const audienceLabel: Record<Audience, string> = {
  all: '전체',
  stay: '숙박',
  commute: '출퇴근',
}

const sessionTypes = new Set<SessionType>(['집회', '특강', '새벽'])
const audiences = new Set<Audience>(['all', 'stay', 'commute'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseHandbook(raw: unknown): HandbookData {
  if (!isRecord(raw)) throw new Error('handbook.json 형식이 올바르지 않습니다.')
  if (typeof raw.title !== 'string' || typeof raw.subtitle !== 'string' || typeof raw.theme !== 'string') {
    throw new Error('title, subtitle, theme을 확인하세요.')
  }
  if (!isRecord(raw.themeVerse) || typeof raw.themeVerse.passage !== 'string' || typeof raw.themeVerse.text !== 'string') {
    throw new Error('themeVerse.passage / text를 확인하세요.')
  }
  if (!Array.isArray(raw.schedule) || !Array.isArray(raw.days) || raw.days.length === 0) {
    throw new Error('schedule과 days 배열을 확인하세요.')
  }

  const data = raw as unknown as HandbookData
  for (const day of data.days) {
    for (const session of day.sessions) {
      if (!sessionTypes.has(session.type)) {
        throw new Error(`session.type은 집회, 특강, 새벽만 가능합니다. (지금: ${session.type})`)
      }
    }
  }
  for (const block of data.schedule) {
    for (const ev of block.events) {
      if (ev.audience && !audiences.has(ev.audience)) {
        throw new Error(`audience는 all, stay, commute만 가능합니다. (지금: ${ev.audience})`)
      }
    }
  }
  return data
}
