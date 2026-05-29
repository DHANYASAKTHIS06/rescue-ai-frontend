function StatusBadge({ gesture, emergency, alertSource, predictedGesture, camStarted, micStarted }) {

  const label =
    !camStarted        ? '⏸ Camera not started' :
    emergency && alertSource === 'speech'
                       ? '⚠️ EMERGENCY — Keyword Detected' :
    emergency          ? `⚠️ EMERGENCY — ${gesture}` :
    gesture === 'IDLE' ? '✅ System Stable — No Gesture' :
                         `🤚 Gesture: ${gesture}`

  const cls = emergency ? 'status-badge emergency' : 'status-badge idle'

  return (
    <div className="status-card">
      <h3>Detection Status</h3>

      <div className={cls}>
        <span className="status-dot" />
        {label}
      </div>

      <div className="info-table">
        <div className="info-row">
          <span>Gesture Detection</span>
          <strong>OpenCV Contour Tracking</strong>
        </div>
        <div className="info-row">
          <span>Speech Detection</span>
          <strong>Google Speech API</strong>
        </div>
        <div className="info-row">
          <span>Gesture Model</span>
          <strong>KNN Regressor</strong>
        </div>
        <div className="info-row">
          <span>Raw Gesture</span>
          <strong>{gesture}</strong>
        </div>
        <div className="info-row">
          <span>Predicted Label</span>
          <strong>{predictedGesture || '—'}</strong>
        </div>
        <div className="info-row">
          <span>Microphone</span>
          <strong style={{ color: micStarted ? '#86efac' : '#f87171' }}>
            {micStarted ? 'Active' : 'Off'}
          </strong>
        </div>
      </div>
    </div>
  )
}

export default StatusBadge
