import type { CornerShape, DotShape, Ecl, QrStyle } from '../lib/style'
import { presets } from '../lib/style'

interface Props {
  style: QrStyle
  onChange: (patch: Partial<QrStyle>) => void
  onError: (msg: string) => void
}

const ECL: { v: Ecl; label: string }[] = [
  { v: 'L', label: 'Low · 7%' },
  { v: 'M', label: 'Medium · 15%' },
  { v: 'Q', label: 'Quartile · 25%' },
  { v: 'H', label: 'High · 30%' },
]

const DOTS: DotShape[] = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded']
const CORNERS: CornerShape[] = ['square', 'extra-rounded', 'dot']
const MAX_LOGO_BYTES = 300_000

const pretty = (s: string) => s.replace('-', ' ').replace(/^./, c => c.toUpperCase())

export function StylePanel({ style, onChange, onError }: Props) {
  function pickLogo(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) return onError('Pick an image file for the logo.')
    if (file.size > MAX_LOGO_BYTES) return onError('Logo must be under 300 KB.')
    const r = new FileReader()
    r.onerror = () => onError('Could not read that image.')
    r.onload = () => onChange({ logo: r.result as string, ecl: style.ecl === 'L' || style.ecl === 'M' ? 'H' : style.ecl })
    r.readAsDataURL(file)
  }

  return (
    <div className="style">
      <fieldset className="presets">
        <legend>Presets</legend>
        <div className="preset-row">
          {presets.map(p => (
            <button key={p.name} type="button" className="preset" onClick={() => onChange(p.style)}
              style={{ '--a': p.style.fg, '--b': p.style.gradient ? p.style.fg2 : p.style.fg, '--bg': p.style.bg } as React.CSSProperties}>
              <i aria-hidden />{p.name}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid2">
        <label className="field">
          <span>Size <small>{style.size}px</small></span>
          <input type="range" min={120} max={1024} step={8} value={style.size} onChange={e => onChange({ size: +e.target.value })} />
        </label>
        <label className="field">
          <span>Margin <small>{style.margin}px</small></span>
          <input type="range" min={0} max={64} step={2} value={style.margin} onChange={e => onChange({ margin: +e.target.value })} />
        </label>
      </div>

      <div className="grid3">
        <label className="swatch">
          <input type="color" value={style.fg} onChange={e => onChange({ fg: e.target.value })} />
          <span>{style.gradient ? 'Start' : 'Code'}</span>
        </label>
        {style.gradient && (
          <label className="swatch">
            <input type="color" value={style.fg2} onChange={e => onChange({ fg2: e.target.value })} />
            <span>End</span>
          </label>
        )}
        <label className="swatch">
          <input type="color" value={style.bg} onChange={e => onChange({ bg: e.target.value })} />
          <span>Background</span>
        </label>
      </div>
      <label className="check">
        <input type="checkbox" checked={style.gradient} onChange={e => onChange({ gradient: e.target.checked })} />
        Gradient fill
      </label>

      <label className="field">
        <span>Error correction</span>
        <select value={style.ecl} onChange={e => onChange({ ecl: e.target.value as Ecl })}>
          {ECL.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
        <small className="hint">Higher survives scratches and logos, but makes the pattern denser.</small>
      </label>

      <div className="grid2">
        <label className="field">
          <span>Module shape</span>
          <select value={style.dots} onChange={e => onChange({ dots: e.target.value as DotShape })}>
            {DOTS.map(d => <option key={d} value={d}>{pretty(d)}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Corner shape</span>
          <select value={style.corners} onChange={e => onChange({ corners: e.target.value as CornerShape })}>
            {CORNERS.map(d => <option key={d} value={d}>{pretty(d)}</option>)}
          </select>
        </label>
      </div>

      <div className="logo-row">
        <label className="btn ghost">
          {style.logo ? 'Replace logo' : 'Add logo'}
          <input type="file" accept="image/*" hidden onChange={e => { pickLogo(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {style.logo && <button type="button" className="btn ghost" onClick={() => onChange({ logo: null })}>Remove logo</button>}
      </div>
    </div>
  )
}
