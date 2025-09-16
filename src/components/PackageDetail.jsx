import { useEffect, useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'

// SVG icons as components
const PersonalCareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 3C9 7 6 9.5 6 13a6 6 0 0012 0c0-3.5-3-6-6-10z" stroke="currentColor" />
  </svg>
)

const ComfortIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" />
  </svg>
)

const TechnologyIcon = () => (

  <svg viewBox="0 0 24 24" fill="none">
    <rect x="4" y="6" width="16" height="10" rx="2" stroke="currentColor" />
    <path d="M2 18h20" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

const HealthIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M12 7v10M7 12h10" stroke="currentColor" />
  </svg>
)

const ArrowIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)


// Floating particles component
const FloatingParticles = () => (
  <div className="floating-particles">
    <div className="shape-1"></div>
    <div className="shape-2"></div>
    <div className="shape-3"></div>
  </div>
)

// Feature section component
const FeatureSection = ({ icon: Icon, sectionTitle, items, isEven = false }) => {
  return (
    <article className={`paket-feature ${isEven ? 'is-even' : ''}`}>
      <div className="paket-feature__icon" aria-hidden>
        <Icon />
      </div>
      <div className="paket-feature__body">
        <h3 className="paket__group-title">{sectionTitle}</h3>
        <div className="paket__chips">
          {items && items.length > 0 ? items.map((item, index) => (
            <span key={index} className="paket__chip">{item}</span>
          )) : (
            <span className="paket__chip">İçerik bulunamadı</span>
          )}
        </div>
      </div>
    </article>
  )
}

// Main package detail component
const PackageDetail = ({ packageType }) => {
  const { t } = useTranslation()


  // Hardcoded package data
  const hardcodedData = {
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
      description: 'Seyahatlerinde sadece işlevselliği değil, konforu da önemseyenler için özenle hazırlandı.',
      price: '₺599',
      sections: {
        personalCare: 'Kişisel Bakım Ürünleri',
        comfort: 'Konfor',
        technology: 'Teknoloji',
        health: 'Sağlık / İlk Yardım',
        additions: 'Konfor Paket Eklemeleri'
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

  // Doğrudan hardcoded data kullan - basit çözüm
  const packageData = hardcodedData[packageType] || hardcodedData.economic

  // Animation useEffect - must be before conditional returns
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')

            // Add staggered animation to chips
            if (entry.target.classList.contains('paket__chips')) {
              const chips = entry.target.querySelectorAll('.paket__chip')
              chips.forEach((chip, index) => {
                chip.style.setProperty('--chip-index', index)
                setTimeout(() => {
                  chip.style.opacity = '1'
                  chip.style.transform = 'translateY(0)'
                }, index * 100)
              })
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    const featureCards = document.querySelectorAll('.paket-feature')
    const chipsSections = document.querySelectorAll('.paket__chips')
    featureCards.forEach((card) => observer.observe(card))
    chipsSections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  // Handle purchase functionality
  const handlePurchase = (packageType) => {
    // Redirect to purchase page with package info
    window.location.href = `/satin-al?package=${packageType}`
  }


  // Feature sections configuration - güvenli erişim
  const featureSections = [
    {
      icon: PersonalCareIcon,
      sectionTitle: packageData?.sections?.personalCare || 'Kişisel Bakım',
      items: packageData?.items?.personalCare || [],
      isEven: false
    },
    {
      icon: ComfortIcon,
      sectionTitle: packageData?.sections?.comfort || 'Konfor',
      items: packageData?.items?.comfort || [],
      isEven: true
    },
    {
      icon: TechnologyIcon,
      sectionTitle: packageData?.sections?.technology || 'Teknoloji',
      items: packageData?.items?.technology || [],
      isEven: false
    },
    {
      icon: HealthIcon,
      sectionTitle: packageData?.sections?.health || 'Sağlık',
      items: packageData?.items?.health || [],
      isEven: true
    }
  ]

  return (
    <main className="paket">
      <section className="paket-hero">
        <FloatingParticles />
        <div className="paket-hero__inner">
          <h1 className="paket__title">{packageData?.title || 'Paket'}</h1>
          <p className="paket__description">{packageData?.description || 'Paket açıklaması'}</p>
        </div>
      </section>

      <div className="paket-layout">
        <div className="paket-content">
          <section className="paket__section">
            <div className="paket-features">
              {featureSections.map((feature, index) => (
                <FeatureSection
                  key={index}
                  icon={feature.icon}
                  sectionTitle={feature.sectionTitle}
                  items={feature.items}
                  isEven={feature.isEven}
                />
              ))}
            </div>
          </section>

          <section className="paket__section">
            <h2 className="paket__section-title">{packageData?.sections?.additions || 'Ek Paketler'}</h2>
            <div className="paket__chips">
              {(packageData?.items?.additions || []).map((item, index) => (
                <span key={index} className="paket__chip">{item}</span>
              ))}
            </div>
            <div className="paket__cta">
              <button
                className="paket__btn paket__btn--purchase"
                onClick={() => handlePurchase(packageType)}
              >
                <ArrowIcon />
                {t(`packages.${packageType}.purchase`)}
              </button>
              <a href="/iletisim" className="paket__btn paket__btn--contact">
                <ArrowIcon />
                {t(`packages.${packageType}.cta`)}
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default PackageDetail
