import { audienceLabel } from '../data/handbook'
import { useHandbook } from '../data/HandbookProvider'

export function SchedulePage() {
  const handbook = useHandbook()
  return (
    <div className="page">
      <h2 className="page-title">전체 일정</h2>
      <p className="theme-verse">
        {handbook.themeVerse.passage} · {handbook.themeVerse.text}
      </p>
      <p className="page-lead">숙박은 새벽까지, 출퇴근은 저녁 나눔 뒤에 돌아가요.</p>
      <ol className="schedule">
        {handbook.schedule.map((block) => (
          <li key={block.day} className="schedule-day">
            <div className="schedule-head">
              <h3>{block.day}</h3>
              <time>{block.date}</time>
            </div>
            <ul className="timeline">
              {block.events.map((ev) => (
                <li key={`${block.day}-${ev.time}-${ev.title}`}>
                  <span className="time">{ev.time}</span>
                  <div>
                    <p className="event-title">{ev.title}</p>
                    {ev.audience ? (
                      <span className="aud">{audienceLabel[ev.audience]}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}
