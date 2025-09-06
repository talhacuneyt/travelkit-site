import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './index.css'

function Footer() {
  const year = new Date().getFullYear()
  const [visitorCount, setVisitorCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    // Get current count from localStorage
    const currentCount = localStorage.getItem('visitorCount')
    const countNumber = currentCount ? parseInt(currentCount, 10) : 0
    setVisitorCount(countNumber)
  }, [])

  const handleFooterLinkClick = (path) => {
    // Navigate to the page and scroll to top
    navigate(path)
    window.scrollTo(0, 0)
    // Force page refresh to ensure scroll animations work correctly
    window.location.reload()
  }

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__content">
        <div className="footer__section footer__section--logo">
          <div className="footer__logo">
            <img src="/images/logo.png" alt="TravelKit Logo" className="footer__logo-img" />
          </div>
          <p className="footer__description">Daha kolay, daha keyifli seyahat</p>
        </div>

        <div className="footer__section">
          <h4 className="footer__section-title">Sayfalar</h4>
          <div className="footer__links">
            <button onClick={() => handleFooterLinkClick('/hakkimizda')} className="footer__link">Hakkımızda</button>
            <button onClick={() => handleFooterLinkClick('/sss')} className="footer__link">SSS</button>
            <button onClick={() => handleFooterLinkClick('/iletisim')} className="footer__link">İletişim</button>
          </div>
        </div>

        <div className="footer__section">
          <h4 className="footer__section-title">İletişim</h4>
          <div className="footer__contact">
            <a href="mailto:cuneytosmanlioglu@gmail.com" className="footer__contact-link">cuneytosmanlioglu@gmail.com</a>
            <a href="tel:+905529278937" className="footer__contact-link">0552 927 8937</a>
          </div>
        </div>
      </div>
      
      <div className="footer__bottom">
        <p className="footer__copyright">© {year} TravelKit. Tüm hakları saklıdır.</p>
        <div className="footer__visitor-count">
          👥 {visitorCount.toLocaleString('tr-TR')} ziyaretçi
        </div>
      </div>
    </footer>
  )
}

export default Footer


