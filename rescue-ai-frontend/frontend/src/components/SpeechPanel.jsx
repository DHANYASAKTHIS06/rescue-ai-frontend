function SpeechPanel({ micStarted, transcript }) {
  return (
    <div className="speech-card">
      <h2>Speech Detection</h2>

      <div className={`mic-status ${micStarted ? 'mic-on' : 'mic-off'}`}>
        <span className="mic-dot" />
        {micStarted ? '🎙️ Microphone Active — Listening for hidden keywords' : '🎙️ Microphone not started'}
      </div>

      {micStarted && (
        <div className="transcript-box">
          <p className="transcript-label">Last heard:</p>
          <p className="transcript-text">
            {transcript || '— waiting for speech —'}
          </p>
        </div>
      )}

      {micStarted && (
        <div className="keywords-hint">
          <p>🔒 Hidden keywords are confidential. Speaking any one triggers an emergency alert.</p>
        </div>
      )}
    </div>
  )
}

export default SpeechPanel
