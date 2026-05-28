# Rescue AI Gesture Detection Frontend

A React + Vite frontend for the Rescue AI Smart SOS Gesture Prediction System.

## Setup & Run

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

## Features

- Modern dark UI
- Gesture prediction testing via sensor inputs (AX, AY, AZ, GX, GY, GZ)
- Flask backend connection to `https://rescue-fzfn.onrender.com/predict`
- Loading state & error handling
- Prediction result display
- Responsive design

## Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── InputCard.jsx
│   │   ├── PredictionCard.jsx
│   │   └── Footer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   └── App.css
├── package.json
├── vite.config.js
└── index.html
```

## Backend API

**POST** `https://rescue-fzfn.onrender.com/predict`

Request body:
```json
{
  "ax": 0.0,
  "ay": 0.0,
  "az": 0.0,
  "gx": 0.0,
  "gy": 0.0,
  "gz": 0.0
}
```

Response:
```json
{
  "predicted_gesture": "SOS",
  "encoded_prediction": 1
}
```
