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

  // Admin ayarları modalı için state'ler
  const [settingsActiveTab, setSettingsActiveTab] = useState('password')

  // Package Management States
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [packageData, setPackageData] = useState({
    title: '',
    description: '',
    price: '',
    sections: {
      personalCare: '',
      comfort: '',
      technology: '',
      health: '',
      additions: ''
    },
    items: {
      personalCare: [],
      comfort: [],
      technology: [],
      health: [],
      additions: []
    }
  })
  const [packageError, setPackageError] = useState('')
  const [packageSuccess, setPackageSuccess] = useState('')

  // SMS 2FA States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('')
  const [twoFactorError, setTwoFactorError] = useState('')
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')

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

  // 2FA durumu kontrolü
  useEffect(() => {
    const twoFactorEnabled = localStorage.getItem('admin_2fa_enabled') === 'true'
    setTwoFactorEnabled(twoFactorEnabled)
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

  // SMS 2FA Functions
  const enableTwoFactor = () => {
    setShowTwoFactorSetup(true)
    setSmsError('')
  }

  // SMS 2FA Fonksiyonları
  const sendSMS = async (phoneNumber) => {
    try {
      const smsCode = Math.floor(100000 + Math.random() * 900000).toString()

      // Gerçek SMS gönderme - Backend API'sine istek gönder
      const API_URL = import.meta.env.VITE_API_URL || 
        (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://travelkit-backend.vercel.app');
      const response = await fetch(`${API_URL}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: `TravelKit Admin 2FA Kodu: ${smsCode}. Bu kodu kimseyle paylaşmayın.`
        })
      })

      if (response.ok) {
        setSmsCode(smsCode)
        setSmsSent(true)
        setSmsError('')
        console.log(`SMS gönderildi: ${phoneNumber} - Kod: ${smsCode}`)
        return true
      } else {
        const errorData = await response.json()
        setSmsError(errorData.message || 'SMS gönderilemedi. Lütfen tekrar deneyin.')
        return false
      }
    } catch (error) {
      console.error('SMS gönderme hatası:', error)
      setSmsError('SMS gönderilemedi. Lütfen tekrar deneyin.')
      return false
    }
  }

  const verifySMSCode = (inputCode) => {
    return inputCode === smsCode
  }

  const enableSMS2FA = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setSmsError('Lütfen geçerli bir telefon numarası girin')
      return
    }

    const success = await sendSMS(phoneNumber)
    if (success) {
      // SMS gönderildi
    }
  }

  const confirmSMS2FA = () => {
    if (!smsCode || smsCode.length !== 6) {
      setSmsError('Lütfen 6 haneli SMS kodunu girin')
      return
    }

    if (verifySMSCode(smsCode)) {
      setTwoFactorEnabled(true)
      setTwoFactorSuccess('SMS 2FA başarıyla etkinleştirildi!')
      setShowTwoFactorSetup(false)

      // LocalStorage'a kaydet
      localStorage.setItem('admin_2fa_enabled', 'true')
      localStorage.setItem('admin_2fa_method', 'sms')
      localStorage.setItem('admin_2fa_phone', phoneNumber)
    } else {
      setSmsError('Geçersiz SMS kodu. Lütfen tekrar deneyin.')
    }
  }

  const disableTwoFactor = () => {
    setTwoFactorEnabled(false)
    setPhoneNumber('')
    setSmsCode('')
    setSmsSent(false)
    setSmsError('')
    setTwoFactorSuccess('SMS 2FA devre dışı bırakıldı')

    // LocalStorage'dan kaldır
    localStorage.removeItem('admin_2fa_enabled')
    localStorage.removeItem('admin_2fa_method')
    localStorage.removeItem('admin_2fa_phone')
  }

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
    setTwoFactorError('')
    setTwoFactorSuccess('')
    setShowTwoFactorSetup(false)
    setShowBackupCodes(false)
    setTwoFactorCode('')
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

  // Package Management Functions
  const getPackageData = (packageType) => {
    // Önce localStorage'dan kaydedilmiş veriyi kontrol et
    const savedPackage = localStorage.getItem(`package_${packageType}`)
    if (savedPackage) {
      try {
        const parsedData = JSON.parse(savedPackage)
        return parsedData
      } catch (error) {
        console.error('Error parsing saved package data:', error)
      }
    }

    // localStorage'da veri yoksa hardcoded veriyi kullan
    const packages = {
      economic: {
        title: 'Ekonomik',
        description: 'Seyahate zahmetsiz ve eksiksiz bir başlangıç yapmak isteyenler için, akıllı ve şık bir çözüm.',
        price: '₺299',
        sections: {
          personalCare: 'Kişisel Bakım Ürünleri',
          comfort: 'Konfor',
          technology: 'Teknoloji',
          health: 'Sağlık / İlk Yardım',
          additions: 'Ekonomik Paket Eklemeleri'
        },
        items: {
          personalCare: [
            'Diş Fırçası & Macun', 'Şampuan & Duş Jeli', 'Deodorant', 'Güneş Kremi',
            'El Kremi', 'Islak Mendil', 'Mikrofiber Havlu', 'Çamaşır Torbası', 'Dezenfektan'
          ],
          comfort: ['Kulak Tıkacı', 'Göz Bandı', 'Seyahat Defteri & Kalem'],
          technology: ['Powerbank', 'Çoklu Fonksiyonlu Kablo'],
          health: [
            'Ağrı Kesici', 'Basit Alerji İlacı', 'Yara Bandı', 'Antiseptik Krem',
            'Burun Spreyi', 'Maske', 'Sineksavar'
          ],
          additions: [
            'Bavul İçi Düzenleyici', 'Boyun Yastığı', 'Seyahat Terliği',
            'QR Kart, müzik listesi', 'Lavanta kesesi'
          ]
        }
      },
      comfort: {
        title: 'Konforlu',
        description: 'Seyahatlerinde sadece işlevselliği değil, konforu da önemseyenler için özenle hazırlandı. Standartların bir adım ötesinde, eksiksiz bir deneyim sunar.',
        price: '₺599',
        sections: {
          personalCare: 'Kişisel Bakım Ürünleri',
          comfort: 'Konfor',
          technology: 'Teknoloji',
          health: 'Sağlık / İlk Yardım',
          additions: 'KONFOR PAKET EKLEMELERİ'
        },
        items: {
          personalCare: [
            'Diş Fırçası & Macun', 'Şampuan & Duş Jeli', 'Deodorant', 'Güneş Kremi La Roche-Posay',
            'El Krem', 'Tırnak Makası', 'Islak/Kuru Mendil', 'Mikrofiber Havlu',
            'Mini Çamaşır Torbası', 'Dezenfektan', 'Tarak'
          ],
          comfort: ['Uyku Kiti - Uyku Maskesi & Kulak Tıkacı', 'Seyahat Defteri & Kalem'],
          technology: ['Soultech Powerbank', 'Çok Fonksiyonlu Kablo'],
          health: [
            'Ağrı Kesici', 'Basit Alerji İlacı', 'Yara Bandı', 'Antiseptik Krem',
            'Burun Spreyi', 'Maske', 'Sineksavar'
          ],
          additions: [
            'Boyun Yastığı', 'Terlik', 'Bitki Çayı & Enerji Bar', 'Priz Dönüştürücü',
            'Bavul içi düzenleyici', 'Lavanta Kesesi', 'Beurer Saç Kurutma Makinesi',
            'Kompakt Dikiş Seti', 'Küçük Hijyen Çantası', 'QR kodlu müzik listesi'
          ]
        }
      },
      luxury: {
        title: 'Lüks',
        description: 'Her bileşeniyle size özel, seyahatin en seçkin ve prestijli hâli.',
        price: '₺999',
        sections: {
          personalCare: 'Kişisel Bakım Ürünleri (Premium Kalite)',
          comfort: 'Konfor',
          technology: 'Teknoloji',
          health: 'Sağlık / İlk Yardım',
          additions: 'Lüks Paket Eklemeleri'
        },
        items: {
          personalCare: [
            'Diş Fırçası & Macun', 'Şampuan & Duş Jeli', 'Deodorant - L\'occitaneroll-On',
            'Güneş Kremi - La Roche Posay', 'El Kremi', 'Tırnak Makası',
            'Islak/Kuru Mendil', 'Mikrofiber Havlu', 'Mini Çamaşır Torbası',
            'El Dezenfektanı', 'Tarak'
          ],
          comfort: ['Uyku Kiti', 'Silikon Kulak Tıkacı', 'Premium Defter ve Roller Kalem Seti'],
          technology: ['Anker Powerbank', 'Çok Fonksiyonlu Kablo'],
          health: [
            'Ağrı Kesici - Parol', 'Basit Alerji İlacı', 'Yara Bandı', 'Antiseptik Krem',
            'Burun Spreyi', 'Maske', 'Sineksavar'
          ],
          additions: [
            'Boyun Yastığı', 'Katlanabilir Terlik', 'Bitki Çayı & Enerji Bar', 'Priz Dönüştürücü',
            'Parça Valiz Düzenleyici', 'Lavanta Kesesi', 'Xiaomi Saç Kurutma Makinesi',
            'Kompakt Dikiş Seti', 'Deri Hijyen Çantası', 'Ütü / Buhar Düzleştirici',
            'Kapı Alarmı', 'Organik Pamuk Yastık Kılıfı', 'Qr Kodlu Özel Seyahat Playlist Kartı',
            'Deri Bagaj Etiketi', 'Termos', 'Katlanır Şemsiye'
          ]
        }
      }
    }
    return packages[packageType] || null
  }

  const openPackageModal = (packageType = null) => {
    console.log('🚀 openPackageModal çağrıldı:', packageType)

    if (packageType) {
      // Mevcut paket verilerini yükle
      const packageInfo = getPackageData(packageType)
      console.log('📦 Paket verisi yüklendi:', packageInfo)
      setPackageData(packageInfo)
      setEditingPackage(packageType)
    } else {
      // Yeni paket oluştur
      setPackageData({
        title: '',
        description: '',
        price: '',
        sections: {
          personalCare: '',
          comfort: '',
          technology: '',
          health: '',
          additions: ''
        },
        items: {
          personalCare: [],
          comfort: [],
          technology: [],
          health: [],
          additions: []
        }
      })
      setEditingPackage(null)
    }

    console.log('✅ showPackageModal true yapılıyor')
    setShowPackageModal(true)
    setPackageError('')
    setPackageSuccess('')
  }

  const closePackageModal = () => {
    setShowPackageModal(false)
    setEditingPackage(null)
    setPackageData({
      title: '',
      description: '',
      price: '',
      sections: {
        personalCare: '',
        comfort: '',
        technology: '',
        health: '',
        additions: ''
      },
      items: {
        personalCare: [],
        comfort: [],
        technology: [],
        health: [],
        additions: []
      }
    })
    setPackageError('')
    setPackageSuccess('')
  }

  const handlePackageDataChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setPackageData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setPackageData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleItemChange = (section, index, value) => {
    setPackageData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [section]: prev.items[section].map((item, i) =>
          i === index ? value : item
        )
      }
    }))
  }

  const addItem = (section) => {
    setPackageData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [section]: [...prev.items[section], '']
      }
    }))
  }

  const removeItem = (section, index) => {
    setPackageData(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [section]: prev.items[section].filter((_, i) => i !== index)
      }
    }))
  }

  const savePackage = () => {
    // Validation
    if (!packageData.title || !packageData.description || !packageData.price) {
      setPackageError('Lütfen tüm temel alanları doldurun!')
      return
    }

    // Paket verilerini localStorage'a kaydet
    const packageKey = editingPackage || 'new_package'
    localStorage.setItem(`package_${packageKey}`, JSON.stringify(packageData))

    setPackageSuccess('✅ Paket başarıyla kaydedildi!')

    // 3 saniye sonra başarı mesajını temizle
    setTimeout(() => {
      setPackageSuccess('')
    }, 3000)
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
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="admin-settings-modal__body">
                <div className="admin-settings-layout">
                  <div className="admin-tabs-sidebar">
                    <button
                      className={`admin-tab ${settingsActiveTab === 'password' ? 'active' : ''}`}
                      onClick={() => setSettingsActiveTab('password')}
                    >
                      🔐 Şifre Değiştir
                    </button>
                    <button
                      className={`admin-tab ${settingsActiveTab === '2fa' ? 'active' : ''}`}
                      onClick={() => setSettingsActiveTab('2fa')}
                    >
                      🔒 2FA Ayarları
                    </button>
                    <button
                      className={`admin-tab ${settingsActiveTab === 'packages' ? 'active' : ''}`}
                      onClick={() => setSettingsActiveTab('packages')}
                    >
                      📦 Paket Güncelle
                    </button>
                  </div>
                  <div className="admin-tab-content">
                    {settingsActiveTab === 'password' && (
                      <div className="tab-panel">
                        <h4>Şifre Değiştir</h4>
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
                    )}

                    {settingsActiveTab === '2fa' && (
                      <div className="tab-panel">
                        <h4>İki Faktörlü Kimlik Doğrulama (2FA)</h4>
                        <div className="twofa-status">
                          <div className="status-indicator">
                            <span className={`status-dot ${twoFactorEnabled ? 'active' : ''}`}></span>
                            <span>2FA {twoFactorEnabled ? 'Aktif' : 'Pasif'}</span>
                          </div>
                          <p className="twofa-description">
                            Hesabınızı daha güvenli hale getirmek için 2FA'yı etkinleştirin.
                          </p>
                        </div>
                        <div className="twofa-actions">
                          {!twoFactorEnabled ? (
                            <button className="twofa-btn enable-btn" onClick={enableTwoFactor}>
                              📱 2FA'yı Etkinleştir
                            </button>
                          ) : (
                            <button className="twofa-btn disable-btn" onClick={disableTwoFactor}>
                              ❌ 2FA'yı Devre Dışı Bırak
                            </button>
                          )}
                        </div>
                        {twoFactorSuccess && (
                          <div className="success-message">{twoFactorSuccess}</div>
                        )}
                      </div>
                    )}

                    {settingsActiveTab === 'packages' && (
                      <div className="tab-panel">
                        <h4>Paket Yönetimi</h4>
                        <div className="package-management">
                          <div className="package-list">
                            {['economic', 'comfort', 'luxury'].map((packageType) => {
                              const packageData = getPackageData(packageType)
                              const packageNames = {
                                economic: 'Ekonomik Paket',
                                comfort: 'Konforlu Paket',
                                luxury: 'Lüks Paket'
                              }

                              return (
                                <div key={packageType} className="package-item">
                                  <div className="package-info">
                                    <h5>{packageData?.title || packageNames[packageType]}</h5>
                                    <p>Fiyat: {packageData?.price || '₺299'}</p>
                                  </div>
                                  <button
                                    className="edit-package-btn"
                                    onClick={() => {
                                      console.log(`🔘 ${packageNames[packageType]} butonuna tıklandı`)
                                      openPackageModal(packageType)
                                    }}
                                  >
                                    ✏️ Düzenle
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                          <button
                            className="add-package-btn"
                            onClick={() => openPackageModal()}
                          >
                            ➕ Yeni Paket Ekle
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Setup Modal */}
        {showTwoFactorSetup && (
          <div className="two-factor-modal-overlay">
            <div className="modal two-factor-setup-modal">
              <div className="modal-header">
                <h3>🔐 2FA Kurulumu</h3>
              </div>
              <div className="modal-content">
                <div className="two-factor-setup">
                  <div className="setup-step">
                    <h4>1. Telefon Numarası</h4>
                    <p>Telefon numaranızı girin (ülke kodu ile birlikte):</p>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+90 5XX XXX XX XX"
                      className="two-factor-input"
                    />
                    <button
                      className="send-sms-btn"
                      onClick={enableSMS2FA}
                      disabled={smsSent}
                    >
                      {smsSent ? 'SMS Gönderildi' : 'SMS Gönder'}
                    </button>
                  </div>

                  {smsSent && (
                    <div className="setup-step">
                      <h4>2. SMS Kodunu Doğrulayın</h4>
                      <p>Telefonunuza gönderilen 6 haneli kodu girin:</p>
                      <input
                        type="text"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        placeholder="123456"
                        maxLength="6"
                        className="two-factor-input"
                      />
                      <button
                        className="verify-2fa-btn"
                        onClick={confirmSMS2FA}
                      >
                        Doğrula ve Etkinleştir
                      </button>
                    </div>
                  )}

                  {smsError && (
                    <div className="error-message">{smsError}</div>
                  )}
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowTwoFactorSetup(false)}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Package Modal */}
        {console.log('🔍 Admin sayfasında showPackageModal state:', showPackageModal)}
        {showPackageModal && (
          <div className="modal-overlay">
            <div className="package-modal">
              <div className="modal-header">
                <h3>Paket Düzenle</h3>
                <button className="modal-close" onClick={closePackageModal}>
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <form className="package-form">
                  <div className="form-section">
                    <h4>Temel Bilgiler</h4>
                    <div className="form-group">
                      <label>Paket Adı:</label>
                      <input
                        type="text"
                        value={packageData.title}
                        onChange={(e) => handlePackageDataChange('title', e.target.value)}
                        className="form-input"
                        placeholder="Paket adını girin"
                      />
                    </div>
                    <div className="form-group">
                      <label>Açıklama:</label>
                      <textarea
                        value={packageData.description}
                        onChange={(e) => handlePackageDataChange('description', e.target.value)}
                        className="form-textarea"
                        placeholder="Paket açıklamasını girin"
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Fiyat:</label>
                      <input
                        type="text"
                        value={packageData.price}
                        onChange={(e) => handlePackageDataChange('price', e.target.value)}
                        className="form-input"
                        placeholder="₺299"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    {Object.entries(packageData.sections).map(([key, value]) => {
                      const sectionNames = {
                        personalCare: 'Kişisel Bakım Ürünleri',
                        comfort: 'Konfor Ürünleri',
                        technology: 'Teknoloji Ürünleri',
                        health: 'Sağlık Ürünleri',
                        additions: 'Ek Ürünler'
                      }

                      return (
                        <div key={key} className="section-with-items">
                          <h4>{sectionNames[key]}</h4>
                          <div className="form-group">
                            <label>Bölüm Başlığı:</label>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handlePackageDataChange(`sections.${key}`, e.target.value)}
                              className="form-input"
                              placeholder={`${key} bölüm başlığı`}
                            />
                          </div>

                          <div className="items-section">
                            <h5>Ürün Listesi:</h5>
                            <div className="items-list">
                              {packageData.items[key].map((item, index) => (
                                <div key={index} className="item-input-group">
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => handleItemChange(key, index, e.target.value)}
                                    className="form-input"
                                    placeholder={`${key} ürünü`}
                                  />
                                  <button
                                    type="button"
                                    className="remove-item-btn"
                                    onClick={() => removeItem(key, index)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="add-item-btn"
                                onClick={() => addItem(key)}
                              >
                                ➕ Ürün Ekle
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </form>
              </div>
              <div className="modal-actions">
                <button className="save-btn" onClick={savePackage}>
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

      </header>
    )
  }

  // Normal navbar
  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand" aria-label={t('nav.home')}>
          <img src="/images/logo.png" alt="TravelKit Logo" className="navbar__logo" />
          <div className="navbar__brand-text">
            <span className="navbar__title">TravelKit</span>
          </div>
        </Link>

        <button
          className="navbar__toggle"
          aria-expanded={isOpen}
          aria-label={language === 'tr' ? 'Menüyü aç/kapat' : 'Toggle menu'}
          onClick={() => isOpen ? closeMenu() : setIsOpen(true)}
        >
          <span className="navbar__bar"></span>
          <span className="navbar__bar"></span>
          <span className="navbar__bar"></span>
        </button>

        <nav className={`navbar__nav ${isOpen ? 'is-open' : ''} ${isClosing ? 'is-closing' : ''}`} aria-label="Primary">
          <NavLink to="/hakkimizda" className="navbar__link" onClick={closeMenu}>{t('nav.about')}</NavLink>
          <NavLink to="/sss" className="navbar__link" onClick={closeMenu}>{t('nav.faq')}</NavLink>
          <NavLink to="/iletisim" className="navbar__cta" role="button" onClick={closeMenu}>{t('nav.contact')}</NavLink>

          <div className="navbar__button-group">
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
          </div>
        </nav>

      </div>

      {/* Package Modal */}
      {console.log('🔍 showPackageModal state:', showPackageModal)}
      {showPackageModal && (
        <div className="modal-overlay">
          <div className="package-modal">
            <div className="modal-header">
              <h3>Paket Düzenle</h3>
              <button className="modal-close" onClick={closePackageModal}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <form className="package-form">
                <div className="form-section">
                  <h4>Temel Bilgiler</h4>
                  <div className="form-group">
                    <label>Paket Adı:</label>
                    <input
                      type="text"
                      value={packageData.title}
                      onChange={(e) => handlePackageDataChange('title', e.target.value)}
                      className="form-input"
                      placeholder="Paket adını girin"
                    />
                  </div>
                  <div className="form-group">
                    <label>Açıklama:</label>
                    <textarea
                      value={packageData.description}
                      onChange={(e) => handlePackageDataChange('description', e.target.value)}
                      className="form-textarea"
                      placeholder="Paket açıklamasını girin"
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fiyat:</label>
                    <input
                      type="text"
                      value={packageData.price}
                      onChange={(e) => handlePackageDataChange('price', e.target.value)}
                      className="form-input"
                      placeholder="₺299"
                    />
                  </div>
                </div>

                <div className="form-section">
                  {Object.entries(packageData.sections).map(([key, value]) => {
                    const sectionNames = {
                      personalCare: 'Kişisel Bakım Ürünleri',
                      comfort: 'Konfor Ürünleri',
                      technology: 'Teknoloji Ürünleri',
                      health: 'Sağlık Ürünleri',
                      additions: 'Ek Ürünler'
                    }

                    return (
                      <div key={key} className="section-with-items">
                        <h4>{sectionNames[key]}</h4>
                        <div className="form-group">
                          <label>Bölüm Başlığı:</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handlePackageDataChange(`sections.${key}`, e.target.value)}
                            className="form-input"
                            placeholder={`${key} bölüm başlığı`}
                          />
                        </div>

                        <div className="items-section">
                          <h5>Ürün Listesi:</h5>
                          <div className="items-list">
                            {packageData.items[key].map((item, index) => (
                              <div key={index} className="item-input-group">
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => handleItemChange(key, index, e.target.value)}
                                  className="form-input"
                                  placeholder={`${key} ürünü`}
                                />
                                <button
                                  type="button"
                                  className="remove-item-btn"
                                  onClick={() => removeItem(key, index)}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="add-item-btn"
                              onClick={() => addItem(key)}
                            >
                              ➕ Ürün Ekle
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </form>
            </div>
            <div className="modal-actions">
              <button className="save-btn" onClick={savePackage}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar