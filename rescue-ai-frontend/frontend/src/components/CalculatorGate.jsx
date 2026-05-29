import { useState } from 'react'

function CalculatorGate({ onUnlock }) {
  const [display, setDisplay] = useState('0')
  const [equation, setEquation] = useState('')
  const [resetOnNext, setResetOnNext] = useState(false)

  const handleKeyPress = (val) => {
    if (val === 'AC') {
      setDisplay('0')
      setEquation('')
      setResetOnNext(false)
      return
    }

    if (val === '=') {
      if (display === '1234') {
        onUnlock()
        return
      }
      
      try {
        const sanitized = equation.replace(/×/g, '*').replace(/÷/g, '/')
        if (/^[0-9.+\-*/\s()]+$/.test(sanitized)) {
          const evalResult = new Function(`return (${sanitized})`)()
          const formattedResult = Number.isInteger(evalResult) 
            ? String(evalResult) 
            : parseFloat(evalResult.toFixed(8)).toString()
          
          setDisplay(formattedResult)
          setEquation(formattedResult)
          setResetOnNext(true)
        } else {
          setDisplay('Error')
        }
      } catch (e) {
        setDisplay('Error')
      }
      return
    }

    if (val === '%') {
      try {
        const currentVal = parseFloat(display)
        if (!isNaN(currentVal)) {
          const percentVal = (currentVal / 100).toString()
          setDisplay(percentVal)
          setEquation(percentVal)
        }
      } catch (e) {
        setDisplay('Error')
      }
      return
    }

    if (val === '+/-') {
      if (display !== '0') {
        if (display.startsWith('-')) {
          setDisplay(display.slice(1))
          setEquation(equation.slice(1))
        } else {
          setDisplay('-' + display)
          setEquation('-' + equation)
        }
      }
      return
    }

    if (resetOnNext) {
      if (['+', '-', '×', '÷'].includes(val)) {
        setEquation(display + val)
        setDisplay(val)
      } else {
        setDisplay(val)
        setEquation(val)
      }
      setResetOnNext(false)
    } else {
      if (['+', '-', '×', '÷'].includes(val)) {
        setEquation(prev => prev + val)
        setDisplay(val)
      } else {
        setDisplay(prev => {
          if (prev === '0' || ['+', '-', '×', '÷'].includes(prev)) {
            return val
          }
          return prev + val
        })
        setEquation(prev => prev + val)
      }
    }
  }

  const buttons = [
    { label: 'AC', className: 'calc-btn action' },
    { label: '+/-', className: 'calc-btn action' },
    { label: '%', className: 'calc-btn action' },
    { label: '÷', className: 'calc-btn operator' },
    { label: '7', className: 'calc-btn' },
    { label: '8', className: 'calc-btn' },
    { label: '9', className: 'calc-btn' },
    { label: '×', className: 'calc-btn operator' },
    { label: '4', className: 'calc-btn' },
    { label: '5', className: 'calc-btn' },
    { label: '6', className: 'calc-btn' },
    { label: '-', className: 'calc-btn operator' },
    { label: '1', className: 'calc-btn' },
    { label: '2', className: 'calc-btn' },
    { label: '3', className: 'calc-btn' },
    { label: '+', className: 'calc-btn operator' },
    { label: '0', className: 'calc-btn double' },
    { label: '.', className: 'calc-btn' },
    { label: '=', className: 'calc-btn operator' }
  ]

  return (
    <div className="calculator-gate-container">
      <div className="calculator-card">
        <div className="calc-screen">
          <div className="calc-equation">{equation || '\u00A0'}</div>
          <div className="calc-display">{display}</div>
        </div>
        <div className="calc-grid">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              className={btn.className}
              onClick={() => handleKeyPress(btn.label)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CalculatorGate
