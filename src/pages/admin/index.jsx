import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase, EMAILJS_CONFIG } from '../../lib/supabase'
import emailjs from '@emailjs/browser'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import './index.css'

function Admin() {
  const location = useLocation()
  // console.log('Admin component loaded, location:', location.pathname) // Production'da devre dışı
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [confirmResetPassword, setConfirmResetPassword] = useState('')
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [activeTab, setActiveTab] = useState('unread')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [dateFilter, setDateFilter] = useState('all') // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [sortBy, setSortBy] = useState('date') // date, name, email
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc

  // Admin Settings States
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sessionDuration, setSessionDuration] = useState(60) // minutes
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [sessionTimeout, setSessionTimeout] = useState(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [settingsActiveTab, setSettingsActiveTab] = useState('password')



  // SMS 2FA States
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [smsError, setSmsError] = useState('')
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('')
  const [loginTwoFactorCode, setLoginTwoFactorCode] = useState('')
  const [showTwoFactorLogin, setShowTwoFactorLogin] = useState(false)

  // JWT Secret (production'da environment variable kullanılmalı)
  const JWT_SECRET = new TextEncoder().encode(import.meta.env.VITE_JWT_SECRET || 'fallback-secret-key')

  // Şifre hash'leme fonksiyonları
  const hashPassword = async (password) => {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword)
  }

  // JWT Token fonksiyonları (browser uyumlu)
  const generateToken = async (payload) => {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)
    return token
  }

  const verifyToken = async (token) => {
    try {
      // Basit JWT token doğrulama (sadece varlık kontrolü)
      if (!token) return null
      
      // Token'ı decode et (basit kontrol)
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      // Payload'ı decode et
      const payload = JSON.parse(atob(parts[1]))
      
      // Süre kontrolü
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        return null
      }
      
      return payload
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }

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

  const verifyLoginTwoFactor = () => {
    if (!loginTwoFactorCode || loginTwoFactorCode.length !== 6) {
      setLoginError('Lütfen 6 haneli 2FA kodunu girin')
      return
    }

    const secret = localStorage.getItem('admin_2fa_secret')
    if (secret && verifyTwoFactorCode(secret, loginTwoFactorCode)) {
      setShowTwoFactorLogin(false)
      setLoginError('')
      completeLogin()
    } else {
      setLoginError('Geçersiz 2FA kodu')
    }
  }

  const completeLogin = async () => {
    // JWT token oluştur
    const tokenPayload = {
      username: 'admin',
      role: 'admin',
      loginTime: Date.now(),
      sessionId: Math.random().toString(36).substring(2, 15)
    }

    const token = await generateToken(tokenPayload)

    // Başarılı giriş
    setIsAuthenticated(true)
    localStorage.setItem('admin_token', token)
    localStorage.removeItem('admin_login_attempts')
    setLoginError('')
    setLoginAttempts(0)

    // Eski session sistemini temizle
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session_timestamp')

    // Navbar'ı güncellemek için custom event gönder
    window.dispatchEvent(new CustomEvent('adminLogin', {
      detail: { isAuthenticated: true }
    }))

    if (supabase) {
      fetchMessages()
    }
  }

  // Admin login/logout event'lerini dinle
  useEffect(() => {
    const handleAdminLogin = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated)
    }

    const handleAdminLogout = (event) => {
      setIsAuthenticated(event.detail.isAuthenticated)
      // Çıkış yapıldığında tüm state'leri temizle
      setMessages([])
      setPassword('')
      setUsername('')
      setRememberMe(false)
      setLoginError('')
      setLoginAttempts(0)
    }

    window.addEventListener('adminLogin', handleAdminLogin)
    window.addEventListener('adminLogout', handleAdminLogout)

    return () => {
      window.removeEventListener('adminLogin', handleAdminLogin)
      window.removeEventListener('adminLogout', handleAdminLogout)
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      // EmailJS'i başlat (sadece public key varsa)
      if (EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY_HERE') {
        emailjs.init(EMAILJS_CONFIG.publicKey)
      }

      // URL parametrelerini kontrol et
      const urlParams = new URLSearchParams(window.location.search)
      const resetToken = urlParams.get('reset')

      if (resetToken) {
        // Reset token'ı kontrol et
        const storedResetToken = localStorage.getItem('admin_reset_token')
        const tokenExpiry = localStorage.getItem('admin_reset_token_expiry')

        if (storedResetToken === resetToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
          // Geçerli reset token - yeni şifre formunu göster
          setShowNewPasswordForm(true)
          setLoading(false)
          return
        } else {
          // Geçersiz veya süresi dolmuş token
          setResetMessage('❌ Geçersiz veya süresi dolmuş şifre sıfırlama linki!')
          localStorage.removeItem('admin_reset_token')
          localStorage.removeItem('admin_reset_token_expiry')
        }
      }

      // JWT Token kontrolü
      const token = localStorage.getItem('admin_token')

      if (token) {
        try {
          const decodedToken = await verifyToken(token)

          if (decodedToken) {
            // Geçerli token - giriş yap
            setIsAuthenticated(true)
            console.log('✅ Geçerli JWT token bulundu, admin paneline yönlendiriliyor')
          } else {
            // Geçersiz token - tüm verileri temizle
            console.log('❌ Geçersiz JWT token, login sayfasına yönlendiriliyor')
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_session')
            localStorage.removeItem('admin_session_timestamp')
            localStorage.removeItem('admin_login_attempts')
            localStorage.removeItem('admin_2fa_enabled')
            localStorage.removeItem('admin_2fa_method')
            localStorage.removeItem('admin_2fa_phone')
            localStorage.removeItem('admin_remember_me')
            setIsAuthenticated(false)
          }
        } catch (error) {
          // Token doğrulama hatası - tüm verileri temizle
          console.log('❌ JWT token doğrulama hatası, login sayfasına yönlendiriliyor:', error)
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_session')
          localStorage.removeItem('admin_session_timestamp')
          localStorage.removeItem('admin_login_attempts')
          localStorage.removeItem('admin_2fa_enabled')
          localStorage.removeItem('admin_2fa_method')
          localStorage.removeItem('admin_2fa_phone')
          localStorage.removeItem('admin_remember_me')
          setIsAuthenticated(false)
        }
      } else {
        // Token yok - login sayfası göster
        setIsAuthenticated(false)
        console.log('❌ JWT token bulunamadı, login sayfası gösteriliyor')
      }

      // Loading'i son olarak false yap
      setLoading(false)
    }

    initializeAuth()

    // Dark mode kontrolü
    const savedTheme = localStorage.getItem('admin_theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // Session duration kontrolü
    const savedSessionDuration = localStorage.getItem('admin_session_duration')
    if (savedSessionDuration) {
      setSessionDuration(parseInt(savedSessionDuration))
    }

    // Login attempts kontrolü - Hesap kilidini sıfırla
    localStorage.removeItem('admin_login_attempts')
    setLoginAttempts(0)
    setIsLocked(false)
    
    // Backend'deki failed attempts'ı da sıfırla
    try {
      const API_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://travelkit-backend.vercel.app');
      
      await fetch(`${API_URL}/api/auth/reset-attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'admin' })
      })
    } catch (error) {
      console.log('Failed to reset backend attempts:', error)
    }

    // Beni hatırla özelliği güvenlik nedeniyle kaldırıldı
    // Eski kayıtlı bilgileri temizle
    localStorage.removeItem('admin_remember_me')

    // 2FA durumu kontrolü
    const twoFactorEnabled = localStorage.getItem('admin_2fa_enabled') === 'true'
    setTwoFactorEnabled(twoFactorEnabled)
  }, []) // Dependency array'i boş bıraktık

  // fetchMessages fonksiyonunu buraya taşıdık
  const fetchMessages = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase yapılandırılmamış')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Mesajlar yüklenirken hata:', error)
      } else {
        // localStorage'dan okunmuş mesajları al
        const readMessages = JSON.parse(localStorage.getItem('read_messages') || '[]')

        // Her mesaj için okunmuş durumunu kontrol et
        // Önce veritabanındaki değeri, sonra localStorage'ı kontrol et
        const messagesWithReadStatus = (data || []).map(msg => ({
          ...msg,
          is_read: msg.is_read || readMessages.includes(msg.id) || false
        }))

        // console.log('Yüklenen mesajlar:', messagesWithReadStatus)
        setMessages(messagesWithReadStatus)
      }
    } catch (err) {
      console.error('Veritabanı bağlantı hatası:', err)
    } finally {
      setLoading(false)
    }
  }, []) // supabase dependency'sini kaldırdık

  // Ayrı bir useEffect ile fetchMessages'ı çağır
  useEffect(() => {
    if (isAuthenticated && supabase) {
      fetchMessages()
    }
  }, [isAuthenticated, fetchMessages])

  // Session timeout management
  useEffect(() => {
    if (isAuthenticated) {
      // Clear existing timeout
      if (sessionTimeout) {
        clearTimeout(sessionTimeout)
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        // console.log('⏰ Session timeout - otomatik çıkış yapılıyor')
        handleLogout()
        alert('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
      }, sessionDuration * 60 * 1000) // Convert minutes to milliseconds

      setSessionTimeout(timeout)

      // Cleanup on unmount
      return () => {
        if (timeout) {
          clearTimeout(timeout)
        }
      }
    }
  }, [isAuthenticated, sessionDuration])

  // Token validation on page focus/visibility change
  useEffect(() => {
    const validateTokenOnFocus = async () => {
      if (isAuthenticated) {
        const token = localStorage.getItem('admin_token')
        if (token) {
          try {
            const decodedToken = await verifyToken(token)
            if (!decodedToken) {
              console.log('🔒 Token geçersiz hale geldi, çıkış yapılıyor')
              handleLogout()
            }
          } catch (error) {
            console.log('🔒 Token doğrulama hatası, çıkış yapılıyor:', error)
            handleLogout()
          }
        } else {
          console.log('🔒 Token bulunamadı, çıkış yapılıyor')
          handleLogout()
        }
      }
    }

    // Sayfa odaklandığında token'ı kontrol et
    window.addEventListener('focus', validateTokenOnFocus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        validateTokenOnFocus()
      }
    })

    // Sayfa yüklendiğinde de kontrol et
    validateTokenOnFocus()

    return () => {
      window.removeEventListener('focus', validateTokenOnFocus)
      document.removeEventListener('visibilitychange', validateTokenOnFocus)
    }
  }, [isAuthenticated])

  // URL'ye göre paket modal'ını aç - Artık kullanılmıyor, onClick handler'lar kullanılıyor
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const path = location.pathname
  //     if (path === '/admin/paket/ekonomik') {
  //       openPackageModal('economic')
  //     } else if (path === '/admin/paket/konforlu') {
  //       openPackageModal('comfort')
  //     } else if (path === '/admin/paket/lux') {
  //       openPackageModal('luxury')
  //     }
  //   }
  // }, [isAuthenticated, location.pathname])

  // Settings modal body scroll prevention
  useEffect(() => {
    if (showSettingsModal) {
      // Mevcut scroll pozisyonunu kaydet
      const scrollY = window.scrollY

      // Body'yi tamamen sabitle
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
      document.body.style.overflow = 'hidden'
      document.body.style.overscrollBehavior = 'none'
      document.body.style.touchAction = 'none'

      // HTML elementini de sabitle
      document.documentElement.style.overflow = 'hidden'
      document.documentElement.style.overscrollBehavior = 'none'

      // Scroll event'lerini engelle
      const preventScroll = (e) => {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      document.addEventListener('wheel', preventScroll, { passive: false })
      document.addEventListener('touchmove', preventScroll, { passive: false })
      document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Space'].includes(e.key)) {
          e.preventDefault()
        }
      })

      return () => {
        // Geri yükle
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
        document.body.style.height = ''
        document.body.style.overflow = ''
        document.body.style.overscrollBehavior = ''
        document.body.style.touchAction = ''

        document.documentElement.style.overflow = ''
        document.documentElement.style.overscrollBehavior = ''

        // Event listener'ları kaldır
        document.removeEventListener('wheel', preventScroll)
        document.removeEventListener('touchmove', preventScroll)

        window.scrollTo(0, scrollY)
      }
    }
  }, [showSettingsModal])

  async function handleLogin(e) {
    e.preventDefault()

    if (isLocked) {
      setLoginError('Hesap kilitlendi! Şifre sıfırlama için email gönderin.')
      return
    }

    try {
      setLoginError('')
      
      // Backend API'sine login isteği gönder
      const API_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://travelkit-backend.vercel.app');
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      })

      const data = await response.json()

      if (data.success) {
        // Başarılı giriş - backend'den gelen token'ı kullan
        const token = data.token
        localStorage.setItem('admin_token', token)
        
        // Başarısız giriş sayacını sıfırla
        localStorage.removeItem('admin_login_attempts')
        setLoginAttempts(0)
        setIsLocked(false)
        
        // Backend'den gelen token ile doğrudan giriş yap
        setIsAuthenticated(true)
        setLoginError('')
        setUsername('')
        setPassword('')
        
        // Navbar'ı güncellemek için custom event gönder
        window.dispatchEvent(new CustomEvent('adminLogin', {
          detail: { isAuthenticated: true }
        }))

        if (supabase) {
          fetchMessages()
        }
        
        console.log('✅ Admin girişi başarılı!')
      } else {
        // Hatalı giriş
        handleBackendLoginError(data.message, username)
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error.message.includes('rate limit') || error.message.includes('Çok fazla')) {
        setLoginError('Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.')
      } else {
        setLoginError('Sunucu hatası. Lütfen tekrar deneyin.')
      }
    }
  }

  // Backend'den gelen hata mesajlarını işle
  function handleBackendLoginError(message, username) {
    if (message === 'Böyle bir kullanıcı yok') {
      // Kullanıcı yoksa counter artırma, sadece mesaj göster
      setLoginError(message)
    } else if (message === 'Kullanıcı adı veya şifre hatalı') {
      // Yanlış şifre - counter artır
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      localStorage.setItem('admin_login_attempts', newAttempts.toString())

      if (newAttempts >= 3) {
        setIsLocked(true)
        setLoginError('3 hatalı deneme! Hesap kilitlendi. Şifre sıfırlama için email gönderin.')
        setShowResetForm(true)
      } else {
        const remainingAttempts = 3 - newAttempts
        setLoginError(`Yanlış kullanıcı adı veya şifre! Kalan deneme hakkı: ${remainingAttempts}`)
      }
    } else if (message.includes('Çok fazla giriş denemesi')) {
      // Rate limit hatası - counter artırma
      setLoginError(message)
    } else {
      // Diğer hatalar
      setLoginError(message)
    }

    setUsername('')
    setPassword('')
  }

  function handleLoginError() {
    // Eski fonksiyon - artık kullanılmıyor
    console.warn('handleLoginError is deprecated, use handleBackendLoginError instead')
  }

  function handleLogout() {
    // console.log('🚪 Admin çıkış yapılıyor...')

    // State'leri temizle
    setIsAuthenticated(false)
    setMessages([])
    setPassword('')
    setUsername('')
    setRememberMe(false)
    setLoginError('')
    setLoginAttempts(0)

    // Tüm admin verilerini temizle
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session_timestamp')
    localStorage.removeItem('admin_login_attempts')
    localStorage.removeItem('admin_2fa_enabled')
    localStorage.removeItem('admin_2fa_method')
    localStorage.removeItem('admin_2fa_phone')
    localStorage.removeItem('admin_remember_me')

    // Clear session timeout
    if (sessionTimeout) {
      clearTimeout(sessionTimeout)
      setSessionTimeout(null)
    }

    // Navbar'ı güncellemek için custom event gönder
    window.dispatchEvent(new CustomEvent('adminLogout', {
      detail: { isAuthenticated: false }
    }))

    // Sayfayı yenile ve login sayfasına yönlendir
    window.location.reload()
  }

  async function handlePasswordReset(e) {
    e.preventDefault()

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetEmail)) {
      setResetMessage('Geçerli bir email adresi girin!')
      return
    }

    try {
      setResetMessage('Email gönderiliyor...')

      // Backend API'sine reset isteği gönder
      const API_URL = import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://travelkit-backend.vercel.app');
      
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resetEmail
        })
      })

      const data = await response.json()

      if (data.success) {
        setResetMessage(data.message)
        
        // Reset form after 10 seconds
        setTimeout(() => {
          setResetMessage('')
          setResetEmail('')
          setShowResetForm(false)
          setIsLocked(false)
          setLoginAttempts(0)
          localStorage.removeItem('admin_login_attempts')
          console.log('🔓 Hesap kilidi otomatik olarak kaldırıldı')
        }, 10000)
      } else {
        setResetMessage(`❌ ${data.message}`)
      }

    } catch (error) {
      console.error('Password reset error:', error)
      setResetMessage('❌ Sunucu hatası. Lütfen tekrar deneyin.')
    }
  }

  // Yeni şifre belirleme fonksiyonu
  async function handleNewPassword(e) {
    e.preventDefault()

    // Validation
    if (!resetNewPassword || !confirmResetPassword) {
      setResetMessage('Tüm alanları doldurun!')
      return
    }

    if (resetNewPassword.length < 6) {
      setResetMessage('Yeni şifre en az 6 karakter olmalıdır!')
      return
    }

    if (resetNewPassword !== confirmResetPassword) {
      setResetMessage('Şifreler eşleşmiyor!')
      return
    }

    try {
      // Yeni şifreyi hash'le ve localStorage'a kaydet
      const hashedNewPassword = await hashPassword(resetNewPassword)
      localStorage.setItem('admin_password_hash', hashedNewPassword)

      // Eski düz metin şifreyi temizle (güvenlik)
      localStorage.removeItem('admin_password')

      // JWT token oluştur ve otomatik login yap
      const tokenPayload = {
        username: 'admin',
        role: 'admin',
        loginTime: Date.now(),
        sessionId: Math.random().toString(36).substring(2, 15)
      }
      const token = await generateToken(tokenPayload)

      setIsAuthenticated(true)
      localStorage.setItem('admin_token', token)

      setResetMessage('✅ Şifre başarıyla değiştirildi! Otomatik giriş yapılıyor...')

      // Reset token'ı temizle (tek kullanımlık)
      localStorage.removeItem('admin_reset_token')
      localStorage.removeItem('admin_reset_token_expiry')

      // URL'den reset parametresini kaldır
      window.history.replaceState({}, document.title, '/admin')

      // 2 saniye sonra mesajı temizle
      setTimeout(() => {
        setResetMessage('')
        setShowNewPasswordForm(false)
      }, 2000)

    } catch (error) {
      console.error('Şifre değiştirme hatası:', error)
      setResetMessage('❌ Şifre değiştirilemedi. Lütfen tekrar deneyin.')
    }
  }

  function resetLoginAttempts() {
    setLoginAttempts(0)
    setIsLocked(false)
    setShowResetForm(false)
    setResetEmail('')
    setResetMessage('')
    setRememberMe(false)
    localStorage.removeItem('admin_login_attempts')
  }


  async function deleteMessage(id) {
    if (!supabase) {
      console.warn('Supabase yapılandırılmamış')
      return
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Mesaj silinirken hata:', error)
      } else {
        setMessages(messages.filter(msg => msg.id !== id))
      }
    } catch (err) {
      console.error('Silme hatası:', err)
    }
  }

  async function markAsRead(id) {
    console.log('Mesaj okundu işaretleniyor:', id)

    // Önce state'i güncelle (hızlı UI response için)
    setMessages(messages.map(msg =>
      msg.id === id ? { ...msg, is_read: true } : msg
    ))

    // localStorage'a kaydet
    const readMessages = JSON.parse(localStorage.getItem('read_messages') || '[]')
    if (!readMessages.includes(id)) {
      readMessages.push(id)
      localStorage.setItem('read_messages', JSON.stringify(readMessages))
    }

    // Veritabanını güncelle (eğer Supabase varsa)
    if (supabase) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .update({ is_read: true })
          .eq('id', id)

        if (error) {
          console.error('Veritabanı güncelleme hatası:', error)
        } else {
          console.log('Veritabanı başarıyla güncellendi')
        }
      } catch (err) {
        console.error('Veritabanı güncelleme hatası:', err)
      }
    }

    console.log('Mesaj başarıyla okundu olarak işaretlendi')
  }

  // Mesajları filtrele ve sırala
  const filteredMessages = sortMessages(messages.filter(message => {
    // Tab filtresi
    let tabMatch = true
    if (activeTab === 'unread') {
      tabMatch = !message.is_read
    } else if (activeTab === 'read') {
      tabMatch = message.is_read
    } else if (activeTab === 'all') {
      tabMatch = true
    }

    // Arama filtresi
    let searchMatch = true
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      searchMatch =
        message.name.toLowerCase().includes(searchLower) ||
        message.email.toLowerCase().includes(searchLower) ||
        message.message.toLowerCase().includes(searchLower)
    }

    // Tarih filtresi
    const dateRange = getDateRange(dateFilter)
    const dateMatch = isMessageInDateRange(message, dateRange)

    return tabMatch && searchMatch && dateMatch
  }))

  // İstatistikler
  const unreadCount = messages.filter(msg => !msg.is_read).length
  const readCount = messages.filter(msg => msg.is_read).length

  // Gelişmiş istatistikler
  function getMessageStats() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const daily = messages.filter(msg => {
      const msgDate = new Date(msg.created_at)
      return msgDate >= today
    }).length

    const weekly = messages.filter(msg => {
      const msgDate = new Date(msg.created_at)
      return msgDate >= weekAgo
    }).length

    const monthly = messages.filter(msg => {
      const msgDate = new Date(msg.created_at)
      return msgDate >= monthAgo
    }).length

    return { daily, weekly, monthly }
  }

  const stats = getMessageStats()

  // Grafik verileri
  function getChartData() {
    // Son 7 günün mesaj sayıları
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayMessages = messages.filter(msg => {
        const msgDate = new Date(msg.created_at)
        return msgDate >= dayStart && msgDate < dayEnd
      }).length

      last7Days.push({
        date: date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
        count: dayMessages
      })
    }

    // Saatlik dağılım (0-23 saat)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourMessages = messages.filter(msg => {
        const msgDate = new Date(msg.created_at)
        return msgDate.getHours() === hour
      }).length

      return {
        hour: hour.toString().padStart(2, '0') + ':00',
        count: hourMessages
      }
    })

    return { last7Days, hourlyData }
  }

  const chartData = getChartData()

  // Modal fonksiyonları
  function openModal(message) {
    setSelectedMessage(message)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setSelectedMessage(null)
  }

  function getTurkishSuffix(name) {
    const lastChar = name.charAt(name.length - 1).toLowerCase()
    const vowelEndings = ['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü']
    return vowelEndings.includes(lastChar) ? "'dan" : "'den"
  }

  function handleTabChange(newTab) {
    if (newTab === activeTab) return

    setIsTransitioning(true)

    setTimeout(() => {
      setActiveTab(newTab)
      setIsTransitioning(false)
    }, 150)
  }

  async function markAllAsRead() {
    const unreadMessages = messages.filter(msg => !msg.is_read)

    // Önce state'i güncelle (hızlı UI response için)
    setMessages(messages.map(msg =>
      unreadMessages.some(unread => unread.id === msg.id)
        ? { ...msg, is_read: true }
        : msg
    ))

    // localStorage'a kaydet
    const readMessages = JSON.parse(localStorage.getItem('read_messages') || '[]')
    const newReadMessages = [...readMessages]

    unreadMessages.forEach(message => {
      if (!newReadMessages.includes(message.id)) {
        newReadMessages.push(message.id)
      }
    })

    localStorage.setItem('read_messages', JSON.stringify(newReadMessages))

    // Veritabanını güncelle (eğer Supabase varsa)
    if (supabase) {
      try {
        const { error } = await supabase
          .from('contact_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(msg => msg.id))

        if (error) {
          console.error('Toplu güncelleme hatası:', error)
        } else {
          console.log('Tüm mesajlar başarıyla okundu olarak işaretlendi')
        }
      } catch (err) {
        console.error('Toplu güncelleme hatası:', err)
      }
    }
  }

  function openDeleteConfirmModal() {
    if (messages.length === 0) {
      return
    }
    setShowDeleteConfirmModal(true)
  }

  async function confirmDeleteAll() {
    if (!supabase) {
      console.warn('Supabase yapılandırılmamış')
      return
    }

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .neq('id', 0) // Tüm kayıtları sil

      if (error) {
        console.error('Tüm mesajlar silinirken hata:', error)
        alert('Mesajlar silinirken bir hata oluştu!')
      } else {
        setMessages([])
        // localStorage'daki okunmuş mesajları da temizle
        localStorage.removeItem('read_messages')
        console.log('Tüm mesajlar başarıyla silindi')
      }
    } catch (err) {
      console.error('Toplu silme hatası:', err)
      alert('Mesajlar silinirken bir hata oluştu!')
    } finally {
      setShowDeleteConfirmModal(false)
    }
  }

  function cancelDeleteAll() {
    setShowDeleteConfirmModal(false)
  }


  // Arama fonksiyonu
  function handleSearch(e) {
    setSearchTerm(e.target.value)

    // Arama yaparken otomatik olarak "Tümü" tabına geç
    if (e.target.value.trim() && activeTab !== 'all') {
      setActiveTab('all')
    }
  }

  function clearSearch() {
    setSearchTerm('')
  }

  // Tarih filtreleme fonksiyonları
  function getDateRange(filter) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (filter) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        return {
          start: weekAgo,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        return {
          start: monthAgo,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate + 'T23:59:59') : null
        }
      default:
        return { start: null, end: null }
    }
  }

  function isMessageInDateRange(message, dateRange) {
    if (!dateRange.start || !dateRange.end) return true

    const messageDate = new Date(message.created_at)
    return messageDate >= dateRange.start && messageDate <= dateRange.end
  }

  function handleDateFilterChange(filter) {
    setDateFilter(filter)
    if (filter !== 'custom') {
      setShowDatePicker(false)
    } else {
      setShowDatePicker(true)
    }
  }

  function clearDateFilter() {
    setDateFilter('all')
    setCustomStartDate('')
    setCustomEndDate('')
    setShowDatePicker(false)
  }

  // Sıralama fonksiyonları
  function sortMessages(messages) {
    return [...messages].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at) - new Date(b.created_at)
          break
        case 'name':
          comparison = a.name.localeCompare(b.name, 'tr')
          break
        case 'email':
          comparison = a.email.localeCompare(b.email, 'tr')
          break
        default:
          comparison = 0
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  function handleSortChange(sortField) {
    if (sortBy === sortField) {
      // Aynı alan seçildiyse sıralama yönünü değiştir
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Yeni alan seçildiyse o alana göre sırala
      setSortBy(sortField)
      setSortOrder('asc')
    }
  }

  function getSortIcon(field) {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }


  // Admin Settings Functions
  function openSettingsModal() {
    setShowSettingsModal(true)
    setPasswordError('')
    setPasswordSuccess('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  function closeSettingsModal() {
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

  async function handlePasswordChange(e) {
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
      // Mevcut şifreyi kontrol et
      const currentHashedPassword = localStorage.getItem('admin_password_hash')
      const isCurrentPasswordValid = await verifyPassword(currentPassword, currentHashedPassword)

      if (!isCurrentPasswordValid) {
        setPasswordError('Mevcut şifre yanlış!')
        return
      }

      // Yeni şifreyi hash'le ve kaydet
      const hashedNewPassword = await hashPassword(newPassword)
      localStorage.setItem('admin_password_hash', hashedNewPassword)

      // Eski düz metin şifreyi temizle (güvenlik)
      localStorage.removeItem('admin_password')

      setPasswordSuccess('Şifre başarıyla değiştirildi!')

      // Clear form
      setTimeout(() => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordSuccess('')
      }, 3000)
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error)
      setPasswordError('Şifre değiştirilemedi. Lütfen tekrar deneyin.')
    }
  }


  function handleSessionDurationChange(duration) {
    setSessionDuration(duration)
    localStorage.setItem('admin_session_duration', duration.toString())

    // Reset session timeout with new duration
    if (isAuthenticated) {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout)
      }

      const timeout = setTimeout(() => {
        handleLogout()
        alert('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
      }, duration * 60 * 1000)

      setSessionTimeout(timeout)
    }
  }

  // Arama terimini vurgulama fonksiyonu
  function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm.trim()) return text

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="search-highlight">{part}</mark>
      ) : part
    )
  }

  // Export fonksiyonu
  function exportToExcel() {
    if (messages.length === 0) {
      alert('Dışa aktarılacak mesaj bulunmuyor!')
      return
    }

    // Excel için HTML tablosu oluştur
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <meta name="ExcelCreated" content="true">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .unread { background-color: #fff3cd; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>İsim</th>
                <th>Email</th>
                <th>Mesaj</th>
                <th>Tarih</th>
                <th>Okunma Durumu</th>
              </tr>
            </thead>
            <tbody>
              ${messages.map(msg => `
                <tr class="${msg.is_read ? '' : 'unread'}">
                  <td>${msg.name}</td>
                  <td>${msg.email}</td>
                  <td>${msg.message}</td>
                  <td>${new Date(msg.created_at).toLocaleString('tr-TR')}</td>
                  <td>${msg.is_read ? 'Okunmuş' : 'Okunmamış'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `mesajlar_${new Date().toISOString().split('T')[0]}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Güvenlik kontrolü yapılıyor...</div>
      </div>
    )
  }


  // Login formu

  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="login-form">
          <h1>Admin Girişi</h1>

          {showNewPasswordForm ? (
            <form onSubmit={handleNewPassword}>
              <div className="reset-form">
                <h3>🔐 Yeni Şifre Belirle</h3>
                <p>Şifre sıfırlama linkine tıkladınız. Yeni şifrenizi belirleyin.</p>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Yeni Şifre (min 6 karakter)"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    required
                    className="email-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Yeni Şifre Tekrar"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    required
                    className="email-input"
                  />
                </div>
                {resetMessage && (
                  <div className={`message ${resetMessage.includes('başarıyla') ? 'success-message' : 'error-message'}`}>
                    {resetMessage}
                  </div>
                )}
                <div className="reset-actions">
                  <button type="submit" className="reset-btn">
                    Şifreyi Değiştir ve Giriş Yap
                  </button>
                </div>
              </div>
            </form>
          ) : !showResetForm ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Kullanıcı Adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="username-input"
                  disabled={isLocked}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="password-input"
                  disabled={isLocked}
                />
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
              {loginAttempts > 0 && !isLocked && (
                <div className="warning-message">
                  ⚠️ Kalan deneme hakkı: {3 - loginAttempts}
                </div>
              )}
              {isLocked && (
                <div className="unlock-section">
                  <div className="unlock-info">
                    <p>🔒 Hesap kilitlendi! Şifre sıfırlama için email gönderin.</p>
                  </div>
                  <div className="unlock-buttons">
                    <button 
                      type="button" 
                      className="reset-btn"
                      onClick={() => setShowResetForm(true)}
                    >
                      📧 Email ile Reset
                    </button>
                  </div>
                </div>
              )}
              {/* Beni Hatırla özelliği güvenlik nedeniyle kaldırıldı */}
              <button type="submit" className="login-btn" disabled={isLocked}>
                {isLocked ? 'Hesap Kilitli' : 'Giriş Yap'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordReset}>
              <div className="reset-form">
                <h3>🔒 Şifre Sıfırlama</h3>
                <p>Hesabınız 3 hatalı deneme sonrası kilitlendi. Şifre sıfırlama için email adresinizi girin.</p>
                <div className="form-group">
                  <input
                    type="email"
                    placeholder="Email Adresiniz"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="email-input"
                  />
                </div>
                {resetMessage && (
                  <div className={`message ${resetMessage.includes('gönderildi') ? 'success-message' : 'error-message'}`}>
                    {resetMessage}
                  </div>
                )}
                <div className="reset-actions">
                  <button type="submit" className="reset-btn">
                    Şifre Sıfırlama Linki Gönder
                  </button>
                  <button type="button" onClick={resetLoginAttempts} className="cancel-btn">
                    İptal
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="admin-container">
        <div className="no-messages">
          <h2>Supabase Yapılandırılmamış</h2>
          <p>Veritabanı özelliklerini kullanmak için Supabase ayarlarını yapılandırın.</p>
          <p>Detaylar için <code>SUPABASE_SETUP.md</code> dosyasını inceleyin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">

      {/* Filtre Bilgisi */}
      {dateFilter !== 'all' && (
        <div className="date-filter-info">
          {dateFilter === 'today' && 'Bugünkü mesajlar gösteriliyor'}
          {dateFilter === 'week' && 'Son 7 günün mesajları gösteriliyor'}
          {dateFilter === 'month' && 'Son 30 günün mesajları gösteriliyor'}
          {dateFilter === 'custom' && customStartDate && customEndDate &&
            `${customStartDate} - ${customEndDate} tarihleri arasındaki mesajlar gösteriliyor`
          }
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.daily}</div>
            <div className="stat-label">Bugün</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{stats.weekly}</div>
            <div className="stat-label">Bu Hafta</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.monthly}</div>
            <div className="stat-label">Bu Ay</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📧</div>
          <div className="stat-content">
            <div className="stat-number">{messages.length}</div>
            <div className="stat-label">Toplam</div>
          </div>
        </div>
      </div>

      {/* Grafikler */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>📈 Son 7 Gün Mesaj Trendi</h3>
          <div className="bar-chart">
            {chartData.last7Days.map((day, index) => {
              const maxCount = Math.max(...chartData.last7Days.map(d => d.count))
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0

              return (
                <div key={index} className="bar-item">
                  <div
                    className="bar"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.count} mesaj`}
                  ></div>
                  <div className="bar-label">{day.date}</div>
                  <div className="bar-count">{day.count}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="chart-container">
          <h3>🕐 En Çok Mesaj Gelen Saatler</h3>
          <div className="hourly-chart">
            {chartData.hourlyData.map((hour, index) => {
              const maxCount = Math.max(...chartData.hourlyData.map(h => h.count))
              const height = maxCount > 0 ? (hour.count / maxCount) * 100 : 0

              return (
                <div key={index} className="hour-item">
                  <div
                    className="hour-bar"
                    style={{ height: `${height}%` }}
                    title={`${hour.hour}: ${hour.count} mesaj`}
                  ></div>
                  <div className="hour-label">{hour.hour}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="search-filters-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <div className="search-icon">⌕</div>
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          {searchTerm && (
            <div className="search-results-info">
              {filteredMessages.length} sonuç
            </div>
          )}
        </div>
        <div className="filters-row">
          <select
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className="date-filter-select"
          >
            <option value="all">Tümü</option>
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="custom">Özel Tarih</option>
          </select>
          <button
            className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
            onClick={() => handleSortChange('date')}
            title="Tarihe göre sırala"
          >
            📅 {getSortIcon('date')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSortChange('name')}
            title="İsme göre sırala"
          >
            👤 {getSortIcon('name')}
          </button>
          <button
            className={`sort-btn ${sortBy === 'email' ? 'active' : ''}`}
            onClick={() => handleSortChange('email')}
            title="Email'e göre sırala"
          >
            📧 {getSortIcon('email')}
          </button>
        </div>
      </div>

      {/* Özel Tarih Seçici */}
      {showDatePicker && (
        <div className="custom-date-picker">
          <div className="date-inputs">
            <div className="date-input-group">
              <label>Başlangıç:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>Bitiş:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="date-input"
              />
            </div>
            <button onClick={clearDateFilter} className="clear-date-btn">
              Temizle
            </button>
          </div>
        </div>
      )}

      <div className="admin-main-content">
        <div className="tabs">
          <div className="tabs-container">
            <button
              className={`tab ${activeTab === 'unread' ? 'tab--active' : ''}`}
              onClick={() => handleTabChange('unread')}
            >
              Okunmamış ({unreadCount})
            </button>
            <button
              className={`tab ${activeTab === 'read' ? 'tab--active' : ''}`}
              onClick={() => handleTabChange('read')}
            >
              Okunmuş ({readCount})
            </button>
            <button
              className={`tab ${activeTab === 'all' ? 'tab--active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              Tümü ({messages.length})
            </button>
          </div>
          <div className="tabs-actions">
            {activeTab === 'unread' && unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Hepsini Okundu Say
              </button>
            )}
            {activeTab === 'read' && readCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Hepsini Okundu Say
              </button>
            )}
            {activeTab === 'all' && messages.length > 0 && (
              <button
                className="delete-all-btn"
                onClick={openDeleteConfirmModal}
              >
                Hepsini Sil
              </button>
            )}
            <button onClick={exportToExcel} className="export-btn export-excel">
              Excel İndir
            </button>
          </div>
        </div>

        <div className={`messages-list ${isTransitioning ? 'messages-list--transitioning' : ''}`}>
          {filteredMessages.length === 0 ? (
            <div className="no-messages">
              {activeTab === 'unread' ? 'Okunmamış mesaj yok' :
                activeTab === 'read' ? 'Okunmuş mesaj yok' :
                  'Henüz mesaj yok'}
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`message-card ${!message.is_read ? 'message-card--unread' : ''}`}
                onClick={() => openModal(message)}
                style={{ cursor: 'pointer' }}
              >
                <div className="message-header">
                  <h3>{highlightSearchTerm(message.name, searchTerm)}</h3>
                  <div className="message-header-right">
                    <span className="message-date">
                      {new Date(message.created_at).toLocaleDateString('tr-TR')} - {new Date(message.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="message-email">{highlightSearchTerm(message.email, searchTerm)}</div>
                <div className="message-content-wrapper">
                  <div className="message-content">
                    {highlightSearchTerm(message.message.split(' ').slice(0, 6).join(' '), searchTerm)}
                    {message.message.split(' ').length > 6 && '...'}
                  </div>
                  <div className="message-actions" onClick={(e) => e.stopPropagation()}>
                    {!message.is_read && (
                      <button
                        className="mark-read-btn"
                        onClick={() => markAsRead(message.id)}
                      >
                        Okundu İşaretle
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => deleteMessage(message.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedMessage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMessage.name}{getTurkishSuffix(selectedMessage.name)}</h3>
              <button className="modal-close" onClick={closeModal}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-email-date">
                <div className="modal-email">{highlightSearchTerm(selectedMessage.email, searchTerm)}</div>
                <div className="modal-date">
                  {new Date(selectedMessage.created_at).toLocaleDateString('tr-TR')} - {new Date(selectedMessage.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="modal-message">
                {highlightSearchTerm(selectedMessage.message, searchTerm)}
              </div>
            </div>
            <div className="modal-actions">
              {!selectedMessage.is_read && (
                <button
                  className="mark-read-btn"
                  onClick={() => {
                    markAsRead(selectedMessage.id)
                    closeModal()
                  }}
                >
                  Okundu İşaretle
                </button>
              )}
              <button
                className="delete-btn"
                onClick={() => {
                  deleteMessage(selectedMessage.id)
                  closeModal()
                }}
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="modal-overlay" onClick={cancelDeleteAll}>
          <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚠️ Tüm Mesajları Sil</h3>
              <button className="modal-close" onClick={cancelDeleteAll}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <p><strong>Tüm mesajları silmek istediğinizden emin misiniz?</strong></p>
                <p>Bu işlem geri alınamaz ve <strong>{messages.length} mesaj</strong> kalıcı olarak silinecektir.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={cancelDeleteAll}
              >
                İptal
              </button>
              <button
                className="confirm-delete-btn"
                onClick={confirmDeleteAll}
              >
                Evet, Hepsini Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={closeSettingsModal}>
          <div className="admin-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>⚙️ Admin Ayarları</h3>
              <button className="admin-modal-close" onClick={closeSettingsModal}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-content">
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
                          <span className="status-dot active"></span>
                          <span>2FA Aktif</span>
                        </div>
                        <p className="twofa-description">
                          Hesabınızı daha güvenli hale getirmek için 2FA'yı etkinleştirin.
                        </p>
                      </div>
                      <div className="twofa-actions">
                        <button className="twofa-btn enable-btn">
                          📱 2FA'yı Etkinleştir
                        </button>
                        <button className="twofa-btn disable-btn">
                          ❌ 2FA'yı Devre Dışı Bırak
                        </button>
                      </div>
                      <div className="twofa-qr">
                        <p>QR Kodu tarayarak 2FA'yı etkinleştirin:</p>
                        <div className="qr-placeholder">
                          <div className="qr-code">📱 QR KOD</div>
                        </div>
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


      {/* 2FA Login Modal */}
      {showTwoFactorLogin && (
        <div className="modal-overlay">
          <div className="modal two-factor-login-modal">
            <div className="modal-header">
              <h3>🔐 2FA Doğrulaması</h3>
            </div>
            <div className="modal-content">
              <div className="two-factor-login">
                <p>Google Authenticator uygulamasından 6 haneli kodu girin:</p>
                <input
                  type="text"
                  value={loginTwoFactorCode}
                  onChange={(e) => setLoginTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                  className="two-factor-input"
                />
                <button
                  className="verify-login-2fa-btn"
                  onClick={verifyLoginTwoFactor}
                >
                  Doğrula ve Giriş Yap
                </button>

                {loginError && (
                  <div className="error-message">{loginError}</div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowTwoFactorLogin(false)
                  setLoginTwoFactorCode('')
                  setLoginError('')
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Admin
