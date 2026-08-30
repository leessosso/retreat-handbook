import type { HandbookData } from '../data/handbook'
import type { Profile } from '../store/types'

function line(label: string, value: string) {
  const v = value.trim()
  return v ? `${label}: ${v}` : null
}

export function formatExportText(input: {
  handbook: HandbookData
  profile: Profile
  sermons: Record<string, string>
  sharing: Record<string, string>
}) {
  const { handbook, profile, sermons, sharing } = input
  const blocks: string[] = []

  blocks.push(`${handbook.title} · ${handbook.subtitle}`)
  blocks.push(handbook.theme)
  blocks.push(`${handbook.themeVerse.passage} — ${handbook.themeVerse.text}`)
  blocks.push('')

  blocks.push('[소개]')
  const intro = [
    line('이름', profile.name),
    line('나이', profile.age),
    line('조/소속', profile.group),
    line('MBTI', profile.mbti),
    line('추구미', profile.vibe),
    line('취미', profile.hobby),
    line('요즘 노래', profile.song),
    line('인생 성구', profile.verse),
    line('요즘 은혜', profile.grace),
    line('나를 한 단어로', profile.word),
    profile.strengths.some((s) => s.trim())
      ? `장점: ${profile.strengths.filter((s) => s.trim()).join(' / ')}`
      : null,
    profile.weaknesses.some((s) => s.trim())
      ? `단점: ${profile.weaknesses.filter((s) => s.trim()).join(' / ')}`
      : null,
    line('관심사', profile.tags),
    line('기대', profile.hope),
    line('기도제목', profile.prayer),
  ].filter(Boolean)
  blocks.push(intro.length ? intro.join('\n') : '(아직 작성한 소개가 없습니다)')
  blocks.push('')

  for (const day of handbook.days) {
    blocks.push(`[${day.dayNumber}일차 ${day.label} · ${day.date}]`)
    for (const session of day.sessions) {
      const note = sermons[session.id]?.trim()
      blocks.push(`· ${session.type} ${session.title} (${session.speaker})`)
      blocks.push(note ? note : '  (설교 메모 없음)')
    }
    for (const q of day.sharingQuestions) {
      const answer = sharing[q.id]?.trim()
      blocks.push(`Q. ${q.text}`)
      blocks.push(answer ? answer : '  (나눔 없음)')
    }
    blocks.push('')
  }

  return blocks.join('\n').trim() + '\n'
}
