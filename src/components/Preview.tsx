import { useEffect, useRef } from 'react'
import type QRCodeStyling from 'qr-code-styling'
import { makeQr, qrOptions } from '../lib/qr'
import type { QrStyle } from '../lib/style'

function dprSize(s: QrStyle): QrStyle {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio ?? 1, 3) : 1
  if (dpr <= 1) return s
  return { ...s, size: Math.round(s.size * dpr), margin: Math.round(s.margin * dpr) }
}

interface Props {
  data: string | null
  style: QrStyle
}

// The canvas is rendered at size*devicePixelRatio for sharpness, then the
// host div is constrained to the logical size so CSS scales it back down.
export function Preview({ data, style }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const qr = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!data || !host.current) return
    if (!qr.current) {
      qr.current = makeQr(data, dprSize(style))
      host.current.replaceChildren()
      qr.current.append(host.current)
    } else {
      qr.current.update(qrOptions(data, dprSize(style)))
    }
  }, [data, style])

  useEffect(() => {
    if (!data) qr.current = null
  }, [data])

  return (
    <div className="sticker" style={{ background: style.bg }}>
      <span className="crop tl" /><span className="crop tr" /><span className="crop bl" /><span className="crop br" />
      {data
        ? <div ref={host} className="qr-host" role="img" aria-label={`QR code for ${data}`} data-testid="qr"
            style={{ width: style.size, height: style.size, maxWidth: '100%', maxHeight: '100%' }} />
        : <p className="empty">Fill in the details and your code shows up here.</p>}
    </div>
  )
}
