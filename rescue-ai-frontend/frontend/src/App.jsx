import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

import Header         from './components/Header'
import CameraFeed     from './components/CameraFeed'
import StatusBadge    from './components/StatusBadge'
import EmergencyAlert from './components/EmergencyAlert'
import AlertHistory   from './components/AlertHistory'
import Footer         from './components/Footer'

import './App.css'

// ── Set your deployed Render backend URL here ──────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://rescue-fzfn.onrender.com'

const FRAME_INTERVAL_MS = 200   // send a frame every 200ms (5 fps) — low enough for Render free tier

function App() {
  const videoRef        = useRef(null)
  const canvasRef       = useRef(null)
  const intervalRef     = useRef(null)
  const prevEmergency   = useRef(false)

  const [camStarted,    setCamStarted]    = useState(false)
  const [camError,      setCamError]      = useState('')
  const [gesture,       setGesture]       = useState('IDLE')
  const [emergency,     setEmergency]     = useState(false)
  const [predictedGesture, setPredicted]  = useState('')
  const [annotatedFrame,   setAnnotated]  = useState(null)
  const [alertVisible,  setAlertVisible]  = useState(false)
  const [alertHistory,  setAlertHistory]  = useState([])
  const [processing,    setProcessing]    = useState(false)

  // ── Start webcam ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCamStarted(true)
        setCamError('')
      }
    } catch (err) {
      setCamError('Camera access denied. Please allow camera permission and refresh.')
    }
  }, [])

  // ── Capture frame → send to backend ──────────────────────────────────────────
  const sendFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return

    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const b64 = canvas.toDataURL('image/jpeg', 0.7)

    try {
      setProcessing(true)
      const res = await axios.post(`${BACKEND_URL}/process-frame`, { frame: b64 })
      const d   = res.data

      if (d.success) {
        setGesture(d.gesture)
        setEmergency(d.emergency)
        setPredicted(d.predicted_gesture)
        if (d.annotated_frame) {
          setAnnotated('data:image/jpeg;base64,' + d.annotated_frame)
        }

        // Rising-edge: trigger alert only once per new emergency
        if (d.emergency && !prevEmergency.current) {
          setAlertVisible(true)
          setAlertHistory(prev => [
            { id: Date.now(), gesture: d.gesture, time: new Date().toLocaleTimeString() },
            ...prev.slice(0, 9)
          ])
        }
        prevEmergency.current = d.emergency
      }
    } catch {
      // silent — network blip, keep last state
    } finally {
      setProcessing(false)
    }
  }, [processing])

  // ── Start/stop frame-sending loop when cam is ready ───────────────────────────
  useEffect(() => {
    if (camStarted) {
      intervalRef.current = setInterval(sendFrame, FRAME_INTERVAL_MS)
    }
    return () => clearInterval(intervalRef.current)
  }, [camStarted, sendFrame])

  const dismissAlert = () => setAlertVisible(false)

  return (
    <div className={`app${emergency ? ' app--emergency' : ''}`}>

      {alertVisible && (
        <EmergencyAlert
          gesture={gesture}
          onDismiss={dismissAlert}
        />
      )}

      <Header />

      <div className="main-layout">

        {/* Left — camera */}
        <div className="left-panel">
          <CameraFeed
            videoRef={videoRef}
            canvasRef={canvasRef}
            annotatedFrame={annotatedFrame}
            camStarted={camStarted}
            camError={camError}
            onStart={startCamera}
            processing={processing}
          />
        </div>

        {/* Right — status + history */}
        <div className="right-panel">
          <StatusBadge
            gesture={gesture}
            emergency={emergency}
            predictedGesture={predictedGesture}
            camStarted={camStarted}
          />
          <AlertHistory history={alertHistory} />
        </div>

      </div>

      <Footer />
    </div>
  )
}

export default App
