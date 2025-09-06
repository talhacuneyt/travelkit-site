import { useState, useEffect } from 'react'
import './index.css'

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  // Scroll pozisyonunu kontrol et
  useEffect(() => {
    const toggleVisibility = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setIsVisible(scrollTop > 150)
    }

    // Scroll event listener ekle
    window.addEventListener('scroll', toggleVisibility)
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button 
      className="scroll-to-top-btn"
      onClick={scrollToTop}
      aria-label="Yukarı çık"
      title="Yukarı çık"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12 19V5M7 10L12 5L17 10" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export default ScrollToTopButton