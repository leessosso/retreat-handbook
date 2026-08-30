import { useHandbook } from '../data/HandbookProvider'

export function HeaderBanner() {
  const handbook = useHandbook()
  return (
    <header className="banner">
      <p className="banner-sub">{handbook.subtitle}</p>
      <h1 className="banner-title">{handbook.title}</h1>
      <p className="banner-theme">{handbook.theme}</p>
    </header>
  )
}
