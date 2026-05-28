function PredictionCard({ prediction, error }) {

  return (

    <div className="card prediction-card">

      <h2>Prediction Result</h2>

      {
        error && (
          <div className="error">
            {error}
          </div>
        )
      }

      {
        prediction && (

          <div className="result-box">

            <h1>
              {prediction.predicted_gesture}
            </h1>

            <p>
              Encoded Value:
              {prediction.encoded_prediction}
            </p>

          </div>
        )
      }

      {
        !prediction && !error && (
          <p>
            Enter values and test your model.
          </p>
        )
      }

    </div>
  )
}

export default PredictionCard
