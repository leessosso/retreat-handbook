import type { HandbookData, RetreatDay, ScheduleDay, Session } from '../data/handbook'

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
