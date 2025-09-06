import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { useState } from 'react'
import './index.css'

function SatinAl() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  
  // URL'den paket bilgilerini al
  const searchParams = new URLSearchParams(location.search)
  const packageType = searchParams.get('package') || 'economic'
  const packageTitle = t(`packages.${packageType}.title`)
  const packagePrice = t(`packages.${packageType}.price`)

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

    try {
      // Backend API'ye ödeme isteği gönder
      const response = await fetch('http://localhost:3001/api/payments/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageType,
          packageTitle: packageTitle,
          packagePrice: packagePrice,
          customerInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address
          },
          paymentMethod: formData.paymentMethod,
          cardInfo: formData.paymentMethod === 'credit-card' ? {
            cardNumber: formData.cardNumber,
            cardName: formData.cardName,
            expiryMonth: formData.expiryMonth,
            expiryYear: formData.expiryYear,
            cvv: formData.cvv
          } : null
        })
      })

      const result = await response.json()

      if (result.success) {
        // Ödeme sayfasına yönlendir
        window.location.href = result.paymentUrl
      } else {
        alert('Ödeme oturumu oluşturulamadı: ' + result.error)
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Ödeme işlemi sırasında bir hata oluştu')
      setIsSubmitting(false)
    }
  }

  const handleContact = () => {
    const message = encodeURIComponent(
      `Merhaba! ${packageTitle} paketini satın almak istiyorum. Fiyat: ${packagePrice}`
    )
    window.location.href = `/iletisim?message=${message}`
  }

  if (isSuccess) {
    return (
      <main className="satin-al">
        <div className="satin-al__container">
          <div className="satin-al__success">
            <div className="satin-al__success-icon">✓</div>
            <h1 className="satin-al__success-title">Siparişiniz Alındı!</h1>
            <p className="satin-al__success-desc">
              {packageTitle} paketi için siparişiniz başarıyla oluşturuldu. 
              En kısa sürede sizinle iletişime geçeceğiz.
            </p>
            <div className="satin-al__success-info">
              <p><strong>Sipariş No:</strong> #{Date.now().toString().slice(-6)}</p>
              <p><strong>Paket:</strong> {packageTitle}</p>
              <p><strong>Tutar:</strong> {packagePrice}</p>
            </div>
            <div className="satin-al__success-actions">
              <button onClick={handleBack} className="satin-al__btn satin-al__btn--primary">
                Ana Sayfaya Dön
              </button>
              <button onClick={() => window.location.href = '/iletisim'} className="satin-al__btn satin-al__btn--secondary">
                İletişime Geç
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="satin-al">
      <div className="satin-al__container">
        <div className="satin-al__header">
          <button onClick={handleBack} className="satin-al__back-btn">
            ← Geri Dön
          </button>
          <h1 className="satin-al__title">Satın Alma</h1>
        </div>

        <div className="satin-al__content">
          <div className="satin-al__package-info">
            <h2 className="satin-al__package-title">{packageTitle} Paket</h2>
            <div className="satin-al__package-price">{packagePrice}</div>
            <p className="satin-al__package-desc">
              {t(`packages.${packageType}.description`)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="satin-al__form">
            <h3 className="satin-al__form-title">Sipariş Bilgileri</h3>
            
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

            {/* Kart Bilgileri - Sadece kredi kartı seçildiğinde göster */}
            {formData.paymentMethod === 'credit-card' && (
              <div className="satin-al__card-section">
                <h4 className="satin-al__card-title">Kart Bilgileri</h4>
                
                <div className="satin-al__form-group">
                  <label htmlFor="cardNumber">Kart Numarası *</label>
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                    className="satin-al__input satin-al__input--card"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>

                <div className="satin-al__form-group">
                  <label htmlFor="cardName">Kart Üzerindeki İsim *</label>
                  <input
                    type="text"
                    id="cardName"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    required
                    className="satin-al__input"
                    placeholder="Ad Soyad"
                  />
                </div>

                <div className="satin-al__form-row">
                  <div className="satin-al__form-group">
                    <label htmlFor="expiryMonth">Son Kullanma Ay *</label>
                    <select
                      id="expiryMonth"
                      name="expiryMonth"
                      value={formData.expiryMonth}
                      onChange={handleInputChange}
                      required
                      className="satin-al__select"
                    >
                      <option value="">Ay</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {String(i + 1).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="satin-al__form-group">
                    <label htmlFor="expiryYear">Son Kullanma Yıl *</label>
                    <select
                      id="expiryYear"
                      name="expiryYear"
                      value={formData.expiryYear}
                      onChange={handleInputChange}
                      required
                      className="satin-al__select"
                    >
                      <option value="">Yıl</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="satin-al__form-group">
                    <label htmlFor="cvv">CVV *</label>
                    <input
                      type="text"
                      id="cvv"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      required
                      className="satin-al__input satin-al__input--cvv"
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                </div>
                
                <div className="satin-al__security-info">
                  Kart bilgileriniz güvenli şekilde şifrelenir ve saklanmaz.
                </div>
              </div>
            )}

            <div className="satin-al__form-actions">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="satin-al__btn satin-al__btn--primary"
              >
                {isSubmitting ? 'Sipariş Veriliyor...' : 'Siparişi Tamamla'}
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
  )
}

export default SatinAl
