import type {
  Audience,
  HandbookData,
  HandbookEvent,
  RetreatDay,
  ScheduleDay,
  Session,
  SharingQuestion,
} from '../data/handbook'

export const PREVIEW_STORAGE_KEY = 'retreat-handbook-preview'

export function cloneHandbook(data: HandbookData): HandbookData {
  return structuredClone(data)
}

export function downloadHandbook(data: HandbookData) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'handbook.json'
  a.click()
  URL.revokeObjectURL(url)
}

function newDay(n: number, prefix: string): RetreatDay {
  return {
    dayNumber: n,
    date: '',
    label: '',
    sessions: [newSession(n, 1, prefix)],
    sharingQuestions: [
      { id: `${prefix}-d${n}-q1`, text: '' },
      { id: `${prefix}-d${n}-q2`, text: '' },
    ],
  }
}

function newSchedule(n: number): ScheduleDay {
  return {
    day: `${n}일차`,
    date: '',
    events: [{ time: '', title: '', audience: 'all' }],
  }
}

function unusedId(prefix: string, used: Set<string>): string {
  let n = used.size + 1
  let id = `${prefix}${n}`
  while (used.has(id)) {
    n += 1
    id = `${prefix}${n}`
  }
  return id
}

export function newSession(dayNumber: number, index: number, prefix: string): Session {
  return {
    id: `${prefix}-d${dayNumber}-s${index}`,
    type: '집회',
    title: '',
    speaker: '',
    passage: '',
    scriptureText: '',
  }
}

export function setSharedDate(data: HandbookData, di: number, date: string): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) => (i === di ? { ...d, date } : d)),
    schedule: data.schedule.map((s, i) => (i === di ? { ...s, date } : s)),
  }
}

export function setDayLabel(data: HandbookData, di: number, label: string): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) => (i === di ? { ...d, label } : d)),
  }
}

export function setScheduleHeading(data: HandbookData, di: number, day: string): HandbookData {
  return {
    ...data,
    schedule: data.schedule.map((s, i) => (i === di ? { ...s, day } : s)),
  }
}

export function patchEvent(
  data: HandbookData,
  di: number,
  ei: number,
  patch: Partial<HandbookEvent>,
): HandbookData {
  return {
    ...data,
    schedule: data.schedule.map((s, i) => {
      if (i !== di) return s
      return { ...s, events: s.events.map((item, j) => (j === ei ? { ...item, ...patch } : item)) }
    }),
  }
}

export function addEvent(data: HandbookData, di: number): HandbookData {
  return {
    ...data,
    schedule: data.schedule.map((s, i) =>
      i === di ? { ...s, events: [...s.events, { time: '', title: '', audience: 'all' as Audience }] } : s,
    ),
  }
}

export function removeEvent(data: HandbookData, di: number, ei: number): HandbookData {
  return {
    ...data,
    schedule: data.schedule.map((s, i) =>
      i === di ? { ...s, events: s.events.filter((_, j) => j !== ei) } : s,
    ),
  }
}

export function patchSession(
  data: HandbookData,
  di: number,
  si: number,
  patch: Partial<Session>,
): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) => {
      if (i !== di) return d
      return { ...d, sessions: d.sessions.map((item, j) => (j === si ? { ...item, ...patch } : item)) }
    }),
  }
}

export function addSession(data: HandbookData, di: number, prefix: string): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) => {
      if (i !== di) return d
      const used = new Set(d.sessions.map((s) => s.id))
      const id = unusedId(`${prefix}-d${d.dayNumber}-s`, used)
      return { ...d, sessions: [...d.sessions, { ...newSession(d.dayNumber, d.sessions.length + 1, prefix), id }] }
    }),
  }
}

export function removeSession(data: HandbookData, di: number, si: number): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) =>
      i === di ? { ...d, sessions: d.sessions.filter((_, j) => j !== si) } : d,
    ),
  }
}

export function patchQuestion(data: HandbookData, di: number, qi: number, text: string): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) => {
      if (i !== di) return d
      return {
        ...d,
        sharingQuestions: d.sharingQuestions.map((item, j) => (j === qi ? { ...item, text } : item)),
      }
    }),
  }
}

export function addQuestion(data: HandbookData, di: number, prefix: string): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) => {
      if (i !== di) return d
      const used = new Set(d.sharingQuestions.map((q) => q.id))
      const id = unusedId(`${prefix}-d${d.dayNumber}-q`, used)
      const next: SharingQuestion = { id, text: '' }
      return { ...d, sharingQuestions: [...d.sharingQuestions, next] }
    }),
  }
}

export function removeQuestion(data: HandbookData, di: number, qi: number): HandbookData {
  return {
    ...data,
    days: data.days.map((d, i) =>
      i === di ? { ...d, sharingQuestions: d.sharingQuestions.filter((_, j) => j !== qi) } : d,
    ),
  }
}

export function addDay(data: HandbookData, prefix: string): HandbookData {
  const n = data.days.length + 1
  return {
    ...data,
    schedule: [...data.schedule, newSchedule(n)],
    days: [...data.days, newDay(n, prefix)],
  }
}

export function removeDay(data: HandbookData, index: number): HandbookData {
  if (data.days.length <= 1) return data
  return {
    ...data,
    schedule: data.schedule.filter((_, i) => i !== index),
    days: data.days.filter((_, i) => i !== index),
  }
}
