function CameraFeed({ videoRef, canvasRef, annotatedFrame, camStarted, camError, onStart, processing }) {
  return (
    <div className="camera-card">
      <h2>Live Camera</h2>

      <video  ref={videoRef}  style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!camStarted && !camError && (
        <div className="cam-start-box">
          <div className="cam-icon">📷🎙️</div>
          <p>Click below to start camera and microphone.<br />Both permissions are required.</p>
          <button className="start-btn" onClick={onStart}>
            Start Camera &amp; Mic
          </button>
        </div>
      )}

      {camError && (
        <div className="cam-error">
          <span>⚠️</span> {camError}
        </div>
      )}

      {camStarted && (
        <>
          <div className="cam-feeds">
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
          <p className="camera-hint">
            👋 Wave hand left/right for gesture alert &nbsp;|&nbsp; 🎙️ Speak a hidden keyword for speech alert
          </p>
        </>
      )}
    </div>
  )
}

export default CameraFeed
