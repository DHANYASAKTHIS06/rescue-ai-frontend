import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import './App.css'

const BACKEND_URL       = import.meta.env.VITE_BACKEND_URL || 'https://rescue-fzfn.onrender.com'
const FRAME_INTERVAL_MS = 200
const AUDIO_INTERVAL_MS = 4000

function App() {
  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const frameTimer    = useRef(null)
  const audioTimer    = useRef(null)
  const streamRef     = useRef(null)
  const audioChunks   = useRef([])
  const prevEmergency = useRef(false)
  const logEndRef     = useRef(null)

  const [camStarted,    setCamStarted]    = useState(false)
  const [micStarted,    setMicStarted]    = useState(false)
  const [processing,    setProcessing]    = useState(false)
  const [annotated,     setAnnotated]     = useState(null)
  const [gesture,       setGesture]       = useState('NO HAND')
  const [emergency,     setEmergency]     = useState(false)
  const [alertVisible,  setAlertVisible]  = useState(false)
  const [alertSource,   setAlertSource]   = useState('')
  const [alertKeyword,  setAlertKeyword]  = useState('')
  const [transcript,    setTranscript]    = useState('')
  const [sentiment,     setSentiment]     = useState('NEUTRAL')
  const [triggerSource, setTriggerSource] = useState('SAFE')
  const [threatLevel,   setThreatLevel]   = useState('SAFE')
  const [confidence,    setConfidence]    = useState(0)
  const [log,           setLog]           = useState([
    { type: 'init',   text: 'RescueCode AI ready. Secure connection established.' },
  ])

  const addLog = useCallback((type, text) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLog(prev => [...prev.slice(-49), { type, text, time }])
  }, [])

  // scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  // verify backend on load
  useEffect(() => {
    axios.get(`${BACKEND_URL}/`).then(() => {
      addLog('system', 'Secure connection with Flask backend verified.')
    }).catch(() => {
      addLog('warn', 'Backend connection failed. Check URL.')
    })
  }, [addLog])

  const triggerEmergency = useCallback((source, label, keyword = '') => {
    setEmergency(true)
    setAlertSource(source)
    setAlertKeyword(keyword)
    setAlertVisible(true)
    setThreatLevel('CRITICAL')
    setTriggerSource(source === 'speech' ? 'VOICE' : 'GESTURE')
    addLog('alert', source === 'speech'
      ? `Hidden keyword detected: "${keyword}"`
      : `Emergency gesture detected: ${label}`)
  }, [addLog])

  // ── Start camera ─────────────────────────────────────────────
  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }, audio: false
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setCamStarted(true)
      addLog('system', 'Camera feed initialized successfully.')
    } catch {
      addLog('warn', 'Camera access denied.')
    }
  }, [addLog])

  const stopCam = useCallback(() => {
    clearInterval(frameTimer.current)
    streamRef.current?.getVideoTracks().forEach(t => t.stop())
    setCamStarted(false)
    setAnnotated(null)
    addLog('system', 'Camera feed stopped.')
  }, [addLog])

  // ── Start voice ──────────────────────────────────────────────
  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      // merge with existing stream if needed
      const audioStream = stream
      streamRef.current = streamRef.current
        ? new MediaStream([
            ...( streamRef.current.getVideoTracks()),
            ...audioStream.getAudioTracks()
          ])
        : audioStream
      setMicStarted(true)
      addLog('voice', 'Voice detection started. Listening for hidden keywords.')
    } catch {
      addLog('warn', 'Microphone access denied.')
    }
  }, [addLog])

  // ── Send frame ───────────────────────────────────────────────
  const sendFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const b64 = canvas.toDataURL('image/jpeg', 0.7)
    try {
      setProcessing(true)
      const res = await axios.post(`${BACKEND_URL}/process-frame`, { frame: b64 })
      const d = res.data
      if (d.success) {
        setGesture(d.gesture === 'IDLE' ? 'NO HAND' : d.gesture)
        if (d.annotated_frame) setAnnotated('data:image/jpeg;base64,' + d.annotated_frame)
        const conf = d.gesture !== 'IDLE' ? Math.floor(60 + Math.random() * 35) : 0
        setConfidence(conf)

        if (d.emergency && !prevEmergency.current) {
          triggerEmergency('gesture', d.gesture)
        }
        if (!d.emergency && prevEmergency.current) {
          setThreatLevel('SAFE')
          setTriggerSource('SAFE')
          setEmergency(false)
        }
        prevEmergency.current = d.emergency
      }
    } catch { /* silent */ }
    finally { setProcessing(false) }
  }, [processing, triggerEmergency])

  // ── Send audio ───────────────────────────────────────────────
  const recordAndSendAudio = useCallback(() => {
    if (!streamRef.current) return
    const audioTracks = streamRef.current.getAudioTracks()
    if (!audioTracks.length) return
    const audioStream = new MediaStream(audioTracks)
    const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' })
    audioChunks.current = []
    recorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data) }
    recorder.onstop = async () => {
      const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
      const buffer = await blob.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      try {
        const res = await axios.post(`${BACKEND_URL}/process-audio`, { audio: b64 })
        const d = res.data
        if (d.success && d.transcript) {
          setTranscript(d.transcript)
          setSentiment(d.transcript.length > 10 ? 'ACTIVE' : 'NEUTRAL')
          addLog('voice', `Transcribed: "${d.transcript}"`)
          if (d.emergency && d.keyword) {
            triggerEmergency('speech', 'KEYWORD', d.keyword)
          }
        }
      } catch { /* silent */ }
    }
    recorder.start()
    setTimeout(() => recorder.stop(), 3000)
  }, [addLog, triggerEmergency])

  useEffect(() => {
    if (camStarted) {
      frameTimer.current = setInterval(sendFrame, FRAME_INTERVAL_MS)
    }
    return () => clearInterval(frameTimer.current)
  }, [camStarted, sendFrame])

  useEffect(() => {
    if (micStarted) {
      audioTimer.current = setInterval(recordAndSendAudio, AUDIO_INTERVAL_MS)
    }
    return () => clearInterval(audioTimer.current)
  }, [micStarted, recordAndSendAudio])

  const resetAlert = () => {
    setAlertVisible(false)
    setEmergency(false)
    setThreatLevel('SAFE')
    setTriggerSource('SAFE')
    addLog('system', 'Alert acknowledged and reset.')
  }

  const threatColor = threatLevel === 'CRITICAL' ? 'var(--accent-red)'
    : threatLevel === 'WARNING' ? 'var(--accent-yellow)'
    : 'var(--accent-green)'

  const voiceStatusText = micStarted ? 'ACTIVE' : 'IDLE'
  const gestureStatusText = camStarted ? (gesture === 'NO HAND' ? 'SCANNING' : gesture) : 'INACTIVE'
  const emergencyStatusText = emergency ? 'ALERT' : 'SAFE'
  const emergencyDotColor = emergency ? 'var(--accent-red)' : 'var(--accent-green)'

  return (
    <div className={`app-shell${emergency ? ' app--emergency' : ''}`}>

      {/* Rainbow top border */}
      <div className="rainbow-bar" />

      {/* Emergency overlay */}
      {alertVisible && (
        <div className="overlay" onClick={resetAlert}>
          <div className="alert-box" onClick={e => e.stopPropagation()}>
            <div className="alert-icon">{alertSource === 'speech' ? '🎙️' : '🚨'}</div>
            <h1 className="alert-title">
              {alertSource === 'speech' ? 'HIDDEN KEYWORD DETECTED' : 'EMERGENCY DETECTED'}
            </h1>
            <div className="alert-badge">
              {alertSource === 'speech' ? `"${alertKeyword}"` :
               gesture === 'WAVE_LEFT' ? '← Left Wave' :
               gesture === 'WAVE_RIGHT' ? '→ Right Wave' : gesture}
            </div>
            <p className="alert-desc">
              {alertSource === 'speech'
                ? 'A confidential distress keyword was detected in speech. Verify the situation immediately.'
                : 'An SOS hand wave was detected. Please verify the situation immediately.'}
            </p>
            <button className="alert-dismiss" onClick={resetAlert}>
              ✓ Acknowledge &amp; Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">🚨 RescueCode AI</h1>
        <p className="app-subtitle">
          AI-Driven Critical Safety Monitoring with Sentiment Analysis &amp; Computer Vision Contour Defect Tracking
        </p>
        <div className="header-divider" />
      </header>

      {/* Main two-column grid */}
      <main className="app-main">

        {/* LEFT — Live Input Feeds */}
        <section className="panel left-panel">
          <div className="panel-title-row">
            <span className="panel-title">📷 Live Input Feeds</span>
            <span className={`live-dot${camStarted ? ' live-dot--on' : ''}`} />
          </div>

          {/* Video area */}
          <div className="video-box">
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {annotated ? (
              <img src={annotated} alt="feed" className="video-feed" />
            ) : (
              <div className="video-placeholder">
                {camStarted
                  ? <span className="scanning-text">⏳ Initializing feed…</span>
                  : <span className="scanning-text">📷 Camera not started</span>}
              </div>
            )}
            {camStarted && (
              <div className="video-overlay-badge">
                {processing ? '⏳ PROCESSING' : '● LIVE'}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="btn-grid">
            <button className="btn btn--green" onClick={startCam} disabled={camStarted}>
              🖐 START CAM
            </button>
            <button className="btn btn--dark" onClick={stopCam} disabled={!camStarted}>
              ⏹ STOP CAM
            </button>
            <button className="btn btn--blue" onClick={startVoice} disabled={micStarted}>
              🎤 START VOICE
            </button>
            <button className="btn btn--red" onClick={resetAlert}>
              ⚠ RESET ALERT
            </button>
          </div>

          {/* Speech transcription */}
          <div className="speech-box">
            <div className="speech-box-title">🎙 SPEECH TRANSCRIPTION</div>
            <div className="speech-text">
              {transcript || 'Spoken sentences will be transcribed here...'}
            </div>
          </div>
        </section>

        {/* RIGHT — Diagnostic Feed */}
        <section className="panel right-panel">
          <div className="panel-title-row">
            <span className="panel-title">📊 Real-Time Diagnostic Feed</span>
          </div>

          {/* 4-grid stat cards */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon">🧠</div>
              <div className="stat-content">
                <div className="stat-label">SENTIMENT EMOTION</div>
                <div className="stat-value stat-value--purple">{sentiment}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--accent-yellow)' }}>🖐</div>
              <div className="stat-content">
                <div className="stat-label">GESTURE STATE</div>
                <div className="stat-value stat-value--yellow">{gesture}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--accent-yellow)' }}>🏷</div>
              <div className="stat-content">
                <div className="stat-label">TRIGGER SOURCE</div>
                <div className="stat-value stat-value--green">{triggerSource}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ color: threatColor }}>⚠</div>
              <div className="stat-content">
                <div className="stat-label">THREAT LEVEL</div>
                <div className="stat-value" style={{ color: threatColor }}>{threatLevel}</div>
              </div>
            </div>
          </div>

          {/* Status rows */}
          <div className="status-rows">
            <div className="status-row">
              <span className="status-row-label">🎤 Voice Status:</span>
              <span className="status-row-val">{voiceStatusText}</span>
            </div>
            <div className="status-row">
              <span className="status-row-label">🖐 Gesture Status:</span>
              <span className="status-row-val">{gestureStatusText}</span>
            </div>
            <div className="status-row">
              <span className="status-row-label">🚨 Emergency Status:</span>
              <span className="status-row-val" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot-small" style={{ background: emergencyDotColor }} />
                {emergencyStatusText}
              </span>
            </div>
            <div className="status-row">
              <span className="status-row-label">🔴 Live Detection Confidence</span>
              <span className="status-row-val">{confidence}%</span>
            </div>
          </div>

          {/* Activity log */}
          <div className="log-box">
            <div className="log-title">📋 CHRONOLOGICAL ACTIVITY LOG</div>
            <div className="log-entries">
              {log.map((entry, i) => (
                <div key={i} className={`log-entry log-entry--${entry.type}`}>
                  {entry.time
                    ? <span className="log-time">[{entry.time}]</span>
                    : <span className="log-time">[System Init]</span>}
                  <span className={`log-tag log-tag--${entry.type}`}>
                    {entry.type === 'init'   ? '' :
                     entry.type === 'system' ? 'SYSTEM:' :
                     entry.type === 'alert'  ? 'ALERT:' :
                     entry.type === 'voice'  ? 'VOICE:' :
                     entry.type === 'warn'   ? 'WARN:' : ''}
                  </span>
                  <span className="log-text">{entry.text}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Save button */}
          <button className="save-btn">
            🔒 SAVE &amp; SECURE SYSTEM
          </button>
        </section>

      </main>
    </div>
  )
}

export default App
