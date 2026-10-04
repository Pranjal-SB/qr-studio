import QRCodeStyling, { type Options } from 'qr-code-styling'
import type { QrStyle } from './style'

export function qrOptions(data: string, s: QrStyle): Options {
  const gradient = s.gradient
    ? { type: 'linear' as const, rotation: Math.PI / 4, colorStops: [{ offset: 0, color: s.fg }, { offset: 1, color: s.fg2 }] }
    : undefined
  return {
    type: 'canvas',
    width: s.size,
    height: s.size,
    margin: s.margin,
    data,
    image: s.logo ?? undefined,
    qrOptions: { errorCorrectionLevel: s.ecl },
    dotsOptions: { type: s.dots, color: s.fg, gradient },
    cornersSquareOptions: { type: s.corners, color: s.fg, gradient },
    cornersDotOptions: { type: s.corners === 'dot' ? 'dot' : 'square', color: s.fg, gradient },
    backgroundOptions: { color: s.bg },
    imageOptions: { margin: 4, imageSize: 0.3, hideBackgroundDots: true, crossOrigin: 'anonymous' },
  }
}

export function makeQr(data: string, s: QrStyle): QRCodeStyling {
  return new QRCodeStyling(qrOptions(data, s))
}

export async function toBlob(data: string, s: QrStyle, ext: 'png' | 'svg'): Promise<Blob> {
  const qr = new QRCodeStyling({ ...qrOptions(data, s), type: ext === 'svg' ? 'svg' : 'canvas' })
  const raw = await qr.getRawData(ext)
  if (!(raw instanceof Blob)) throw new Error('Could not render the code.')
  return raw
}

export function saveBlob(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
