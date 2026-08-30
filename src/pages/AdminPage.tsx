import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parseHandbook, type Audience, type HandbookData, type SessionType } from '../data/handbook'
import { useHandbookContext } from '../data/HandbookProvider'
import {
  addDay,
  cloneHandbook,
  downloadHandbook,
  newSession,
  removeDay,
} from '../lib/handbookEdit'
import { isRemoteConfigured, saveRemoteHandbook } from '../lib/remoteHandbook'

const SESSION_TYPES: SessionType[] = ['집회', '특강', '새벽']
const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'stay', label: '숙박' },
  { value: 'commute', label: '출퇴근' },
]

const ADMIN_PIN_KEY = 'retreat-admin-pin'

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

  return (
    <div className="page admin-page">
      <h2 className="page-title">내용 수정</h2>
      <p className="page-lead">
        {canPublish
          ? '글을 고친 뒤 미리보기로 확인하고, 맞으면 모든 청년에게 반영을 누르세요. 다른 사람에게 파일을 보낼 필요는 없습니다.'
          : '클라우드 저장이 아직 연결되지 않았습니다. 올해 설정 문서를 먼저 마쳐야 다음 임원이 혼자 반영할 수 있습니다.'}
      </p>

      <section className="paper">
        <h3 className="section-label">기본</h3>
        <label className="field">
          <span>제목</span>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <label className="field">
          <span>부제 (회차)</span>
          <input
            value={draft.subtitle}
            onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          />
        </label>
        <label className="field">
          <span>주제 표어</span>
          <input value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value })} />
        </label>
        <label className="field">
          <span>주제 성구 (장절)</span>
          <input
            value={draft.themeVerse.passage}
            onChange={(e) =>
              setDraft({ ...draft, themeVerse: { ...draft.themeVerse, passage: e.target.value } })
            }
          />
        </label>
        <label className="field">
          <span>주제 성구 (본문)</span>
          <textarea
            rows={4}
            value={draft.themeVerse.text}
            onChange={(e) =>
              setDraft({ ...draft, themeVerse: { ...draft.themeVerse, text: e.target.value } })
            }
          />
        </label>
        <label className="field">
          <span>새로 추가하는 항목의 id 접두어</span>
          <input value={prefix} onChange={(e) => setPrefix(e.target.value.trim() || String(new Date().getFullYear()))} />
        </label>
        <p className="admin-hint">새 해에는 연도(예: 2027)를 넣으면 작년 메모와 안 섞입니다.</p>
      </section>

      {draft.days.map((day, di) => (
        <section key={`${day.dayNumber}-${di}`} className="paper">
          <div className="admin-row">
            <h3 className="section-label">{di + 1}일차</h3>
            {draft.days.length > 1 ? (
              <button type="button" className="btn ghost small" onClick={() => setDraft(removeDay(draft, di))}>
                이 날 삭제
              </button>
            ) : null}
          </div>

          <label className="field">
            <span>일정 탭에 보이는 이름</span>
            <input
              value={draft.schedule[di]?.day ?? ''}
              onChange={(e) => {
                const schedule = draft.schedule.map((s, i) => (i === di ? { ...s, day: e.target.value } : s))
                setDraft({ ...draft, schedule })
              }}
            />
          </label>
          <label className="field">
            <span>날짜 (일정)</span>
            <input
              value={draft.schedule[di]?.date ?? ''}
              onChange={(e) => {
                const schedule = draft.schedule.map((s, i) => (i === di ? { ...s, date: e.target.value } : s))
                setDraft({ ...draft, schedule })
              }}
            />
          </label>
          <label className="field">
            <span>하루 탭 제목</span>
            <input
              value={day.label}
              onChange={(e) => {
                const days = draft.days.map((d, i) => (i === di ? { ...d, label: e.target.value } : d))
                setDraft({ ...draft, days })
              }}
            />
          </label>
          <label className="field">
            <span>하루 탭 날짜</span>
            <input
              value={day.date}
              onChange={(e) => {
                const days = draft.days.map((d, i) => (i === di ? { ...d, date: e.target.value } : d))
                setDraft({ ...draft, days })
              }}
            />
          </label>

          <h4 className="admin-sub">시간표</h4>
          {(draft.schedule[di]?.events ?? []).map((ev, ei) => (
            <div key={ei} className="admin-block">
              <div className="triple">
                <label className="field">
                  <span>시간</span>
                  <input
                    value={ev.time}
                    onChange={(e) => {
                      const schedule = draft.schedule.map((s, i) => {
                        if (i !== di) return s
                        const events = s.events.map((item, j) =>
                          j === ei ? { ...item, time: e.target.value } : item,
                        )
                        return { ...s, events }
                      })
                      setDraft({ ...draft, schedule })
                    }}
                  />
                </label>
                <label className="field">
                  <span>대상</span>
                  <select
                    value={ev.audience ?? 'all'}
                    onChange={(e) => {
                      const audience = e.target.value as Audience
                      const schedule = draft.schedule.map((s, i) => {
                        if (i !== di) return s
                        const events = s.events.map((item, j) =>
                          j === ei ? { ...item, audience } : item,
                        )
                        return { ...s, events }
                      })
                      setDraft({ ...draft, schedule })
                    }}
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
                  onChange={(e) => {
                    const schedule = draft.schedule.map((s, i) => {
                      if (i !== di) return s
                      const events = s.events.map((item, j) =>
                        j === ei ? { ...item, title: e.target.value } : item,
                      )
                      return { ...s, events }
                    })
                    setDraft({ ...draft, schedule })
                  }}
                />
              </label>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  const schedule = draft.schedule.map((s, i) => {
                    if (i !== di) return s
                    return { ...s, events: s.events.filter((_, j) => j !== ei) }
                  })
                  setDraft({ ...draft, schedule })
                }}
              >
                이 줄 삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              const schedule = draft.schedule.map((s, i) =>
                i === di ? { ...s, events: [...s.events, { time: '', title: '', audience: 'all' as const }] } : s,
              )
              setDraft({ ...draft, schedule })
            }}
          >
            시간표 줄 추가
          </button>

          <h4 className="admin-sub">집회 · 특강 · 새벽</h4>
          {day.sessions.map((session, si) => (
            <div key={session.id} className="admin-block">
              <label className="field">
                <span>종류</span>
                <select
                  value={session.type}
                  onChange={(e) => {
                    const type = e.target.value as SessionType
                    const days = draft.days.map((d, i) => {
                      if (i !== di) return d
                      const sessions = d.sessions.map((item, j) =>
                        j === si ? { ...item, type } : item,
                      )
                      return { ...d, sessions }
                    })
                    setDraft({ ...draft, days })
                  }}
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
                  onChange={(e) => patchSession(draft, setDraft, di, si, { title: e.target.value })}
                />
              </label>
              <label className="field">
                <span>강사</span>
                <input
                  value={session.speaker}
                  onChange={(e) => patchSession(draft, setDraft, di, si, { speaker: e.target.value })}
                />
              </label>
              <label className="field">
                <span>성경 장절</span>
                <input
                  value={session.passage}
                  onChange={(e) => patchSession(draft, setDraft, di, si, { passage: e.target.value })}
                />
              </label>
              <label className="field">
                <span>성경 본문</span>
                <textarea
                  rows={6}
                  value={session.scriptureText}
                  onChange={(e) =>
                    patchSession(draft, setDraft, di, si, { scriptureText: e.target.value })
                  }
                />
              </label>
              {day.sessions.length > 1 ? (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    const days = draft.days.map((d, i) =>
                      i === di ? { ...d, sessions: d.sessions.filter((_, j) => j !== si) } : d,
                    )
                    setDraft({ ...draft, days })
                  }}
                >
                  이 세션 삭제
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              const days = draft.days.map((d, i) =>
                i === di
                  ? { ...d, sessions: [...d.sessions, newSession(d.dayNumber, d.sessions.length + 1, prefix)] }
                  : d,
              )
              setDraft({ ...draft, days })
            }}
          >
            세션 추가
          </button>

          <h4 className="admin-sub">나눔 질문</h4>
          {day.sharingQuestions.map((q, qi) => (
            <div key={q.id} className="admin-block">
              <label className="field">
                <span>질문 {qi + 1}</span>
                <textarea
                  rows={3}
                  value={q.text}
                  onChange={(e) => {
                    const days = draft.days.map((d, i) => {
                      if (i !== di) return d
                      const sharingQuestions = d.sharingQuestions.map((item, j) =>
                        j === qi ? { ...item, text: e.target.value } : item,
                      )
                      return { ...d, sharingQuestions }
                    })
                    setDraft({ ...draft, days })
                  }}
                />
              </label>
              {day.sharingQuestions.length > 1 ? (
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    const days = draft.days.map((d, i) =>
                      i === di
                        ? { ...d, sharingQuestions: d.sharingQuestions.filter((_, j) => j !== qi) }
                        : d,
                    )
                    setDraft({ ...draft, days })
                  }}
                >
                  질문 삭제
                </button>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              const days = draft.days.map((d, i) =>
                i === di
                  ? {
                      ...d,
                      sharingQuestions: [
                        ...d.sharingQuestions,
                        { id: `${prefix}-d${d.dayNumber}-q${d.sharingQuestions.length + 1}`, text: '' },
                      ],
                    }
                  : d,
              )
              setDraft({ ...draft, days })
            }}
          >
            질문 추가
          </button>
        </section>
      ))}

      <button type="button" className="btn ghost" onClick={() => setDraft(addDay(draft, prefix))}>
        하루 추가
      </button>

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
      <details className="admin-backup">
        <summary>백업 (보통 안 씁니다)</summary>
        <button type="button" className="btn ghost small" onClick={download}>
          파일로 저장
        </button>
        <button type="button" className="btn ghost small" onClick={() => fileRef.current?.click()}>
          파일에서 불러오기
        </button>
      </details>
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

function patchSession(
  draft: HandbookData,
  setDraft: (next: HandbookData) => void,
  di: number,
  si: number,
  patch: Partial<HandbookData['days'][0]['sessions'][0]>,
) {
  const days = draft.days.map((d, i) => {
    if (i !== di) return d
    const sessions = d.sessions.map((item, j) => (j === si ? { ...item, ...patch } : item))
    return { ...d, sessions }
  })
  setDraft({ ...draft, days })
}
