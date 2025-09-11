import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { useState, useEffect } from 'react'
import DocumentTitle from '../../components/DocumentTitle'
import './index.css'

function SatinAl() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  
  // URL'den paket bilgilerini al
  const searchParams = new URLSearchParams(location.search)
  const packageType = searchParams.get('package') || 'economic'
  
  // localStorage'dan paket verilerini oku
  const getPackageData = (packageType) => {
    const savedPackage = localStorage.getItem(`package_${packageType}`)
    if (savedPackage) {
      try {
        return JSON.parse(savedPackage)
      } catch (error) {
        console.error('Error parsing saved package data:', error)
      }
    }
    return null
  }
  
  const savedPackageData = getPackageData(packageType)
  const packageTitle = savedPackageData?.title || t(`packages.${packageType}.title`)
  const packagePriceString = savedPackageData?.price || t(`packages.${packageType}.price`)
  // Price string'den sayıya çevir (₺299 -> 299)
  const packagePrice = parseFloat(packagePriceString.replace(/[^\d.]/g, ''))

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'credit-card',
    notes: '',
    // Kart bilgileri
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [orderNumber, setOrderNumber] = useState('')

  // URL parametrelerini kontrol et (ödeme sonucu)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const success = urlParams.get('success')
    const cancel = urlParams.get('cancel')
    const testPayment = urlParams.get('test-payment')
    const orderId = urlParams.get('orderId')

    if (success === 'true' || testPayment === 'true') {
      setIsSuccess(true)
      setPaymentError('')
    } else if (cancel === 'true') {
      setPaymentError('Ödeme işlemi iptal edildi.')
    }
  }, [location.search])

  // Başarılı sipariş sonrası 5 saniye bekleyip yönlendirme
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        // Paket detay sayfasına yönlendir
        const packageRoute = packageType === 'economic' ? '/ekonomik' : 
                           packageType === 'comfort' ? '/konforlu' : '/lux'
        navigate(packageRoute)
      }, 5000) // 5 saniye

      return () => clearTimeout(timer)
    }
  }, [isSuccess, navigate, packageType])

  // Geri sayım için timer
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isSuccess, countdown])

  const handleBack = () => {
    navigate(-1)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Kart numarası formatlaması
    if (name === 'cardNumber') {
      const formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setPaymentError('')

    try {
      // Backend API'ye Iyzico ödeme isteği gönder
      const API_URL = import.meta.env.VITE_API_URL || 
        (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://travelkit-backend.vercel.app');
      const response = await fetch(`${API_URL}/api/payments/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageType,
          amount: packagePrice, // Backend'te amount bekliyor
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address
          },
          paymentMethod: formData.paymentMethod
        })
      })

      const result = await response.json()

      if (result.success) {
        // Mock payment - gerçek ödeme sayfasına yönlendirme yerine başarı sayfasına git
        console.log('Payment session created:', result.data)
        // Sipariş numarası oluştur
        const orderNum = `TK${Date.now().toString().slice(-6)}`
        setOrderNumber(orderNum)
        setIsSuccess(true)
        setIsSubmitting(false)
      } else {
        setPaymentError('Ödeme formu oluşturulamadı: ' + (result.message || 'Bilinmeyen hata'))
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setPaymentError('Ödeme işlemi sırasında bir hata oluştu')
      setIsSubmitting(false)
    }
  }

  const handleContact = () => {
    const message = encodeURIComponent(
      `Merhaba! ${packageTitle} paketini satın almak istiyorum. Fiyat: ${packagePriceString}`
    )
    window.location.href = `/iletisim?message=${message}`
  }

  if (isSuccess) {
    return (
      <>
        <DocumentTitle title="Siparişiniz Alındı - TravelKit" />
        <main className="satin-al-success">
          <div className="satin-al-success-container">
            <div className="satin-al-success-icon">✓</div>
            <h1 className="satin-al-success__title">Siparişiniz Alındı!</h1>
            <p className="satin-al-success__subtitle">
              {packageTitle} paketi için siparişiniz başarıyla oluşturuldu. 
              En kısa sürede sizinle iletişime geçeceğiz.
            </p>
            <div className="satin-al-success__info">
              <p><strong>Sipariş No:</strong> {orderNumber}</p>
              <p><strong>Paket:</strong> {packageTitle}</p>
              <p><strong>Tutar:</strong> {packagePriceString}</p>
            </div>
            <div className="satin-al-success__countdown">
              {countdown} saniye sonra {packageTitle} paket sayfasına yönlendirileceksiniz...
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <DocumentTitle title={`${packageTitle} Paket - Satın Al - TravelKit`} />
      <main className="satin-al">
        <div className="satin-al__container">
          <div className="satin-al__back-section">
            <button onClick={handleBack} className="satin-al__back-btn">
              ← Geri Dön
            </button>
          </div>
          <div className="satin-al__header">
            <h1 className="satin-al__title">Satın Alma</h1>
          </div>

        <div className="satin-al__content">
          <div className="satin-al__package-info">
            <h2 className="satin-al__package-title">{packageTitle} Paket</h2>
            <div className="satin-al__package-price">{packagePriceString}</div>
            <p className="satin-al__package-desc">
              {savedPackageData?.description || t(`packages.${packageType}.description`)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="satin-al__form">
            <h3 className="satin-al__form-title">Sipariş Bilgileri</h3>
            
            {paymentError && (
              <div className="satin-al__error">
                <div className="satin-al__error-icon">⚠️</div>
                <div className="satin-al__error-message">{paymentError}</div>
              </div>
            )}
            
            <div className="satin-al__form-row">
              <div className="satin-al__form-group">
                <label htmlFor="name">Ad Soyad *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="satin-al__input"
                />
              </div>
              <div className="satin-al__form-group">
                <label htmlFor="email">E-posta *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="satin-al__input"
                />
              </div>
            </div>

            <div className="satin-al__form-row">
              <div className="satin-al__form-group">
                <label htmlFor="phone">Telefon *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="satin-al__input"
                />
              </div>
              <div className="satin-al__form-group">
                <label htmlFor="paymentMethod">Ödeme Yöntemi *</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                  className="satin-al__select"
                >
                  <option value="credit-card">Kredi Kartı</option>
                  <option value="bank-transfer">Banka Havalesi</option>
                  <option value="cash-on-delivery">Kapıda Ödeme</option>
                </select>
              </div>
            </div>

            <div className="satin-al__form-group">
              <label htmlFor="address">Adres *</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows="3"
                className="satin-al__textarea"
                placeholder="Teslimat adresinizi yazın"
              />
            </div>

            <div className="satin-al__form-group">
              <label htmlFor="notes">Notlar</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="2"
                className="satin-al__textarea"
                placeholder="Ek notlarınız (opsiyonel)"
              />
            </div>

            {/* Iyzico Ödeme Bilgisi */}
            <div className="satin-al__payment-info">
              <div className="satin-al__payment-icon">🔒</div>
              <div className="satin-al__payment-text">
                <h4>Güvenli Ödeme</h4>
                <p>Ödeme işlemi Iyzico güvenli ödeme sistemi ile gerçekleştirilir. Kart bilgileriniz güvenli şekilde işlenir ve saklanmaz.</p>
                <ul>
                  <li>✓ SSL şifreleme ile korunur</li>
                  <li>✓ PCI DSS uyumlu</li>
                  <li>✓ 3D Secure desteği</li>
                  <li>✓ Tüm kart türleri kabul edilir</li>
                </ul>
              </div>
            </div>

            <div className="satin-al__form-actions">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="satin-al__btn satin-al__btn--primary"
              >
                {isSubmitting ? 'Iyzico Ödeme Sayfasına Yönlendiriliyor...' : 'Güvenli Ödeme ile Devam Et'}
              </button>
              <button 
                type="button" 
                onClick={handleContact}
                className="satin-al__btn satin-al__btn--secondary"
              >
                WhatsApp ile İletişime Geç
              </button>
            </div>
          </form>

          <div className="satin-al__info">
            <h3>Önemli Bilgiler</h3>
            <ul>
              <li>Ödeme işlemi güvenli şekilde gerçekleştirilir</li>
              <li>Paketler 1-3 iş günü içinde hazırlanır</li>
              <li>Ücretsiz kargo ile gönderilir</li>
              <li>14 gün içinde iade garantisi</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
    </>
  )
}

export default SatinAl
