import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import { useState, useEffect } from 'react'
import DocumentTitle from '../../components/DocumentTitle'
import { getPackagePrice, logPriceChange } from '../../config/prices'
import './index.css'

function SatinAl() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  // URL'den paket bilgilerini al
  const searchParams = new URLSearchParams(location.search)
  const packageType = searchParams.get('package') || 'economic'

  // Paket verilerini state'de tut
  const [packageData, setPackageData] = useState(null)
  const [loading, setLoading] = useState(true)

  // API'den paket verilerini çek
  const getPackageData = async (packageType) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) {
        console.error('VITE_API_URL environment variable is not defined!');
        throw new Error('API URL is not configured.');
      }

      const response = await fetch(`${API_URL}/api/packages/${packageType}`);
      
      // Response'un JSON olup olmadığını kontrol et
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        return {
          title: data.data.title,
          description: data.data.description,
          price: `₺${data.data.price}`,
          sections: data.data.sections,
          items: data.data.items
        };
      } else {
        throw new Error(data.message || 'Paket verisi alınamadı');
      }
    } catch (error) {
      console.error('API error, falling back to localStorage:', error);
      
      // API hatası durumunda localStorage'dan kaydedilmiş veriyi kontrol et
      const savedPackage = localStorage.getItem(`package_${packageType}`)
      if (savedPackage) {
        try {
          return JSON.parse(savedPackage)
        } catch (parseError) {
          console.error('Error parsing saved package data:', parseError)
        }
      }
      
      // Son çare olarak hardcoded veriyi döndür
      const fallbackPackages = {
        economic: {
          title: 'Ekonomik',
          description: 'Seyahate zahmetsiz ve eksiksiz bir başlangıç yapmak isteyenler için, akıllı ve şık bir çözüm.',
          price: getPackagePrice('economic'), // Merkezi config'den fiyat al
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
          description: 'Seyahatlerinde sadece işlevselliği değil, konforu da önemseyenler için özenle hazırlandı.',
          price: getPackagePrice('comfort'), // Merkezi config'den fiyat al
          sections: {
            personalCare: 'Kişisel Bakım Ürünleri',
            comfort: 'Konfor',
            technology: 'Teknoloji',
            health: 'Sağlık / İlk Yardım',
            additions: 'Konforlu Paket Eklemeleri'
          },
          items: {
            personalCare: [
              'Diş Fırçası & Macun', 'Şampuan & Duş Jeli', 'Deodorant', 'Güneş Kremi',
              'El Kremi', 'Islak Mendil', 'Mikrofiber Havlu', 'Çamaşır Torbası', 'Dezenfektan'
            ],
            comfort: ['Kulak Tıkacı', 'Göz Bandı', 'Seyahat Defteri & Kalem', 'Boyun Yastığı', 'Seyahat Terliği'],
            technology: ['Powerbank', 'Çoklu Fonksiyonlu Kablo', 'Bluetooth Kulaklık'],
            health: [
              'Ağrı Kesici', 'Basit Alerji İlacı', 'Yara Bandı', 'Antiseptik Krem',
              'Burun Spreyi', 'Maske', 'Sineksavar'
            ],
            additions: [
              'Bavul İçi Düzenleyici', 'QR Kart, müzik listesi', 'Lavanta kesesi', 'Seyahat Yastığı'
            ]
          }
        },
        lux: {
          title: 'Lux',
          description: 'En lüks seyahat deneyimi için özel olarak seçilmiş premium malzemeler.',
          price: getPackagePrice('luxury'), // Merkezi config'den fiyat al
          sections: {
            personalCare: 'Kişisel Bakım Ürünleri',
            comfort: 'Konfor',
            technology: 'Teknoloji',
            health: 'Sağlık / İlk Yardım',
            additions: 'Lux Paket Eklemeleri'
          },
          items: {
            personalCare: [
              'Diş Fırçası & Macun', 'Şampuan & Duş Jeli', 'Deodorant', 'Güneş Kremi',
              'El Kremi', 'Islak Mendil', 'Mikrofiber Havlu', 'Çamaşır Torbası', 'Dezenfektan'
            ],
            comfort: ['Kulak Tıkacı', 'Göz Bandı', 'Seyahat Defteri & Kalem', 'Boyun Yastığı', 'Seyahat Terliği', 'Premium Seyahat Yastığı'],
            technology: ['Powerbank', 'Çoklu Fonksiyonlu Kablo', 'Bluetooth Kulaklık', 'Seyahat Adaptörü'],
            health: [
              'Ağrı Kesici', 'Basit Alerji İlacı', 'Yara Bandı', 'Antiseptik Krem',
              'Burun Spreyi', 'Maske', 'Sineksavar'
            ],
            additions: [
              'Bavul İçi Düzenleyici', 'QR Kart, müzik listesi', 'Lavanta kesesi', 'Premium Seyahat Yastığı', 'VIP Çanta'
            ]
          }
        }
      };
      
      return fallbackPackages[packageType] || null;
    }
  }

  // Paket verilerini yükle
  useEffect(() => {
    const loadPackageData = async () => {
      setLoading(true)
      try {
        const data = await getPackageData(packageType)
        setPackageData(data)
      } catch (error) {
        console.error('Paket verisi yüklenirken hata:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPackageData()
  }, [packageType])

  const packageTitle = packageData?.title || t(`packages.${packageType}.title`)
  const packagePriceString = packageData?.price || t(`packages.${packageType}.price`)
  // Price string'den sayıya çevir (₺299 -> 299)
  const packagePrice = parseFloat(packagePriceString.replace(/[^\d.]/g, ''))

  // Success state (WhatsApp yönlendirmesi için)
  const [isSuccess, setIsSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [orderNumber, setOrderNumber] = useState('')

  // URL parametrelerini kontrol et (WhatsApp yönlendirmesi sonrası)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const whatsapp = urlParams.get('whatsapp')

    if (whatsapp === 'true') {
      // WhatsApp'a yönlendirildikten sonra başarı sayfası göster
      const orderNum = `TK${Date.now().toString().slice(-6)}`
      setOrderNumber(orderNum)
      setIsSuccess(true)
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



  const handleContact = () => {
    const message = encodeURIComponent(
      `Merhaba! TravelKit'ten ${packageTitle} paketini satın almak istiyorum.\n\n` +
      `📦 Paket: ${packageTitle}\n` +
      `💰 Fiyat: ${packagePriceString}\n` +
      `📋 Açıklama: ${packageData?.description || t(`packages.${packageType}.description`)}\n\n` +
      `Lütfen bana detaylı bilgi verin ve sipariş sürecini başlatalım.`
    )
    // WhatsApp'a yönlendir (Türkiye numarası formatı)
    window.open(`https://wa.me/905551234567?text=${message}`, '_blank')
  }

  if (isSuccess) {
    return (
      <>
        <DocumentTitle title="Siparişiniz Alındı - TravelKit" />
        <main className="satin-al-success">
          <div className="satin-al-success-container">
            <div className="satin-al-success-icon">✓</div>
            <h1 className="satin-al-success__title">WhatsApp'a Yönlendirildiniz!</h1>
            <p className="satin-al-success__subtitle">
              {packageTitle} paketi için WhatsApp üzerinden sipariş verme süreciniz başlatıldı.
              WhatsApp'ta mesajınızı gönderin, en kısa sürede size dönüş yapacağız.
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

  // Loading state
  if (loading) {
    return (
      <>
        <DocumentTitle title="Yükleniyor - TravelKit" />
        <main className="satin-al">
          <div className="satin-al__container">
            <div className="satin-al__content">
              <div className="satin-al__package-info">
                <h2 className="satin-al__package-title">Yükleniyor...</h2>
                <p className="satin-al__package-desc">Paket bilgileri getiriliyor...</p>
              </div>
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


          <div className="satin-al__content">
            <div className="satin-al__package-info">
              <h2 className="satin-al__package-title">{packageTitle} Paket</h2>
              <div className="satin-al__package-price">{packagePriceString}</div>
              <p className="satin-al__package-desc">
                {packageData?.description || t(`packages.${packageType}.description`)}
              </p>
            </div>

            <div className="satin-al__purchase-options">
              <h3 className="satin-al__options-title">Satın Alma Seçenekleri</h3>

              <div className="satin-al__option">
                <div className="satin-al__option-header">
                  <h4>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '10px', verticalAlign: 'middle'}} strokeWidth="1.5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    WhatsApp ile Sipariş Ver
                  </h4>
                </div>
                <p>
                  WhatsApp üzerinden hızlı ve kolay sipariş verebilirsiniz.
                  Paket detaylarınızı paylaşın, size özel fiyat teklifi alın.
                </p>
                <button
                  onClick={handleContact}
                  className="satin-al__option-btn satin-al__option-btn--whatsapp"
                >
                  WhatsApp ile Sipariş Ver
                </button>
              </div>

              <div className="satin-al__option">
                <div className="satin-al__option-header">
                  <h4>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '10px', verticalAlign: 'middle'}} strokeWidth="1.5">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    E-posta ile İletişime Geç
                  </h4>
                </div>
                <p>
                  Detaylı bilgi almak için e-posta gönderebilirsiniz.
                  En kısa sürede size dönüş yapacağız.
                </p>
                <button
                  onClick={() => window.location.href = '/iletisim'}
                  className="satin-al__option-btn satin-al__option-btn--email"
                >
                  E-posta ile İletişime Geç
                </button>
              </div>

              <div className="satin-al__option">
                <div className="satin-al__option-header">
                  <h4>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '10px', verticalAlign: 'middle'}} strokeWidth="1.5">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    Telefon ile Arayın
                  </h4>
                </div>
                <p>
                  Hemen arayıp detaylı bilgi alabilir ve sipariş verebilirsiniz.
                  Çalışma saatleri: 09:00 - 18:00
                </p>
                <button
                  onClick={() => window.location.href = 'tel:+905551234567'}
                  className="satin-al__option-btn satin-al__option-btn--phone"
                >
                  Telefon ile Arayın
                </button>
              </div>
            </div>

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

