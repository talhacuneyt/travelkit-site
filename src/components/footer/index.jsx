import { Link, useNavigate } from 'react-router-dom'
import './index.css'

function Footer() {
  const year = new Date().getFullYear()
  const navigate = useNavigate()

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
        <div className="footer__section">
          <h4 className="footer__section-title">Sayfalar</h4>
          <div className="footer__links">
            <button onClick={() => handleFooterLinkClick('/hakkimizda')} className="footer__link">Hakkımızda</button>
            <button onClick={() => handleFooterLinkClick('/sss')} className="footer__link">SSS</button>
            <button onClick={() => handleFooterLinkClick('/iletisim')} className="footer__link">İletişim</button>
            <button onClick={() => handleFooterLinkClick('/satin-al?package=economic')} className="footer__link">Ekonomik Paket Satın Al</button>
            <button onClick={() => handleFooterLinkClick('/satin-al?package=comfort')} className="footer__link">Konfor Paket Satın Al</button>
            <button onClick={() => handleFooterLinkClick('/satin-al?package=lux')} className="footer__link">Lüks Paket Satın Al</button>
          </div>
        </div>

        <div className="footer__section">
          <h4 className="footer__section-title">Faydalı Linkler</h4>
          <div className="footer__links">
            <a href="https://www.trendyol.com" target="_blank" rel="noopener noreferrer" className="footer__link">Trendyol</a>
            <a href="https://www.hepsiburada.com" target="_blank" rel="noopener noreferrer" className="footer__link">Hepsiburada</a>
            <a href="https://www.n11.com" target="_blank" rel="noopener noreferrer" className="footer__link">N11</a>
            <a href="https://www.instagram.com/travelkitcom/" target="_blank" rel="noopener noreferrer" className="footer__link footer__link--instagram" title="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer__section">
          <h4 className="footer__section-title">İletişim</h4>
          <div className="footer__contact">
            <a href="mailto:info@travelkit.com.tr" className="footer__contact-link">info@travelkit.com.tr</a>
            <a href="tel:+905529278937" className="footer__contact-link">+90 552 927 8937</a>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <p className="footer__copyright">© {year} TravelKit. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  )
}

export default Footer


