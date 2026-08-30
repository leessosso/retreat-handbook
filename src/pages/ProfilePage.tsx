import { useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useHandbookStore } from '../store/useHandbookStore'
import { emptyProfile, type Profile } from '../store/types'

const QUESTIONS = [
  { name: 'name', label: '이름' },
  { name: 'age', label: '나이' },
  { name: 'group', label: '조 / 소속' },
  { name: 'mbti', label: 'MBTI' },
  { name: 'vibe', label: '추구미' },
  { name: 'hobby', label: '취미' },
  { name: 'song', label: '요즘 듣는 노래' },
  { name: 'verse', label: '인생 성구' },
  { name: 'grace', label: '요즘 은혜 받는 것' },
  { name: 'word', label: '나를 한 단어로' },
] as const

function parseTags(raw: string) {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#+/, '').trim())
    .filter(Boolean)
}

export function ProfilePage() {
  const setProfile = useHandbookStore((s) => s.setProfile)
  const timer = useRef<number | null>(null)
  const hydrated = useRef(false)

  const { register, watch, reset } = useForm<Profile>({
    defaultValues: emptyProfile,
  })

  useEffect(() => {
    const hydrate = () => {
      reset(useHandbookStore.getState().profile)
      hydrated.current = true
    }
    if (useHandbookStore.persist.hasHydrated()) hydrate()
    return useHandbookStore.persist.onFinishHydration(hydrate)
  }, [reset])

  useEffect(() => {
    const sub = watch((value) => {
      if (!hydrated.current) return
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        setProfile({
          name: value.name ?? '',
          age: value.age ?? '',
          group: value.group ?? '',
          mbti: value.mbti ?? '',
          vibe: value.vibe ?? '',
          hobby: value.hobby ?? '',
          song: value.song ?? '',
          verse: value.verse ?? '',
          grace: value.grace ?? '',
          word: value.word ?? '',
          strengths: [
            value.strengths?.[0] ?? '',
            value.strengths?.[1] ?? '',
            value.strengths?.[2] ?? '',
          ],
          weaknesses: [
            value.weaknesses?.[0] ?? '',
            value.weaknesses?.[1] ?? '',
            value.weaknesses?.[2] ?? '',
          ],
          tags: value.tags ?? '',
          hope: value.hope ?? '',
          prayer: value.prayer ?? '',
        })
      }, 300)
    })
    return () => {
      sub.unsubscribe()
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [watch, setProfile])

  const tags = watch('tags')
  const chips = useMemo(() => parseTags(tags ?? ''), [tags])

  return (
    <div className="page">
      <h2 className="page-title">자기소개</h2>
      <p className="page-lead">쓰면 이 폰에만 저장돼요. 로그인은 없어요.</p>

      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <section className="paper">
          <h3 className="section-label">10문 10답</h3>
          <div className="q-grid">
            {QUESTIONS.map((q) => (
              <label key={q.name} className="field">
                <span>{q.label}</span>
                <input type="text" autoComplete="off" {...register(q.name)} />
              </label>
            ))}
          </div>
        </section>

        <section className="paper">
          <h3 className="section-label">장점 Top 3</h3>
          <div className="triple">
            {([0, 1, 2] as const).map((i) => (
              <label key={`s-${i}`} className="field">
                <span>{i + 1}</span>
                <input type="text" {...register(`strengths.${i}`)} />
              </label>
            ))}
          </div>
          <h3 className="section-label spaced">단점 Top 3</h3>
          <div className="triple">
            {([0, 1, 2] as const).map((i) => (
              <label key={`w-${i}`} className="field">
                <span>{i + 1}</span>
                <input type="text" {...register(`weaknesses.${i}`)} />
              </label>
            ))}
          </div>
        </section>

        <section className="paper">
          <label className="field">
            <span>요즘 내 머릿속 관심사</span>
            <input type="text" placeholder="#묵상 #캠핑 #라떼" {...register('tags')} />
          </label>
          {chips.length > 0 ? (
            <ul className="tags">
              {chips.map((t) => (
                <li key={t}>#{t}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="paper">
          <label className="field">
            <span>이번 수련회 기대</span>
            <textarea rows={4} {...register('hope')} />
          </label>
          <label className="field">
            <span>기도제목</span>
            <textarea rows={4} {...register('prayer')} />
          </label>
        </section>
      </form>
    </div>
  )
}
