import { useEffect, useMemo, useState } from 'react'
import { TypeFields } from './components/TypeFields'
import { StylePanel } from './components/StylePanel'
import { Preview } from './components/Preview'
import { Recent } from './components/Recent'
import { buildPayload, emptyFields, summarize, type AnyFields, type QrType } from './lib/payload'
import { defaultStyle, readabilityWarnings, type QrStyle } from './lib/style'
import { addRecent, loadRecent, removeRecent, type RecentItem } from './lib/history'
import { saveBlob, toBlob } from './lib/qr'

const TYPES: { v: QrType; label: string }[] = [
  { v: 'url', label: 'Link' },
  { v: 'text', label: 'Text' },
  { v: 'email', label: 'Email' },
  { v: 'phone', label: 'Phone' },
  { v: 'wifi', label: 'Wi-Fi' },
]

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const t = localStorage.getItem('qr-studio:theme')
    if (t === 'light' || t === 'dark') return t
  } catch { /* ignore */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [type, setType] = useState<QrType>('url')
  const [fields, setFields] = useState<AnyFields>(emptyFields)
  const [style, setStyle] = useState<QrStyle>(defaultStyle)
  const [touched, setTouched] = useState<Record<QrType, boolean>>({ url: false, text: false, email: false, phone: false, wifi: false })
  const [recent, setRecent] = useState<RecentItem[]>(() => loadRecent())
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('qr-studio:theme', theme) } catch { /* ignore */ }
  }, [theme])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(t)
  }, [notice])

  const result = useMemo(() => buildPayload(type, fields[type]), [type, fields])
  const data = result.ok ? result.data : null
  const errors = result.ok ? {} : result.errors
  const warnings = useMemo(() => readabilityWarnings(style), [style])

  function change<K extends QrType>(k: K, patch: Partial<AnyFields[K]>) {
    setFields(f => ({ ...f, [k]: { ...f[k], ...patch } }))
    setTouched(t => (t[k] ? t : { ...t, [k]: true }))
  }

  function remember() {
    if (!data) return
    setRecent(list => addRecent(list, {
      id: crypto.randomUUID(), type, fields: fields[type], style, label: summarize(type, fields[type]), at: Date.now(),
    }))
  }

  function guard(): string | null {
    if (data) return data
    setTouched(t => ({ ...t, [type]: true }))
    setNotice({ kind: 'err', msg: 'Fix the highlighted fields first.' })
    return null
  }

  async function download(ext: 'png' | 'svg') {
    const d = guard()
    if (!d) return
    try {
      saveBlob(await toBlob(d, style, ext), `qr-${type}-${Date.now()}.${ext}`)
      remember()
      setNotice({ kind: 'ok', msg: `Downloaded ${ext.toUpperCase()}.` })
    } catch (e) {
      setNotice({ kind: 'err', msg: e instanceof Error ? e.message : 'Download failed.' })
    }
  }

  async function copy() {
    const d = guard()
    if (!d) return
    try {
      const blob = await toBlob(d, style, 'png')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      remember()
      setNotice({ kind: 'ok', msg: 'Copied image to clipboard.' })
    } catch {
      setNotice({ kind: 'err', msg: 'Your browser blocked clipboard access. Download the PNG instead.' })
    }
  }

  function use(item: RecentItem) {
    setType(item.type)
    setFields(f => ({ ...f, [item.type]: item.fields }))
    setStyle(item.style)
    setTouched(t => ({ ...t, [item.type]: true }))
  }

  return (
    <div className="page">
      <header className="top">
        <h1>QR Studio</h1>
        <button type="button" className="theme" onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <main className="layout">
        <section className="controls" aria-label="Code settings">
          <div className="tabs" role="tablist" aria-label="What the code holds">
            {TYPES.map(t => (
              <button key={t.v} role="tab" type="button" aria-selected={type === t.v} className="tab" onClick={() => setType(t.v)}>
                {t.label}
              </button>
            ))}
          </div>
          <form className="fields" onSubmit={e => { e.preventDefault(); download('png') }} noValidate>
            <TypeFields type={type} fields={fields} errors={errors} touched={touched[type]} onChange={change} />
          </form>

          <details className="design" open>
            <summary>Design</summary>
            <StylePanel style={style} onChange={p => setStyle(s => ({ ...s, ...p }))} onError={msg => setNotice({ kind: 'err', msg })} />
          </details>
        </section>

        <aside className="output" aria-label="Preview and download">
          <Preview data={data} style={style} />

          {data && warnings.length > 0 && (
            <ul className="warnings" aria-live="polite">
              {warnings.map(w => <li key={w}>{w}</li>)}
            </ul>
          )}

          <div className="actions">
            <button type="button" className="btn primary" onClick={() => download('png')} disabled={!data}>Download PNG</button>
            <button type="button" className="btn" onClick={() => download('svg')} disabled={!data}>SVG</button>
            <button type="button" className="btn" onClick={copy} disabled={!data}>Copy</button>
            <button type="button" className="btn ghost" onClick={() => { remember(); setNotice({ kind: 'ok', msg: 'Saved to recent codes.' }) }} disabled={!data}>Save</button>
          </div>

          <Recent items={recent} onUse={use} onRemove={id => setRecent(l => removeRecent(l, id))} />
        </aside>
      </main>

      <div className={`toast ${notice?.kind ?? ''}`} role="status" aria-live="polite">{notice?.msg}</div>
    </div>
  )
}
