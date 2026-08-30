import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parseHandbook, type Audience, type HandbookData, type SessionType } from '../data/handbook'
import { useHandbookContext } from '../data/HandbookProvider'
import {
  addDay,
  addEvent,
  addQuestion,
  addSession,
  cloneHandbook,
  downloadHandbook,
  patchEvent,
  patchQuestion,
  patchSession,
  removeDay,
  removeEvent,
  removeQuestion,
  removeSession,
  setDayLabel,
  setScheduleHeading,
  setSharedDate,
} from '../lib/handbookEdit'
import { isRemoteConfigured, saveRemoteHandbook } from '../lib/remoteHandbook'

const SESSION_TYPES: SessionType[] = ['집회', '특강', '새벽']
const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'stay', label: '숙박' },
  { value: 'commute', label: '출퇴근' },
]

const ADMIN_PIN_KEY = 'retreat-admin-pin'

type MainTab = 'cover' | 'settings' | number
type DayPane = 'timetable' | 'word' | 'share'

export function AdminPage() {
  const { handbook, applyPreview, markPublished } = useHandbookContext()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const expectedPin = import.meta.env.VITE_ADMIN_PIN ?? ''
  const [unlocked, setUnlocked] = useState(
    () => !expectedPin || sessionStorage.getItem(ADMIN_PIN_KEY) === expectedPin,
  )
  const [pinInput, setPinInput] = useState('')
  const [draft, setDraft] = useState(() => cloneHandbook(handbook))
  const [prefix, setPrefix] = useState(() => String(new Date().getFullYear()))
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<MainTab>('cover')
  const [pane, setPane] = useState<DayPane>('timetable')
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)
  const canPublish = isRemoteConfigured()

  useEffect(() => {
    setDraft(cloneHandbook(handbook))
  }, [handbook])

  function show(text: string) {
    setMessage(text)
  }

  function preview() {
    try {
      applyPreview(parseHandbook(draft))
      show('이 폰에서 미리보기를 켰어요. 아래 탭으로 돌아가 확인해 보세요.')
      navigate('/')
    } catch (err) {
      show(err instanceof Error ? err.message : '내용을 확인하세요.')
    }
  }

  async function publish() {
    try {
      const next = parseHandbook(draft)
      setSaving(true)
      await saveRemoteHandbook(next)
      markPublished(next)
      show('저장했어요. 다른 폰에서 핸드북 주소를 열고 새로고침하면 새 글이 보입니다.')
    } catch (err) {
      show(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function download() {
    try {
      downloadHandbook(parseHandbook(draft))
      show('백업 파일을 저장했어요.')
    } catch (err) {
      show(err instanceof Error ? err.message : '내용을 확인하세요.')
    }
  }

  async function onImport(file: File) {
    try {
      const next = parseHandbook(JSON.parse(await file.text()) as unknown)
      setDraft(next)
      setTab('cover')
      show('파일을 불러왔어요.')
    } catch (err) {
      show(err instanceof Error ? err.message : 'JSON 파일을 읽지 못했어요.')
    }
  }

  if (!unlocked) {
    return (
      <div className="page">
        <h2 className="page-title">임원 확인</h2>
        <p className="page-lead">인수인계에 적힌 숫자를 입력하세요.</p>
        <label className="field">
          <span>비밀번호</span>
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn"
          style={{ marginTop: '0.8rem' }}
          onClick={() => {
            if (pinInput === expectedPin) {
              sessionStorage.setItem(ADMIN_PIN_KEY, expectedPin)
              setUnlocked(true)
            } else {
              show('번호가 다릅니다.')
            }
          }}
        >
          들어가기
        </button>
        {message ? <p className="status">{message}</p> : null}
        <p style={{ marginTop: '1rem' }}>
          <Link to="/">핸드북으로</Link>
        </p>
      </div>
    )
  }

  const dayIndex = typeof tab === 'number' ? tab : null
  const day = dayIndex !== null ? draft.days[dayIndex] : undefined

  return (
    <div className="page admin-page">
      <h2 className="page-title">내용 수정</h2>
      <p className="page-lead">
        {canPublish
          ? '고친 뒤 미리보기로 확인하고, 맞으면 모든 청년에게 반영을 누르세요.'
          : '클라우드 저장이 아직 연결되지 않았습니다. 올해 설정 문서를 먼저 마치세요.'}
      </p>

      <div className="admin-sticky-nav">
        <div className="admin-chips" role="tablist" aria-label="고칠 곳">
          <TabChip selected={tab === 'cover'} onClick={() => setTab('cover')}>
            표지
          </TabChip>
          {draft.days.map((d, i) => (
            <TabChip key={d.dayNumber} selected={tab === i} onClick={() => setTab(i)}>
              {`${d.dayNumber}일`}
            </TabChip>
          ))}
          <TabChip selected={tab === 'settings'} onClick={() => setTab('settings')}>
            설정
          </TabChip>
        </div>
        {day ? (
          <div className="day-chips admin-panes" role="tablist" aria-label="이 날 안에서">
            <TabChip selected={pane === 'timetable'} onClick={() => setPane('timetable')}>
              시간표
            </TabChip>
            <TabChip selected={pane === 'word'} onClick={() => setPane('word')}>
              말씀
            </TabChip>
            <TabChip selected={pane === 'share'} onClick={() => setPane('share')}>
              나눔
            </TabChip>
          </div>
        ) : null}
      </div>

      {tab === 'cover' ? <CoverForm draft={draft} setDraft={setDraft} /> : null}

      {day && dayIndex !== null ? (
        <DayEditor
          draft={draft}
          di={dayIndex}
          pane={pane}
          prefix={prefix}
          openSessionId={openSessionId}
          setDraft={setDraft}
          setOpenSessionId={setOpenSessionId}
        />
      ) : null}

      {tab === 'settings' ? (
        <SettingsForm
          draft={draft}
          prefix={prefix}
          setDraft={setDraft}
          setPrefix={setPrefix}
          setTab={setTab}
          onDownload={download}
          onPickFile={() => fileRef.current?.click()}
        />
      ) : null}

      {message ? <p className="status">{message}</p> : null}

      <div className="admin-actions">
        <button type="button" className="btn ghost" onClick={preview}>
          이 폰에서 미리보기
        </button>
        <button type="button" className="btn" onClick={() => void publish()} disabled={!canPublish || saving}>
          {saving ? '저장 중…' : '모든 청년에게 반영'}
        </button>
        <Link className="btn ghost" to="/">
          핸드북으로
        </Link>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onImport(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function TabChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button type="button" role="tab" aria-selected={selected} className={`chip${selected ? ' on' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

function CoverForm({
  draft,
  setDraft,
}: {
  draft: HandbookData
  setDraft: (next: HandbookData) => void
}) {
  return (
    <section className="paper">
      <h3 className="section-label">배너</h3>
      <label className="field">
        <span>제목</span>
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </label>
      <label className="field">
        <span>부제 (회차)</span>
        <input value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
      </label>
      <label className="field">
        <span>주제 표어</span>
        <input value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value })} />
      </label>
      <h3 className="section-label spaced">일정 탭 상단 성구</h3>
      <label className="field">
        <span>장절</span>
        <input
          value={draft.themeVerse.passage}
          onChange={(e) => setDraft({ ...draft, themeVerse: { ...draft.themeVerse, passage: e.target.value } })}
        />
      </label>
      <label className="field">
        <span>본문</span>
        <textarea
          rows={4}
          value={draft.themeVerse.text}
          onChange={(e) => setDraft({ ...draft, themeVerse: { ...draft.themeVerse, text: e.target.value } })}
        />
      </label>
    </section>
  )
}

function DayEditor({
  draft,
  di,
  pane,
  prefix,
  openSessionId,
  setDraft,
  setOpenSessionId,
}: {
  draft: HandbookData
  di: number
  pane: DayPane
  prefix: string
  openSessionId: string | null
  setDraft: (next: HandbookData) => void
  setOpenSessionId: (id: string | null) => void
}) {
  const day = draft.days[di]
  const schedule = draft.schedule[di]
  const dateValue = day.date || schedule?.date || ''

  return (
    <>
      <section className="paper">
        <h3 className="section-label">이 날</h3>
        <label className="field">
          <span>하루 탭 제목</span>
          <input value={day.label} onChange={(e) => setDraft(setDayLabel(draft, di, e.target.value))} />
        </label>
        <label className="field">
          <span>날짜</span>
          <input value={dateValue} onChange={(e) => setDraft(setSharedDate(draft, di, e.target.value))} />
        </label>
        <p className="admin-hint">하루 탭과 일정 탭에 같이 들어갑니다.</p>
        <label className="field">
          <span>일정 탭 이름</span>
          <input
            value={schedule?.day ?? ''}
            onChange={(e) => setDraft(setScheduleHeading(draft, di, e.target.value))}
          />
        </label>
      </section>

      {pane === 'timetable' ? (
        <section className="paper">
          <h3 className="section-label">시간표</h3>
          {(schedule?.events ?? []).map((ev, ei) => (
            <div key={ei} className="admin-block">
              <div className="admin-pair">
                <label className="field">
                  <span>시간</span>
                  <input
                    value={ev.time}
                    onChange={(e) => setDraft(patchEvent(draft, di, ei, { time: e.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>대상</span>
                  <select
                    value={ev.audience ?? 'all'}
                    onChange={(e) =>
                      setDraft(patchEvent(draft, di, ei, { audience: e.target.value as Audience }))
                    }
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>프로그램</span>
                <input
                  value={ev.title}
                  onChange={(e) => setDraft(patchEvent(draft, di, ei, { title: e.target.value }))}
                />
              </label>
              <button type="button" className="btn ghost small" onClick={() => setDraft(removeEvent(draft, di, ei))}>
                이 줄 삭제
              </button>
            </div>
          ))}
          <button type="button" className="btn ghost small" onClick={() => setDraft(addEvent(draft, di))}>
            시간표 줄 추가
          </button>
        </section>
      ) : null}

      {pane === 'word' ? (
        <section className="paper">
          <h3 className="section-label">집회 · 특강 · 새벽</h3>
          {day.sessions.map((session, si) => {
            const open = openSessionId === session.id
            return (
              <div key={session.id} className="admin-session">
                <button
                  type="button"
                  className="scripture-toggle"
                  aria-expanded={open}
                  onClick={() => setOpenSessionId(open ? null : session.id)}
                >
                  <span>
                    {session.type}
                    {session.title ? ` · ${session.title}` : ' · 제목 없음'}
                  </span>
                  <span className={`chev${open ? ' open' : ''}`} aria-hidden>
                    ⌄
                  </span>
                </button>
                {open ? (
                  <div className="admin-session-body">
                    <label className="field">
                      <span>종류</span>
                      <select
                        value={session.type}
                        onChange={(e) =>
                          setDraft(patchSession(draft, di, si, { type: e.target.value as SessionType }))
                        }
                      >
                        {SESSION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>제목</span>
                      <input
                        value={session.title}
                        onChange={(e) => setDraft(patchSession(draft, di, si, { title: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>강사</span>
                      <input
                        value={session.speaker}
                        onChange={(e) => setDraft(patchSession(draft, di, si, { speaker: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>성경 장절</span>
                      <input
                        value={session.passage}
                        onChange={(e) => setDraft(patchSession(draft, di, si, { passage: e.target.value }))}
                      />
                    </label>
                    <label className="field">
                      <span>성경 본문</span>
                      <textarea
                        rows={8}
                        value={session.scriptureText}
                        onChange={(e) =>
                          setDraft(patchSession(draft, di, si, { scriptureText: e.target.value }))
                        }
                      />
                    </label>
                    {day.sessions.length > 1 ? (
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => {
                          setDraft(removeSession(draft, di, si))
                          if (openSessionId === session.id) setOpenSessionId(null)
                        }}
                      >
                        이 세션 삭제
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              const next = addSession(draft, di, prefix)
              const added = next.days[di].sessions.at(-1)
              setDraft(next)
              if (added) setOpenSessionId(added.id)
            }}
          >
            세션 추가
          </button>
        </section>
      ) : null}

      {pane === 'share' ? (
        <section className="paper">
          <h3 className="section-label">조별 나눔</h3>
          {day.sharingQuestions.map((q, qi) => (
            <div key={q.id} className="admin-block">
              <label className="field">
                <span>질문 {qi + 1}</span>
                <textarea
                  rows={3}
                  value={q.text}
                  onChange={(e) => setDraft(patchQuestion(draft, di, qi, e.target.value))}
                />
              </label>
              {day.sharingQuestions.length > 1 ? (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => setDraft(removeQuestion(draft, di, qi))}
                >
                  질문 삭제
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="btn ghost small"
            onClick={() => setDraft(addQuestion(draft, di, prefix))}
          >
            질문 추가
          </button>
        </section>
      ) : null}
    </>
  )
}

function SettingsForm({
  draft,
  prefix,
  setDraft,
  setPrefix,
  setTab,
  onDownload,
  onPickFile,
}: {
  draft: HandbookData
  prefix: string
  setDraft: (next: HandbookData) => void
  setPrefix: (value: string) => void
  setTab: (tab: MainTab) => void
  onDownload: () => void
  onPickFile: () => void
}) {
  return (
    <>
      <section className="paper">
        <h3 className="section-label">새 항목 id</h3>
        <label className="field">
          <span>접두어</span>
          <input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.trim() || String(new Date().getFullYear()))}
          />
        </label>
        <p className="admin-hint">새 해에는 연도(예: 2027)를 넣으면 작년 메모와 안 섞입니다.</p>
      </section>
      <section className="paper">
        <h3 className="section-label">하루</h3>
        <ul className="admin-day-list">
          {draft.days.map((d, i) => (
            <li key={d.dayNumber}>
              <span>
                {d.dayNumber}일{d.label ? ` · ${d.label}` : ''}
              </span>
              {draft.days.length > 1 ? (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    setDraft(removeDay(draft, i))
                    setTab('cover')
                  }}
                >
                  삭제
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn ghost small"
          onClick={() => {
            const next = addDay(draft, prefix)
            setDraft(next)
            setTab(next.days.length - 1)
          }}
        >
          하루 추가
        </button>
      </section>
      <details className="admin-backup">
        <summary>백업 (보통 안 씁니다)</summary>
        <button type="button" className="btn ghost small" onClick={onDownload}>
          파일로 저장
        </button>
        <button type="button" className="btn ghost small" onClick={onPickFile}>
          파일에서 불러오기
        </button>
      </details>
    </>
  )
}
