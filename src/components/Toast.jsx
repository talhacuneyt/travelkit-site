import { useState, useEffect } from 'react'
import './Toast.css'

function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose && onClose(), 300) // CSS transition süresi
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className={`toast ${type} ${isVisible ? 'show' : 'hide'}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {type === 'success' && (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          )}
          {type === 'error' && (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          )}
        </div>
        <div className="toast-message">{message}</div>
        <button 
          className="toast-close" 
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onClose && onClose(), 300)
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Toast
