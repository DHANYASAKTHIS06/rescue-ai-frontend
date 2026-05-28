function InputCard({
  formData,
  handleChange,
  predictGesture,
  loading
}) {

  return (

    <div className="card input-card">

      <h2>Sensor Input</h2>

      <div className="grid">

        <input
          type="number"
          name="ax"
          placeholder="AX"
          value={formData.ax}
          onChange={handleChange}
        />

        <input
          type="number"
          name="ay"
          placeholder="AY"
          value={formData.ay}
          onChange={handleChange}
        />

        <input
          type="number"
          name="az"
          placeholder="AZ"
          value={formData.az}
          onChange={handleChange}
        />

        <input
          type="number"
          name="gx"
          placeholder="GX"
          value={formData.gx}
          onChange={handleChange}
        />

        <input
          type="number"
          name="gy"
          placeholder="GY"
          value={formData.gy}
          onChange={handleChange}
        />

        <input
          type="number"
          name="gz"
          placeholder="GZ"
          value={formData.gz}
          onChange={handleChange}
        />

      </div>

      <button
        onClick={predictGesture}
        disabled={loading}
      >
        {
          loading
            ? 'Predicting...'
            : 'Predict Gesture'
        }
      </button>

    </div>
  )
}

export default InputCard
