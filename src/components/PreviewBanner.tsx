import { Link } from 'react-router-dom'
import { useHandbookContext } from '../data/HandbookProvider'

export function PreviewBanner() {
  const { isPreview, clearPreview } = useHandbookContext()
  if (!isPreview) return null

  return (
    <div className="preview-banner">
      <p>이 폰에서만 미리보기 중이에요. 참가자 화면은 아직 예전 내용입니다.</p>
      <div className="preview-banner-actions">
        <Link to="/admin">편집으로</Link>
        <button type="button" onClick={clearPreview}>
          미리보기 끄기
        </button>
      </div>
    </div>
  )
}
