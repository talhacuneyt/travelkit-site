import { useState } from 'react'
import emailjs from '@emailjs/browser'
import './index.css'
import { useTranslation } from '../../hooks/useTranslation'
import { supabase, CONTACT_EMAILJS_CONFIG } from '../../lib/supabase'
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

    // Veritabanına kaydet (eğer Supabase yapılandırılmışsa)
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .insert([
            {
              name: name,
              email: email,
              message: message,
              created_at: new Date().toISOString()
            }
          ])
        
        if (error) {
          console.error('Veritabanı hatası:', error)
        } else {
          console.log('Mesaj veritabanına kaydedildi:', data)
        }
      } catch (dbError) {
        console.error('Veritabanı bağlantı hatası:', dbError)
      }
    } else {
      console.log('Supabase yapılandırılmamış. Sadece mail gönderimi yapılıyor.')
    }

    const serviceId = (
      import.meta.env.VITE_EMAILJS_SERVICE_ID ||
      window.localStorage.getItem('EMAILJS_SERVICE_ID') ||
      ''
    ).trim()
    const templateId = (
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
      window.localStorage.getItem('EMAILJS_TEMPLATE_ID') ||
      ''
    ).trim()
    const publicKey = (
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY ||
      window.localStorage.getItem('EMAILJS_PUBLIC_KEY') ||
      ''
    ).trim()

    const web3formsKey = (
      import.meta.env.VITE_W3F_ACCESS_KEY ||
      window.localStorage.getItem('W3F_ACCESS_KEY') ||
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890' // Geçici test key - gerçek key ile değiştirin
    ).trim()

    async function sendWithSimpleAPI() {
      try {
        // EmailJS'i direkt kullan (hardcoded keys)
        const serviceId = CONTACT_EMAILJS_CONFIG.serviceId
        const templateId = CONTACT_EMAILJS_CONFIG.templateId
        const publicKey = CONTACT_EMAILJS_CONFIG.publicKey
        
        const templateParams = {
          from_name: name,
          from_email: email,
          message: message,
          to_name: 'TravelKit',
          reply_to: email
        }

        console.log('EmailJS gönderim deneniyor...', { serviceId, templateId, publicKey, templateParams })

        const result = await emailjs.send(serviceId, templateId, templateParams, publicKey)
        
        console.log('EmailJS sonucu:', result)
        
        if (result.status === 200) {
          setToast({ message: 'Mesajınız başarıyla gönderildi!', type: 'success' })
          form.reset()
        } else {
          throw new Error(`EmailJS gönderim hatası: ${result.status}`)
        }
      } catch (error) {
        console.error('EmailJS error:', error)
        
        // EmailJS başarısız olursa Web3Forms'u dene
        if (web3formsKey && web3formsKey !== 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') {
          console.log('EmailJS başarısız, Web3Forms deneniyor...')
          await sendWithWeb3Forms()
        } else {
          // Son çare: hata mesajı göster
          setToast({ 
            message: 'Mail gönderimi başarısız. Lütfen tekrar deneyin veya WhatsApp üzerinden iletişime geçin.', 
            type: 'error' 
          })
        }
      }
    }

    async function sendWithWeb3Forms() {
      if (!web3formsKey || web3formsKey === 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') {
        // Web3Forms key yoksa, basit bir API endpoint kullan
        await sendWithSimpleAPI()
        return
      }
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            access_key: web3formsKey,
            subject: 'TravelKit iletişim formu',
            from_name: name,
            email,
            message,
          })
        })
        const result = await response.json()
        if (result?.success) {
          setToast({ message: t('contact.success'), type: 'success' })
          form.reset()
        } else {
          console.error('Web3Forms hata:', result)
          setToast({ message: `Gönderim hatası: ${result?.message || 'Web3Forms başarısız'}`, type: 'error' })
        }
      } catch (webErr) {
        console.error('Web3Forms gönderimi sırasında hata:', webErr)
        setToast({ message: t('contact.error'), type: 'error' })
      }
    }

    // EmailJS ile direkt gönderim (Backend API deploy edilene kadar)
    if (serviceId && templateId && publicKey) {
      try {
        console.log('EmailJS ile gönderim deneniyor...')
        await emailjs.send(
          serviceId,
          templateId,
          {
            from_name: name,
            from_email: email,
            message: message,
            to_name: 'TravelKit',
            reply_to: email
          },
          { publicKey }
        )
        setToast({ message: 'Mesajınız başarıyla gönderildi!', type: 'success' })
        form.reset()
        console.log('EmailJS ile gönderim başarılı!')
        return
      } catch (err) {
        console.error('EmailJS hatası:', err)
        
        // EmailJS başarısız olursa Web3Forms'u dene
        if (web3formsKey && web3formsKey !== 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') {
          console.log('EmailJS başarısız, Web3Forms deneniyor...')
          await sendWithWeb3Forms()
        } else {
          setToast({ 
            message: 'Mail gönderimi başarısız. Lütfen WhatsApp üzerinden iletişime geçin.', 
            type: 'error' 
          })
        }
      }
    } else {
      // EmailJS yapılandırılmamışsa Web3Forms'u dene
      if (web3formsKey && web3formsKey !== 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') {
        console.log('EmailJS yapılandırılmamış, Web3Forms deneniyor...')
        await sendWithWeb3Forms()
      } else {
        setToast({ 
          message: 'Mail gönderimi başarısız. Lütfen WhatsApp üzerinden iletişime geçin.', 
          type: 'error' 
        })
      }
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