import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { useTranslation } from '../../hooks/useTranslation'
import './index.css'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { language, toggleLanguage } = useLanguage()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { t } = useTranslation()
  
  // Admin paneli için state'ler
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Şifre değiştirme için state'ler
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Dark mode kontrolü
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Admin login event'ini dinle
  useEffect(() => {
    const handleAdminLogin = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated)
    }

    window.addEventListener('adminLogin', handleAdminLogin)
    return () => window.removeEventListener('adminLogin', handleAdminLogin)
  }, [])

  // Session kontrolü - localStorage değişikliklerini dinle
  useEffect(() => {
    const checkAuth = () => {
      const session = localStorage.getItem('admin_session')
      const sessionTimestamp = localStorage.getItem('admin_session_timestamp')
      
      // Session süresi kontrolü (24 saat)
      const now = Date.now()
      const sessionAge = sessionTimestamp ? now - parseInt(sessionTimestamp) : Infinity
      const maxSessionAge = 24 * 60 * 60 * 1000 // 24 saat
      
      if (session === 'authenticated' && sessionAge < maxSessionAge) {
        setIsAuthenticated(true)
      } else {
        // Geçersiz veya süresi dolmuş session
        localStorage.removeItem('admin_session')
        localStorage.removeItem('admin_session_timestamp')
        setIsAuthenticated(false)
      }
    }
    
    // İlk kontrol
    checkAuth()
    
    // localStorage değişikliklerini dinle
    const handleStorageChange = (e) => {
      if (e.key === 'admin_session' || e.key === 'admin_session_timestamp') {
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Custom event dinle (aynı sayfa içinde localStorage değişiklikleri için)
    const handleCustomStorageChange = () => {
      checkAuth()
    }
    
    window.addEventListener('adminSessionChange', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('adminSessionChange', handleCustomStorageChange)
    }
  }, [])

  const closeMenu = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 200)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.navbar')) {
        closeMenu()
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const handleLanguageChange = () => {
    toggleLanguage()
    // Navigate to home page and refresh to ensure animations work properly
    navigate('/')
    window.scrollTo(0, 0)
    // Force page refresh to ensure scroll animations work correctly
    window.location.reload()
  }

  // Admin paneli fonksiyonları

  const handleLogout = () => {
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_remember_me')
    // Sayfayı yenile ve login sayfasına yönlendir
    window.location.href = '/admin'
  }

  const openSettingsModal = () => {
    setShowSettingsModal(true)
  }

  const closeSettingsModal = () => {
    setShowSettingsModal(false)
    setPasswordError('')
    setPasswordSuccess('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  // Şifre değiştirme fonksiyonu
  const handlePasswordChange = (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tüm alanları doldurun!')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalıdır!')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor!')
      return
    }

    // Mevcut şifre kontrolü - localStorage'dan al
    const currentStoredPassword = localStorage.getItem('admin_password') || 'travelkit2024'
    if (currentPassword !== currentStoredPassword) {
      setPasswordError('Mevcut şifre yanlış!')
      return
    }

    // Yeni şifreyi localStorage'a kaydet
    localStorage.setItem('admin_password', newPassword)
    
    // Başarılı şifre değişikliği
    setPasswordSuccess('Şifre başarıyla değiştirildi!')
    
    // Form'u temizle
    setTimeout(() => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
      setPasswordSuccess('')
    }, 2000)
  }

  // Admin paneli için farklı navbar
  if (location.pathname === '/admin') {
    // Admin giriş sayfası için basit navbar
    // State'i kullan (event ile güncellenir)
    
    if (!isAuthenticated) {
      return (
        <header className="admin-login-navbar">
          <div className="admin-login-navbar__inner">
            <div className="admin-login-navbar__brand">
              <img src="/images/logo.png" alt="TravelKit Logo" className="admin-login-navbar__logo" />
              <span className="admin-login-navbar__title">Yönetici Paneli Giriş</span>
            </div>
            <div className="admin-login-navbar__actions">
              <a href="/" className="admin-login-navbar__home-link">
                🏠 Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </header>
      )
    }
    
    // Admin paneli için tam navbar
    return (
      <header className="admin-navbar">
        <div className="admin-navbar__inner">
          <div className="admin-navbar__brand">
            <img src="/images/logo.png" alt="TravelKit Logo" className="admin-navbar__logo" />
            <span className="admin-navbar__title">Yönetici Paneli</span>
          </div>

          <div className="admin-navbar__actions">
            <button 
              onClick={openSettingsModal} 
              className="admin-navbar__settings-btn"
              title="Admin Ayarları"
            >
              ⚙️
            </button>
            <button 
              onClick={toggleDarkMode} 
              className="admin-navbar__theme-btn"
              title={isDarkMode ? 'Açık Tema' : 'Karanlık Tema'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={handleLogout} 
              className="admin-navbar__logout-btn"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Admin Settings Modal */}
        {showSettingsModal && (
          <div className="admin-settings-modal-overlay" onClick={closeSettingsModal}>
            <div className="admin-settings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-settings-modal__header">
                <h3>⚙️ Admin Ayarları</h3>
                <button className="admin-settings-modal__close" onClick={closeSettingsModal}>
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="admin-settings-modal__body">
                <div className="settings-sections">
                  {/* Password Change Section */}
                  <div className="settings-section">
                    <h4>🔐 Şifre Değiştir</h4>
                    <form onSubmit={handlePasswordChange} className="password-form">
                      <div className="form-group">
                        <label>Mevcut Şifre:</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="form-input"
                            placeholder="Mevcut şifrenizi girin"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            title={showCurrentPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                          >
                            {showCurrentPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Yeni Şifre:</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="form-input"
                            placeholder="Yeni şifrenizi girin (min 6 karakter)"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            title={showNewPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                          >
                            {showNewPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Yeni Şifre Tekrar:</label>
                        <div className="password-input-wrapper">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-input"
                            placeholder="Yeni şifrenizi tekrar girin"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            title={showConfirmPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                          >
                            {showConfirmPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>
                      {passwordError && <div className="error-message">{passwordError}</div>}
                      {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
                      <button type="submit" className="change-password-btn">
                        Şifre Değiştir
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    )
  }

  // Normal navbar
  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand" aria-label={t('nav.home')}>
          <img src="/images/logo.png" alt="TravelKit Logo" className="navbar__logo" />
          <div className="navbar__brand-text">
            <span className="navbar__title">TravelKit</span>
          </div>
        </Link>

        <nav className={`navbar__nav ${isOpen ? 'is-open' : ''} ${isClosing ? 'is-closing' : ''}`} aria-label="Primary">
          <NavLink to="/hakkimizda" className="navbar__link" onClick={closeMenu}>{t('nav.about')}</NavLink>
          <NavLink to="/sss" className="navbar__link" onClick={closeMenu}>{t('nav.faq')}</NavLink>
          <NavLink to="/iletisim" className="navbar__cta" role="button" onClick={closeMenu}>{t('nav.contact')}</NavLink>
          
          <button 
            className="navbar__dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          
          <button 
            className="navbar__language-toggle"
            onClick={handleLanguageChange}
            aria-label={`Switch to ${language === 'tr' ? 'English' : 'Türkçe'}`}
            title={`Switch to ${language === 'tr' ? 'English' : 'Türkçe'}`}
          >
            {language === 'tr' ? 'EN' : 'TR'}
          </button>
        </nav>

        <button
          className="navbar__toggle"
          aria-expanded={isOpen}
          aria-label={language === 'tr' ? 'Menüyü aç/kapat' : 'Toggle menu'}
          onClick={() => isOpen ? closeMenu() : setIsOpen(true)}
        >
          <span className="navbar__bar" />
          <span className="navbar__bar" />
          <span className="navbar__bar" />
        </button>
      </div>
    </header>
  )
}

export default Navbar