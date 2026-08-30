import { Link, Navigate, useParams } from 'react-router-dom'
import { AutoSaveField } from '../components/AutoSaveField'
import { ScriptureAccordion } from '../components/ScriptureAccordion'
import { useHandbook } from '../data/HandbookProvider'
import { useHandbookStore } from '../store/useHandbookStore'

export function DayPage() {
  const handbook = useHandbook()
  const { n } = useParams()
  const dayNumber = Number(n)
  const dayIndex = handbook.days.findIndex((d) => d.dayNumber === dayNumber)
  const day = dayIndex >= 0 ? handbook.days[dayIndex] : undefined
  const schedule = dayIndex >= 0 ? handbook.schedule[dayIndex] : undefined

  const sermons = useHandbookStore((s) => s.sermons)
  const sharing = useHandbookStore((s) => s.sharing)
  const setSermon = useHandbookStore((s) => s.setSermon)
  const setSharing = useHandbookStore((s) => s.setSharing)

  if (!Number.isInteger(dayNumber) || !day) {
    return <Navigate to={`/day/${handbook.days[0].dayNumber}`} replace />
  }

  return (
    <div className="page">
      <div className="day-chips" role="tablist" aria-label="일차">
        {handbook.days.map((d) => (
          <Link
            key={d.dayNumber}
            role="tab"
            aria-selected={d.dayNumber === dayNumber}
            to={`/day/${d.dayNumber}`}
            className={`chip${d.dayNumber === dayNumber ? ' on' : ''}`}
          >
            {d.dayNumber}일
          </Link>
        ))}
      </div>

      <h2 className="page-title">{day.label}</h2>
      <p className="page-lead">{day.date}</p>

      {schedule ? (
        <section className="paper">
          <h3 className="section-label">타임라인</h3>
          <ul className="timeline compact">
            {schedule.events.map((ev) => (
              <li key={`${ev.time}-${ev.title}`}>
                <span className="time">{ev.time}</span>
                <p className="event-title">{ev.title}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {day.sessions.map((session) => (
        <section key={session.id} className="paper session">
          <p className="session-type">{session.type}</p>
          <h3 className="session-title">{session.title}</h3>
          <p className="session-meta">{session.speaker}</p>
          <ScriptureAccordion passage={session.passage} text={session.scriptureText} />
          <label className="field memo">
            <span>설교 요약 · 은혜 메모</span>
            <AutoSaveField
              value={sermons[session.id] ?? ''}
              onSave={(text) => setSermon(session.id, text)}
              placeholder="오늘 마음에 남은 문장..."
              rows={6}
            />
          </label>
        </section>
      ))}

      <section className="paper">
        <h3 className="section-label">조별 나눔</h3>
        {day.sharingQuestions.map((q, i) => (
          <article key={q.id} className="question">
            <p className="q-num">질문 {i + 1}</p>
            <p className="q-text">{q.text}</p>
            <label className="field memo">
              <span>나의 나눔</span>
              <AutoSaveField
                value={sharing[q.id] ?? ''}
                onSave={(text) => setSharing(q.id, text)}
                placeholder="솔직하게, 짧게라도."
                rows={5}
              />
            </label>
          </article>
        ))}
      </section>
    </div>
  )
}
