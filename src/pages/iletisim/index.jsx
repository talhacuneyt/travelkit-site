import { useState } from 'react'
import './index.css'
import { useTranslation } from '../../hooks/useTranslation'
import Toast from '../../components/toast'

function Iletisim() {
  const { t } = useTranslation()
  const [toast, setToast] = useState({ message: '', type: 'success' })

  async function handleSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    const name = form.name?.value || ''
    const email = form.email?.value || ''
    const message = form.message?.value || ''

    try {
      // Backend API'sine POST isteği gönder
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message })
      })

      // Response kontrolü
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // JSON parse etmeden önce response'un boş olmadığını kontrol et
      const text = await response.text()
      if (!text) {
        throw new Error('Boş response alındı')
      }

      let result
      try {
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('JSON parse hatası:', parseError)
        throw new Error('Geçersiz response formatı')
      }

      if (result.success) {
        setToast({ message: '✅ Mesajınız gönderildi!', type: 'success' })
        form.reset()
      } else {
        setToast({ message: `❌ Gönderim başarısız: ${result.message || 'Bilinmeyen hata'}`, type: 'error' })
      }
    } catch (error) {
      console.error('Form gönderim hatası:', error)
      setToast({ message: `❌ Gönderim başarısız: ${error.message}`, type: 'error' })
    }
  }

  return (
    <main className="iletisim">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'success' })} 
      />
      <section className="iletisim-hero">
        <div className="iletisim-hero__inner">
          <h1 className="iletisim__title">{t('contact.title')}</h1>
          <p className="iletisim__subtitle">{t('contact.subtitle')}</p>
        </div>
      </section>

      <section className="iletisim-content">
        <div className="iletisim-form">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-fields">
              <div className="form-group">
                <input 
                  id="name" 
                  name="name" 
                  type="text" 
                  required 
                  className="form-input" 
                  placeholder={t('contact.form.name')} 
                />
              </div>
              
              <div className="form-group">
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  className="form-input" 
                  placeholder={t('contact.form.email')} 
                />
              </div>
              
              <div className="form-group">
                <textarea 
                  id="message" 
                  name="message" 
                  rows="6" 
                  required 
                  className="form-textarea" 
                  placeholder={t('contact.form.message')}
                />
              </div>
            </div>

            <button type="submit" className="form-submit">
              {t('contact.form.submit')}
            </button>
          </form>
        </div>


        <div className="iletisim-info">
          <div className="info-container">
            <div className="info-item">
              <h3>{t('contact.info.email')}</h3>
              <p>{t('contact.info.emailValue')}</p>
            </div>
            
            <div className="info-item">
              <h3>{t('contact.info.phone')}</h3>
              <p>{t('contact.info.phoneValue')}</p>
            </div>
            
            <div className="info-item">
              <h3>{t('contact.info.response')}</h3>
              <p>{t('contact.info.responseValue')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Section */}
      <section className="whatsapp-section">
        <div className="whatsapp-container">
          <div className="whatsapp-card">
            <div className="whatsapp-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.214-.361a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <div className="whatsapp-content">
              <h3 className="whatsapp-title">WhatsApp ile Hızlı İletişim</h3>
              <p className="whatsapp-description">Anında yanıt almak için WhatsApp üzerinden bize ulaşın. Sorularınızı hızlıca yanıtlayalım!</p>
              <a 
                href="https://wa.me/905529278937" 
                target="_blank" 
                rel="noopener noreferrer"
                className="whatsapp-button"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="whatsapp-btn-icon">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.214-.361a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp'ta Yaz
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Iletisim