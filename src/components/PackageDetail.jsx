import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import LazyImg from './LazyImg'

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

// Two-row infinite, opposing-direction slider (JS-driven widths to ensure 4-5 visible)
const TwoRowInfiniteSlider = ({ images }) => {
  const [itemsPerView, setItemsPerView] = useState(5)
  const [itemWidth, setItemWidth] = useState(0)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w <= 560) setItemsPerView(2)
      else if (w <= 768) setItemsPerView(3)
      else if (w <= 1200) setItemsPerView(4)
      else setItemsPerView(4)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const measure = () => {
      const viewport = document.querySelector('.two-row-slider__viewport')
      if (!viewport) return
      const gap = 15
      const width = viewport.clientWidth
      const totalGaps = (itemsPerView - 1) * gap
      const w = Math.max(0, Math.floor((width - totalGaps) / itemsPerView))
      setItemWidth(w)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [itemsPerView])

  const useMarquee = (selector, direction = 1) => {
    useEffect(() => {
      const track = document.querySelector(selector)
      if (!track) return
      let rafId
      let offset = 0
      const speed = 30
      const step = (ts) => {
        if (!track._lastTs) track._lastTs = ts
        const dt = (ts - track._lastTs) / 1000
        track._lastTs = ts
        offset += direction * speed * dt
        track.style.transform = `translateX(${-offset}px)`
        const first = track.firstElementChild
        if (first) {
          const threshold = (first.clientWidth + 15)
          if (offset >= threshold) {
            track.appendChild(first)
            offset -= threshold
            track.style.transform = `translateX(${-offset}px)`
          } else if (offset <= -threshold) {
            track.insertBefore(track.lastElementChild, track.firstElementChild)
            offset += threshold
            track.style.transform = `translateX(${-offset}px)`
          }
        }
        rafId = requestAnimationFrame(step)
      }
      rafId = requestAnimationFrame(step)
      return () => cancelAnimationFrame(rafId)
    }, [itemWidth])
  }

  useMarquee('.two-row-slider__track--top', +1)
  useMarquee('.two-row-slider__track--bottom', -1)

  const Row = ({ className }) => {
    const [showDuplicates, setShowDuplicates] = useState(false)
    useEffect(() => {
      const id = setTimeout(() => setShowDuplicates(true), 800)
      return () => clearTimeout(id)
    }, [])
    return (
      <div className="two-row-slider__viewport" style={{ overflow: 'hidden', borderRadius: 12 }}>
        <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 15, willChange: 'transform' }}>
          {images.map((src, idx) => (
            <LazyImg key={`${className}-${idx}-a`} src={src} alt={`Lüks görsel ${idx + 1}`} style={{ width: itemWidth, height: 'clamp(140px, 22vw, 220px)', objectFit: 'cover', borderRadius: 12, flex: '0 0 auto' }} loading={idx < 2 ? 'eager' : 'lazy'} fetchpriority={idx === 0 ? 'high' : 'auto'} />
          ))}
          {showDuplicates && images.map((src, idx) => (
            <LazyImg key={`${className}-${idx}-b`} src={src} alt={`Lüks görsel ${idx + 1}`} style={{ width: itemWidth, height: 'clamp(140px, 22vw, 220px)', objectFit: 'cover', borderRadius: 12, flex: '0 0 auto' }} loading="lazy" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="two-row-slider" style={{ width: '100%', margin: '0 auto', maxWidth: 1200 }}>
      <Row className="two-row-slider__track two-row-slider__track--top" />
      <div style={{ height: 12 }} />
      <Row className="two-row-slider__track two-row-slider__track--bottom" />
    </div>
  )
}

// Single-row infinite slider: kesintisiz marquee, 4-5 görünür, kenarlarda kısmi ve blur
const SingleRowInfiniteSlider = ({ images, direction = 1, speed = 30, heightClamp = 'clamp(160px, 24vw, 260px)' }) => {
  const GAP = 24
  const [itemsPerView, setItemsPerView] = useState(5)
  const [itemWidth, setItemWidth] = useState(0)
  const viewportRef = useRef(null)
  const trackRef = useRef(null)

  // 3 kopya ama her kopyayı 1 görsel kaydırarak diz (yan yana duplicate önlemek için)
  const tiledImages = useMemo(() => {
    if (!images || images.length === 0) return []
    const n = images.length
    const tiles = 3
    const out = []
    for (let t = 0; t < tiles; t++) {
      for (let i = 0; i < n; i++) {
        out.push(images[(i + t) % n])
      }
    }
    return out
  }, [images])

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w <= 560) setItemsPerView(1)
      else if (w <= 768) setItemsPerView(2)
      else if (w <= 1200) setItemsPerView(3)
      else setItemsPerView(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current
      if (!viewport) return
      const width = viewport.clientWidth
      const totalGaps = (itemsPerView - 1) * GAP
      const w = Math.max(0, Math.floor((width - totalGaps) / itemsPerView))
      setItemWidth(w)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [itemsPerView])

  useEffect(() => {
    const track = trackRef.current
    if (!track || !images || images.length === 0) return
    let rafId
    let offset = 0

    const step = (ts) => {
      if (!track._lastTs) track._lastTs = ts
      const dt = (ts - track._lastTs) / 1000
      track._lastTs = ts
      const cycleWidth = images.length * (itemWidth + GAP)
      if (cycleWidth <= 0) {
        rafId = requestAnimationFrame(step)
        return
      }
      offset += direction * speed * dt
      const normalized = ((offset % cycleWidth) + cycleWidth) % cycleWidth
      track.style.transform = `translate3d(${-normalized}px, 0, 0)`
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [itemWidth, direction, speed, images])

  return (
    <div className="single-row-slider" style={{ width: '100%', margin: '0 auto', maxWidth: 1200 }}>
      <div ref={viewportRef} className="single-row-slider__viewport" style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
        <div ref={trackRef} className="single-row-slider__track" style={{ display: 'flex', alignItems: 'center', gap: GAP, willChange: 'transform' }}>
          {tiledImages.map((src, idx) => (
            <LazyImg key={`sr-${idx}`} src={src} alt={`Lüks görsel ${idx + 1}`} style={{ width: itemWidth, height: heightClamp, objectFit: 'cover', borderRadius: 12, flex: '0 0 auto' }} loading={idx < 2 ? 'eager' : 'lazy'} fetchpriority={idx === 0 ? 'high' : 'auto'} />
          ))}
        </div>

        {/* Edge blur overlays */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, pointerEvents: 'none', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', maskImage: 'linear-gradient(to right, black, transparent)', WebkitMaskImage: 'linear-gradient(to right, black, transparent)' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, pointerEvents: 'none', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', maskImage: 'linear-gradient(to left, black, transparent)', WebkitMaskImage: 'linear-gradient(to left, black, transparent)' }} />
      </div>
    </div>
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

  // Doğrudan hardcoded data kullan - basit çözüm
  const packageData = hardcodedData[packageType] || hardcodedData.economic

  // Luxury/Economic/Comfort görsellerini tanımla ve ilk render'da rastgele sırala
  const luxuryImages = [
    '/images/luxury/IMG_3918_48.jpg',
    '/images/luxury/IMG_3919_50.jpg',
    '/images/luxury/IMG_3921_50.jpg',
    '/images/luxury/IMG_3922_50.jpg',
    '/images/luxury/IMG_3923_50.jpg',
    '/images/luxury/IMG_3924_50.jpg',
    '/images/luxury/IMG_3928_50.jpg',
    '/images/luxury/IMG_3931_50.jpg',
    '/images/luxury/IMG_3937_50.jpg',
    '/images/luxury/IMG_3948_50.jpg',
    '/images/luxury/IMG_3950_50.jpg',
    '/images/luxury/IMG_3951_50.jpg',
    '/images/luxury/IMG_4010_50.jpg',
    '/images/luxury/kisiselbakim1_50.jpg',
    '/images/luxury/kisiselbakim2_50.jpg',
    '/images/luxury/kisiselbakim3_50.jpg',
    '/images/luxury/kisiselbakim4_50.jpg',
    '/images/luxury/kisiselbakim5_50.jpg'
  ]

  const shuffledLuxuryImages = useMemo(() => {
    const arr = luxuryImages.slice()
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }, [])

  const economicImages = [
    '/images/eko/IMG_3974.JPG',
    '/images/eko/IMG_3978.JPG',
    '/images/eko/IMG_3979.JPG',
    '/images/eko/IMG_3980.JPG',
    '/images/eko/IMG_3981.JPG',
    '/images/eko/IMG_3983.JPG',
    '/images/eko/IMG_3986.JPG'
  ]
  const shuffledEconomicImages = useMemo(() => {
    const arr = economicImages.slice()
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }, [])

  const comfortImages = [
    '/images/konfor/IMG_3974.JPG',
    '/images/konfor/IMG_3978.JPG',
    '/images/konfor/IMG_3997.JPG',
    '/images/konfor/IMG_3998.JPG',
    '/images/konfor/IMG_4000.JPG',
    '/images/konfor/IMG_4001.JPG',
    '/images/konfor/IMG_4003.JPG',
    '/images/konfor/IMG_4004.JPG',
    '/images/konfor/IMG_4005.JPG',
    '/images/konfor/IMG_4006.JPG',
    '/images/konfor/IMG_4007.JPG',
    '/images/konfor/IMG_4008.JPG',
    '/images/konfor/IMG_4010.JPG',
    '/images/konfor/IMG_4011.JPG',
    '/images/konfor/IMG_4012.JPG'
  ]
  const shuffledComfortImages = useMemo(() => {
    const arr = comfortImages.slice()
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }, [])

  // Üst ve alt slider için 9'ar görsel ayır
  const topImages = useMemo(() => shuffledLuxuryImages.slice(0, 9), [shuffledLuxuryImages])
  const bottomImages = useMemo(() => shuffledLuxuryImages.slice(9), [shuffledLuxuryImages])

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
        {packageType === 'luxury' && (
          <section className="paket__section" style={{ paddingTop: 0 }}>
            <div style={{ width: '100%', margin: '0 auto', maxWidth: 1200 }}>
              <SingleRowInfiniteSlider images={topImages} direction={+1} speed={28} />
              <div style={{ height: 20 }} />
              <SingleRowInfiniteSlider images={bottomImages} direction={-1} speed={32} />
            </div>
          </section>
        )}
        {packageType === 'economic' && (
          <section className="paket__section" style={{ paddingTop: 0 }}>
            <div style={{ width: '100%', margin: '0 auto', maxWidth: 1200 }}>
              <SingleRowInfiniteSlider images={shuffledEconomicImages.slice(0, Math.ceil(shuffledEconomicImages.length / 2))} direction={+1} speed={26} />
              <div style={{ height: 20 }} />
              <SingleRowInfiniteSlider images={shuffledEconomicImages.slice(Math.ceil(shuffledEconomicImages.length / 2))} direction={-1} speed={30} />
            </div>
          </section>
        )}
        {packageType === 'comfort' && (
          <section className="paket__section" style={{ paddingTop: 0 }}>
            <div style={{ width: '100%', margin: '0 auto', maxWidth: 1200 }}>
              <SingleRowInfiniteSlider images={shuffledComfortImages.slice(0, Math.ceil(shuffledComfortImages.length / 2))} direction={+1} speed={26} />
              <div style={{ height: 20 }} />
              <SingleRowInfiniteSlider images={shuffledComfortImages.slice(Math.ceil(shuffledComfortImages.length / 2))} direction={-1} speed={30} />
            </div>
          </section>
        )}
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
