function CameraFeed({
  videoRef, canvasRef, annotatedFrame,
  camStarted, camError, onStart, processing
}) {
  return (
    <div className="camera-card">
      <h2>Live Camera</h2>

      {/* Hidden raw video + canvas used for capture — never shown */}
      <video  ref={videoRef}  style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!camStarted && !camError && (
        <div className="cam-start-box">
          <div className="cam-icon">📷</div>
          <p>Click below to start your webcam.<br />Make sure to allow camera permission.</p>
          <button className="start-btn" onClick={onStart}>
            Start Camera
          </button>
        </div>
      )}

      {camError && (
        <div className="cam-error">
          <span>⚠️</span> {camError}
        </div>
      )}

      {camStarted && (
        <div className="cam-feeds">
          {/* Annotated frame returned by backend (with skeleton overlay) */}
          {annotatedFrame ? (
            <div className="feed-wrapper">
              <div className="feed-label">AI View {processing ? '⏳' : '✅'}</div>
              <img src={annotatedFrame} alt="Annotated" className="feed-img" />
            </div>
          ) : (
            <div className="feed-placeholder">
              <span>Waiting for first frame…</span>
            </div>
          )}
        </div>
      )}

      {camStarted && (
        <p className="camera-hint">
          👋 Wave your hand <strong>left or right</strong> to trigger an emergency alert
        </p>
      )}
    </div>
  )
}

export default CameraFeed
