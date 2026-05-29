import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import './App.css'

// Import components
import Header from './components/Header'
import CameraFeed from './components/CameraFeed'
import StatusBadge from './components/StatusBadge'
import SpeechPanel from './components/SpeechPanel'
import EmergencyAlert from './components/EmergencyAlert'
import AlertHistory from './components/AlertHistory'
import Footer from './components/Footer'

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

  const [camStarted,    setCamStarted]    = useState(false)
  const [micStarted,    setMicStarted]    = useState(false)
  const [processing,    setProcessing]    = useState(false)
  const [annotated,     setAnnotated]     = useState(null)
  const [gesture,       setGesture]       = useState('IDLE')
  const [emergency,     setEmergency]     = useState(false)
  const [alertSource,   setAlertSource]   = useState('')
  const [alertKeyword,  setAlertKeyword]  = useState('')
  const [transcript,    setTranscript]    = useState('')
  const [camError,      setCamError]      = useState(null)
  const [history,       setHistory]       = useState([])

  // Logs incidents into the History list module sequentially
  const addHistoryItem = useCallback((source, label, keyword = '') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const newItem = {
      id: Date.now(),
      source,
      label: source === 'speech' ? '' : label,
      keyword: source === 'speech' ? keyword : '',
      time
    }
    setHistory(prev => [newItem, ...prev])
  }, [])

  // Confirm connection with backend
  useEffect(() => {
    axios.get(`${BACKEND_URL}/`).catch(() => {
      console.warn('Backend connection unavailable.')
    })
  }, [])

  // Intercept trigger parameters
  const triggerEmergency = useCallback((source, label, keyword = '') => {
    setEmergency(true)
    setAlertSource(source)
    setAlertKeyword(keyword)
    addHistoryItem(source, label, keyword)
  }, [addHistoryItem])

  // Fire device access permissions synchronously
  const startCamAndMic = useCallback(async () => {
    setCamError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setCamStarted(true)
      setMicStarted(true)
    } catch (err) {
      setCamError('Camera/Microphone access denied.')
      console.error(err)
    }
  }, [])

  // Process frames
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
        setGesture(d.gesture)
        if (d.annotated_frame) setAnnotated('data:image/jpeg;base64,' + d.annotated_frame)

        if (d.emergency && !prevEmergency.current) {
          triggerEmergency('gesture', d.gesture)
        }
        if (!d.emergency && prevEmergency.current) {
          setEmergency(false)
        }
        prevEmergency.current = d.emergency
      }
    } catch (err) {
      console.error('Frame processing error', err)
    } finally {
      setProcessing(false)
    }
  }, [processing, triggerEmergency])

  // Handle audio processing loops
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
          if (d.emergency && d.keyword) {
            triggerEmergency('speech', 'KEYWORD', d.keyword)
          }
        }
      } catch (err) {
        console.error('Audio processing error', err)
      }
    }
    
    recorder.start()
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, 3000)
  }, [triggerEmergency])

  // Timing triggers
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

  const dismissAlert = () => {
    setEmergency(false)
    setAlertSource('')
    setAlertKeyword('')
  }

  return (
    <div className={`app-shell ${emergency ? 'app--emergency' : ''}`}>
      <div className="rainbow-bar" />
      <Header />

      {/* Main Structural Layout Grid Wrapper */}
      <main className="dashboard-grid">
        
        {/* Left Hand Column: Live Video Camera Box */}
        <CameraFeed 
          videoRef={videoRef}
          canvasRef={canvasRef}
          annotatedFrame={annotated}
          camStarted={camStarted}
          camError={camError}
          onStart={startCamAndMic}
          processing={processing}
        />

        {/* Right Hand Column Component Stack */}
        <div className="dashboard-sidebar">
          <StatusBadge 
            gesture={gesture}
            emergency={emergency}
            alertSource={alertSource}
            predictedGesture={gesture !== 'IDLE' ? gesture : ''}
            camStarted={camStarted}
            micStarted={micStarted}
          />

          {/* Fully Mounted Speech Data Monitoring Card */}
          <SpeechPanel 
            micStarted={micStarted}
            transcript={transcript}
          />

          <AlertHistory history={history} />
        </div>
      </main>

      {emergency && (
        <EmergencyAlert 
          source={alertSource}
          gesture={gesture}
          keyword={alertKeyword}
          onDismiss={dismissAlert}
        />
      )}

      <Footer />
    </div>
  )
}

export default App
