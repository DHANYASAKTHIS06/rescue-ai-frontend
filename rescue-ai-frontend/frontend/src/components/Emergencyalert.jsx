import { useEffect, useState } from 'react'

function EmergencyAlert({ gesture, onDismiss }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const directionLabel =
    gesture === 'WAVE_LEFT'  ? '← Left Wave Detected'  :
    gesture === 'WAVE_RIGHT' ? '→ Right Wave Detected' :
    gesture

  return (
    <div className="overlay" onClick={onDismiss}>
      <div className="alert-box" onClick={e => e.stopPropagation()}>

        <div className="alert-icon">🚨</div>

        <h1 className="alert-title">EMERGENCY DETECTED</h1>

        <div className="alert-gesture">{directionLabel}</div>

        <p className="alert-desc">
          An SOS hand wave was detected by the Rescue AI system.
          Please verify the situation immediately.
        </p>

        <div className="alert-elapsed">
          Alert active for <strong>{elapsed}s</strong>
        </div>

        <button className="dismiss-btn" onClick={onDismiss}>
          ✓ Acknowledge &amp; Dismiss
        </button>

        <p className="dismiss-hint">or click anywhere outside to dismiss</p>
      </div>
    </div>
  )
}

export default EmergencyAlert
