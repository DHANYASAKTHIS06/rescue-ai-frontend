import { useState } from 'react'
import axios from 'axios'

import Header from './components/Header'
import InputCard from './components/InputCard'
import PredictionCard from './components/PredictionCard'
import Footer from './components/Footer'

import './App.css'

function App() {

  const [formData, setFormData] = useState({
    ax: '',
    ay: '',
    az: '',
    gx: '',
    gy: '',
    gz: ''
  })

  const [loading, setLoading] = useState(false)

  const [prediction, setPrediction] = useState(null)

  const [error, setError] = useState('')

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const predictGesture = async () => {

    try {

      setLoading(true)
      setError('')
      setPrediction(null)

      const response = await axios.post(
        'https://rescue-fzfn.onrender.com/predict',
        {
          ax: parseFloat(formData.ax),
          ay: parseFloat(formData.ay),
          az: parseFloat(formData.az),
          gx: parseFloat(formData.gx),
          gy: parseFloat(formData.gy),
          gz: parseFloat(formData.gz)
        }
      )

      setPrediction(response.data)

    } catch (err) {

      setError('Prediction Failed')

    } finally {

      setLoading(false)
    }
  }

  return (

    <div className="app">

      <Header />

      <div className="main-container">

        <InputCard
          formData={formData}
          handleChange={handleChange}
          predictGesture={predictGesture}
          loading={loading}
        />

        <PredictionCard
          prediction={prediction}
          error={error}
        />

      </div>

      <Footer />

    </div>
  )
}

export default App
