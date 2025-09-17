import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { EMAILJS_CONFIG } from '../../lib/emailjs'
import emailjs from '@emailjs/browser'
import { SignJWT, jwtVerify } from 'jose'
import Footer from '../../components/footer'
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


  // JWT Secret (production'da environment variable kullanılmalı)
  const JWT_SECRET = new TextEncoder().encode(import.meta.env.VITE_JWT_SECRET || 'fallback-secret-key')


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

    // Eski session sistemini temizle
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session_timestamp')

    // Navbar'ı güncellemek için custom event gönder
    window.dispatchEvent(new CustomEvent('adminLogin', {
      detail: { isAuthenticated: true }
    }))

    fetchMessages()
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
          } else {
            // Geçersiz token - tüm verileri temizle
            console.log('❌ Geçersiz JWT token, login sayfasına yönlendiriliyor')
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_session')
            localStorage.removeItem('admin_session_timestamp')
            localStorage.removeItem('admin_login_attempts')
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
          localStorage.removeItem('admin_remember_me')
          setIsAuthenticated(false)
        }
      } else {
        // Token yok - login sayfası göster
        setIsAuthenticated(false)
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

    // Backend'deki failed attempts'ı da sıfırla
    const resetBackendAttempts = async () => {
      try {
        await fetch('/api/auth/reset-attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: 'admin' })
        })
      } catch (error) {
        console.log('Failed to reset backend attempts:', error)
      }
    }

    resetBackendAttempts()

    // Beni hatırla özelliği güvenlik nedeniyle kaldırıldı
    // Eski kayıtlı bilgileri temizle
    localStorage.removeItem('admin_remember_me')

  }, []) // Dependency array'i boş bıraktık

  // fetchMessages fonksiyonunu buraya taşıdık
  const fetchMessages = useCallback(async () => {
    try {
      // Mesajlar çekiliyor

      // Backend API'den mesajları çek (proxy üzerinden)
      const response = await fetch('/api/messages')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Backend artık direkt array döndürüyor, success wrapper yok
      if (Array.isArray(data)) {
        // localStorage'dan okunmuş mesajları al
        const readMessages = JSON.parse(localStorage.getItem('read_messages') || '[]')

        // Her mesaj için okunmuş durumunu kontrol et
        const messagesWithReadStatus = data.map(msg => ({
          ...msg,
          is_read: msg.is_read || readMessages.includes(msg.id) || false
        }))

        // Mesajlar yüklendi
        setMessages(messagesWithReadStatus)
      } else {
        console.error('❌ Mesaj yükleme hatası: Beklenmeyen veri formatı')
        console.error('❌ Gelen veri:', data)
        setMessages([])
      }
    } catch (error) {
      console.error('❌ Mesaj yükleme hatası:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })

      // Fallback olarak mock data kullan
      const mockMessages = [
        {
          id: 1,
          name: 'Test Kullanıcı',
          email: 'test@example.com',
          message: 'Bu bir test mesajıdır.',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Demo Kullanıcı',
          email: 'demo@example.com',
          message: 'Demo mesajı - Backend bağlantısı yok.',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]

      const readMessages = JSON.parse(localStorage.getItem('read_messages') || '[]')
      const messagesWithReadStatus = mockMessages.map(msg => ({
        ...msg,
        is_read: msg.is_read || readMessages.includes(msg.id) || false
      }))

      setMessages(messagesWithReadStatus)
    } finally {
      setLoading(false)
    }
  }, [])

  // Ayrı bir useEffect ile fetchMessages'ı çağır
  useEffect(() => {
    if (isAuthenticated) {
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


    try {
      setLoginError('')

      // Backend API'sine login isteği gönder (proxy üzerinden)
      const response = await fetch('/api/auth/login', {
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


        // Backend'den gelen token ile doğrudan giriş yap
        setIsAuthenticated(true)
        setLoginError('')
        setUsername('')
        setPassword('')

        // Navbar'ı güncellemek için custom event gönder
        window.dispatchEvent(new CustomEvent('adminLogin', {
          detail: { isAuthenticated: true }
        }))

        fetchMessages()

        // Admin girişi başarılı
      } else {
        // Hatalı giriş
        setLoginError(data.message)
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('❌ Sunucu hatası. Lütfen tekrar deneyin.')
    }
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

    // Tüm admin verilerini temizle
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_session')
    localStorage.removeItem('admin_session_timestamp')
    localStorage.removeItem('admin_login_attempts')
    localStorage.removeItem('admin__enabled')
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

  async function deleteMessage(id) {
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== id))
        console.log('Mesaj başarıyla silindi')
      } else {
        console.error('Mesaj silinirken hata:', await response.text())
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

    // Veritabanını güncelle
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true })
      })

      if (response.ok) {
        console.log('Veritabanı başarıyla güncellendi')
      } else {
        console.error('Veritabanı güncelleme hatası:', await response.text())
      }
    } catch (err) {
      console.error('Veritabanı güncelleme hatası:', err)
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

  }

  function openDeleteConfirmModal() {
    if (messages.length === 0) {
      return
    }
    setShowDeleteConfirmModal(true)
  }

  async function confirmDeleteAll() {
    try {
      // API endpoint'i ile tüm mesajları sil
      const response = await fetch('/api/messages/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setMessages([])
        // localStorage'daki okunmuş mesajları da temizle
        localStorage.removeItem('read_messages')
        console.log('Tüm mesajlar başarıyla silindi')
      } else {
        console.error('Tüm mesajlar silinirken hata:', await response.text())
        alert('Mesajlar silinirken bir hata oluştu!')
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

          {!isAuthenticated && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Kullanıcı Adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="username-input"
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
                />
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
              <button type="submit" className="login-btn">
                Giriş Yap
              </button>
            </form>
          )}

        </div>
      </div>
    )
  }


  return (
    <div className="admin-container">
      <div className="admin-content-wrapper">
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

      <div className="admin-main-content">
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
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ width: '30px', height: '30px' }}>
                  <path d="M18 6L6 18M6 6l12 12" stroke="#111111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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
                              tabIndex={1}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              tabIndex={-1}
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
                              tabIndex={2}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              tabIndex={-1}
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
                              tabIndex={3}
                            />
                            <button
                              type="button"
                              className="password-toggle-btn"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? "🙈" : "👁️"}
                            </button>
                          </div>
                        </div>
                        {passwordError && <div className="error-message">{passwordError}</div>}
                        {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
                        <button type="submit" className="change-password-btn" tabIndex={4}>
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
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Admin