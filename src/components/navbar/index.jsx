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
  const [showProductsDropdown, setShowProductsDropdown] = useState(false)
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


  // showPackageModal state değişikliklerini yakala (sadece development'ta)
  useEffect(() => {
    // Debug log removed
  }, [showPackageModal])

  // Admin login/logout event'lerini dinle
  useEffect(() => {
    const handleAdminLogin = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated)
    }

    const handleAdminLogout = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated)
    }

    window.addEventListener('adminLogin', handleAdminLogin)
    window.addEventListener('adminLogout', handleAdminLogout)

    return () => {
      window.removeEventListener('adminLogin', handleAdminLogin)
      window.removeEventListener('adminLogout', handleAdminLogout)
    }
  }, [])

  // JWT Token kontrolü - localStorage değişikliklerini dinle
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('admin_token')

      if (token) {
        // JWT token'ı decode et ve kontrol et
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const now = Math.floor(Date.now() / 1000)

          if (payload.exp && payload.exp > now) {
            setIsAuthenticated(true)
          } else {
            // Token süresi dolmuş
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_session')
            localStorage.removeItem('admin_session_timestamp')
            setIsAuthenticated(false)
          }
        } catch (error) {
          // Geçersiz token
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_session')
          localStorage.removeItem('admin_session_timestamp')
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }
    }

    // İlk kontrol
    checkAuth()

    // localStorage değişikliklerini dinle
    const handleStorageChange = (e) => {
      if (e.key === 'admin_token' || e.key === 'admin_session' || e.key === 'admin_session_timestamp') {
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
      if (showProductsDropdown && !event.target.closest('.navbar__products-dropdown')) {
        setShowProductsDropdown(false)
      }
    }

    if (isOpen || showProductsDropdown) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen, showProductsDropdown])

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
    // Tüm admin verilerini temizle
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session_timestamp')
    localStorage.removeItem('admin_remember_me')
    localStorage.removeItem('admin_login_attempts')

    // State'i güncelle
    setIsAuthenticated(false)

    // Custom event gönder (admin sayfası için)
    window.dispatchEvent(new CustomEvent('adminLogout', {
      detail: { isAuthenticated: false }
    }))

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
  const handlePasswordChange = async (e) => {
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

    if (newPassword === currentPassword) {
      setPasswordError('Yeni şifre mevcut şifre ile aynı olamaz!')
      return
    }

    try {
      // Backend'e şifre değiştirme isteği gönder (proxy üzerinden)
      const token = localStorage.getItem('admin_token')

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
          token: token
        })
      })

      const data = await response.json()

      if (data.success) {
        setPasswordSuccess('Şifre başarıyla değiştirildi!')

        // Form'u temizle
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowCurrentPassword(false)
        setShowNewPassword(false)
        setShowConfirmPassword(false)

        // 3 saniye sonra success mesajını temizle
        setTimeout(() => {
          setPasswordSuccess('')
        }, 3000)
      } else {
        setPasswordError(data.message || 'Şifre değiştirilemedi!')
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error)
      setPasswordError('Sunucu hatası. Lütfen tekrar deneyin.')
    }
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
            'Diş Fırçası & Macun', 'Şampuan & Duş Jeli', 'Deodorant',
            'El Kremi', 'Islak Mendil', 'Mikrofiber Havlu', 'Çamaşır Torbası', 'Dezenfektan'
          ],
          comfort: ['Kulak Tıkacı', 'Göz Bandı', 'Seyahat Defteri & Kalem'],
          technology: ['Powerbank', 'Çoklu Fonksiyonlu Kablo'],
          health: [
            'Ağrı Kesici', 'Basit Alerji İlacı', 'Yara Bandı', 'Antiseptik Krem',
            'Burun Spreyi', 'Maske', 'Sineksavar'
          ],
          additions: [
            'Bavul İçi Düzenleyici', 'Boyun Yastığı',  
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
            'Diş Fırçası & Macun', 'Şampuan & Duş Jeli', 'Deodorant',
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
             'El Kremi', 'Tırnak Makası',
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
                                placeholder=""
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
                                placeholder=""
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
                                placeholder=""
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

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Package Modal */}
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
                        value={packageData.title || ''}
                        onChange={(e) => handlePackageDataChange('title', e.target.value)}
                        className="form-input"
                        placeholder="Paket adını girin"
                      />
                    </div>
                    <div className="form-group">
                      <label>Açıklama:</label>
                      <textarea
                        value={packageData.description || ''}
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
                        value={packageData.price || ''}
                        onChange={(e) => handlePackageDataChange('price', e.target.value)}
                        className="form-input"
                        placeholder="₺299"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    {Object.entries(packageData.sections || {}).map(([key, value]) => {
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
                              value={value || ''}
                              onChange={(e) => handlePackageDataChange(`sections.${key}`, e.target.value)}
                              className="form-input"
                              placeholder={`${key} bölüm başlığı`}
                            />
                          </div>

                          <div className="items-section">
                            <h5>Ürün Listesi:</h5>
                            <div className="items-list">
                              {(packageData.items?.[key] || []).map((item, index) => (
                                <div key={index} className="item-input-group">
                                  <input
                                    type="text"
                                    value={item || ''}
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
    <>
      {/* Top contact bar */}
      <div className="top-contact-bar">
        <div className="top-contact-bar__inner">
          <a href="mailto:info@travelkit.com.tr" className="top-contact-bar__email">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}>
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            info@travelkit.com.tr
          </a>
          <div className="top-contact-bar__social">
            <a href="tel:+905529278937" className="top-contact-bar__icon" title="Telefon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
            </a>
            <a href="https://wa.me/905529278937" target="_blank" rel="noopener noreferrer" className="top-contact-bar__icon" title="WhatsApp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
            </a>
            <a href="https://www.instagram.com/travelkitcom/" target="_blank" rel="noopener noreferrer" className="top-contact-bar__icon" title="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

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
            <div className="navbar__products-dropdown" onMouseEnter={() => setShowProductsDropdown(true)} onMouseLeave={() => setShowProductsDropdown(false)}>
              <button className="navbar__link navbar__products-trigger">
                Ürünlerimiz
                <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor" style={{ marginLeft: '6px', transition: 'transform 0.2s ease' }}>
                  <path d="M1.41 7.41L6 2.83L10.59 7.41L12 6L6 0L0 6L1.41 7.41Z" />
                </svg>
              </button>
              <div className={`navbar__dropdown ${showProductsDropdown ? 'show' : ''}`}>
                <Link to="/ekonomik" className="navbar__dropdown-link" onClick={closeMenu}>
                  Ekonomik Paket
                </Link>
                <Link to="/konforlu" className="navbar__dropdown-link" onClick={closeMenu}>
                  Konfor Paket
                </Link>
                <Link to="/lux" className="navbar__dropdown-link" onClick={closeMenu}>
                  Lüks Paket
                </Link>
              </div>
            </div>
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
                🌐
              </button>
            </div>
          </nav>

        </div>

        {/* Package Modal */}
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
                        value={packageData.title || ''}
                        onChange={(e) => handlePackageDataChange('title', e.target.value)}
                        className="form-input"
                        placeholder="Paket adını girin"
                      />
                    </div>
                    <div className="form-group">
                      <label>Açıklama:</label>
                      <textarea
                        value={packageData.description || ''}
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
                        value={packageData.price || ''}
                        onChange={(e) => handlePackageDataChange('price', e.target.value)}
                        className="form-input"
                        placeholder="₺299"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    {Object.entries(packageData.sections || {}).map(([key, value]) => {
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
                              value={value || ''}
                              onChange={(e) => handlePackageDataChange(`sections.${key}`, e.target.value)}
                              className="form-input"
                              placeholder={`${key} bölüm başlığı`}
                            />
                          </div>

                          <div className="items-section">
                            <h5>Ürün Listesi:</h5>
                            <div className="items-list">
                              {(packageData.items?.[key] || []).map((item, index) => (
                                <div key={index} className="item-input-group">
                                  <input
                                    type="text"
                                    value={item || ''}
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
    </>
  )
}

export default Navbar