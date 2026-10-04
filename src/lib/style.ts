export type Ecl = 'L' | 'M' | 'Q' | 'H'
export type DotShape = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'
export type CornerShape = 'square' | 'extra-rounded' | 'dot'

export type QrStyle = {
  size: number
  margin: number
  fg: string
  fg2: string
  gradient: boolean
  bg: string
  ecl: Ecl
  dots: DotShape
  corners: CornerShape
  logo: string | null
}

export const defaultStyle: QrStyle = {
  size: 320,
  margin: 16,
  fg: '#3D3535',
  fg2: '#6B4F3A',
  gradient: false,
  bg: '#FAF8F5',
  ecl: 'M',
  dots: 'square',
  corners: 'square',
  logo: null,
}

export const presets: { name: string; style: Partial<QrStyle> }[] = [
  { name: 'Parchment', style: { fg: '#3D3535', bg: '#FAF8F5', gradient: false, dots: 'square', corners: 'square' } },
  { name: 'Sage', style: { fg: '#2E5B46', fg2: '#6B9E87', bg: '#F0F7F2', gradient: true, dots: 'rounded', corners: 'extra-rounded' } },
  { name: 'Dusk', style: { fg: '#4A3F6B', fg2: '#7B6FA0', bg: '#F5F3FA', gradient: true, dots: 'dots', corners: 'dot' } },
  { name: 'Ember', style: { fg: '#7A3A1E', fg2: '#B06040', bg: '#FDF0E8', gradient: true, dots: 'classy-rounded', corners: 'extra-rounded' } },
  { name: 'Slate', style: { fg: '#2A3A4A', bg: '#F0F3F7', gradient: false, dots: 'extra-rounded', corners: 'extra-rounded' } },
]

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

export const MIN_CONTRAST = 4
export const MIN_SIZE = 160

export function readabilityWarnings(s: QrStyle): string[] {
  const w: string[] = []
  const fgs = s.gradient ? [s.fg, s.fg2] : [s.fg]
  const worst = Math.min(...fgs.map(c => contrast(c, s.bg)))
  if (worst < MIN_CONTRAST)
    w.push(`Low contrast (${worst.toFixed(1)}:1). Many scanners need about 4:1 between code and background.`)
  if (fgs.some(c => luminance(c) > luminance(s.bg)))
    w.push('Light code on a dark background. Some phone cameras cannot read inverted codes.')
  if (s.margin < 8)
    w.push('Very little margin. Scanners need clear space around the code to find it.')
  if (s.size < MIN_SIZE)
    w.push('Small size. Printed codes under about 2 cm are hard to scan.')
  if (s.logo && (s.ecl === 'L' || s.ecl === 'M'))
    w.push('A logo covers part of the code. Use error correction Q or H so it still reads.')
  if (s.dots === 'dots' && s.ecl === 'L')
    w.push('Dot modules with low error correction can fail on older scanners.')
  return w
}
