import { useEffect, useState } from 'react'

function EmergencyAlert({ source, gesture, keyword, onDismiss }) {
  const [elapsed, setElapsed] = useState(0)

  // 1. Tracks running counter seconds
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // 2. Automatically forces system shutdown/dismissal after 4 seconds
  useEffect(() => {
    const autoCloseTimer = setTimeout(() => {
      onDismiss()
    }, 8000) // 4000 milliseconds = 4 seconds

    return () => clearTimeout(autoCloseTimer)
  }, [onDismiss])

  const isSpeech = source === 'speech'
  const title = isSpeech ? 'HIDDEN KEYWORD DETECTED' : 'EMERGENCY DETECTED'
  const icon = isSpeech ? '🎙️' : '🚨'

  const detailLabel = isSpeech
    ? `"${keyword}"`
    : gesture === 'WAVE_LEFT'  ? '← Left Wave Detected'
    : gesture === 'WAVE_RIGHT' ? '→ Right Wave Detected'
    : gesture

  const desc = isSpeech
    ? 'A hidden distress keyword was detected in speech. Please verify the situation immediately.'
    : 'An SOS hand wave was detected by the Rescue AI system. Please verify the situation immediately.'

  return (
    <div className="overlay" onClick={onDismiss}>
      <div className="alert-box" onClick={e => e.stopPropagation()}>

        <div className="alert-icon">{icon}</div>

        <h1 className="alert-title">{title}</h1>

        <div className="alert-gesture">{detailLabel}</div>

        <p className="alert-desc">{desc}</p>

        <div className="alert-elapsed">
          Alert active for <strong>{elapsed}s</strong> (Auto-dismissing shortly...)
        </div>

        <button className="alert-dismiss" onClick={onDismiss}>
          Dismiss Alert
        </button>
      </div>
    </div>
  )
}

export default EmergencyAlert
