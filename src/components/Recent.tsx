import type { RecentItem } from '../lib/history'

interface Props {
  items: RecentItem[]
  onUse: (item: RecentItem) => void
  onRemove: (id: string) => void
}

const TYPE_NAME = { url: 'Link', text: 'Text', email: 'Email', phone: 'Phone', wifi: 'Wi-Fi' }

export function Recent({ items, onUse, onRemove }: Props) {
  return (
    <section className="recent" aria-labelledby="recent-h">
      <h2 id="recent-h">Recent codes</h2>
      {items.length === 0
        ? <p className="muted">Codes you download, copy or save land here, and stay after a refresh.</p>
        : (
          <ul>
            {items.map(i => (
              <li key={i.id}>
                <button type="button" className="recent-use" onClick={() => onUse(i)}>
                  <i style={{ background: i.style.gradient ? `linear-gradient(135deg, ${i.style.fg}, ${i.style.fg2})` : i.style.fg, outlineColor: i.style.bg }} aria-hidden />
                  <span><b>{TYPE_NAME[i.type]}</b>{i.label}</span>
                </button>
                <button type="button" className="recent-x" aria-label={`Remove ${i.label}`} onClick={() => onRemove(i.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
    </section>
  )
}
