import ekonomikImg from '/images/ekonomik.png'
import ortaImg from '/images/orta.jpg'
import luxImg from '/images/lux.png'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import './index.css'

function HomeContent() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [previousTestimonial, setPreviousTestimonial] = useState(-1)
  
  // Refs for scroll animations
  const packagesRef = useRef(null)
  const packagesHeadingRef = useRef(null)
  const testimonialsRef = useRef(null)

  const packages = [
    { name: t('home.packages.economic.title'), img: ekonomikImg, key: 'economic' },
    { name: t('home.packages.comfort.title'), img: ortaImg, key: 'comfort' },
    { name: t('home.packages.luxury.title'), img: luxImg, key: 'luxury' },
  ]

  const features = [
    {
      title: t('home.features.ready.title'),
      desc: t('home.features.ready.desc'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: t('home.features.time.title'),
      desc: t('home.features.time.desc'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4h12M6 20h12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 4v3c0 1.8 1.4 3.2 3.2 4.1-1.8.9-3.2 2.3-3.2 4.1v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 4v3c0 1.8-1.4 3.2-3.2 4.1 1.8.9 3.2 2.3 3.2 4.1v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: t('home.features.budget.title'),
      desc: t('home.features.budget.desc'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 10h14a4 4 0 010 8H7a4 4 0 010-8zm4-4h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ]

  const testimonials = t('home.testimonials')

  const featuresRef = useRef(null)

  useEffect(() => {
    // Features scroll animation
    const featuresContainer = featuresRef.current
    if (featuresContainer) {
      const featureItems = featuresContainer.querySelectorAll('.feature-card')
      const featuresObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              featuresObserver.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.25 }
      )
      featureItems.forEach((el) => featuresObserver.observe(el))
    }

    // Packages heading scroll animation
    const packagesHeading = packagesHeadingRef.current
    if (packagesHeading) {
      const packagesHeadingObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              packagesHeadingObserver.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.25 }
      )
      packagesHeadingObserver.observe(packagesHeading)
    }

    // Packages cards scroll animation
    const packagesContainer = packagesRef.current
    if (packagesContainer) {
      const packageItems = packagesContainer.querySelectorAll('.home-card')
      const packagesObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              packagesObserver.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.25 }
      )
      packageItems.forEach((el) => packagesObserver.observe(el))
    }

    // Testimonials scroll animation
    const testimonialsContainer = testimonialsRef.current
    if (testimonialsContainer) {
      const testimonialsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              testimonialsObserver.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.25 }
      )
      testimonialsObserver.observe(testimonialsContainer)
    }
  }, [])

  // Testimonials otomatik geçiş
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true)
        setPreviousTestimonial(currentTestimonial)
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
        
        // Animasyon tamamlandıktan sonra transition durumunu sıfırla
        setTimeout(() => {
          setIsTransitioning(false)
          setPreviousTestimonial(-1)
        }, 600) // CSS transition süresi ile aynı
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [testimonials.length, isTransitioning, currentTestimonial])

  function scrollToPackages() {
    const el = packagesRef.current
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="home">
      <section className="home-hero">
        <div className="floating-particles">
          <div className="shape-3"></div>
          <div className="shape-4"></div>
          <div className="shape-5"></div>
        </div>
        <div className="home-hero__inner">
          <h1 className="home-hero__title">{t('home.hero.title')}</h1>
          <p className="home-hero__subtitle">
            "{t('home.hero.subtitle')}"
          </p>
        </div>
      </section>

      <section className="features-xl" aria-label={t('home.ariaLabels.features')} ref={featuresRef}>
        {features.map((f, idx) => {
          const sideClass = idx % 2 === 0 ? 'from-left' : 'from-right'
          const evenClass = idx % 2 === 1 ? 'is-even' : ''
          return (
            <article
              key={f.title}
              className={`feature-card ${sideClass} ${evenClass}`}
              style={{ transitionDelay: `${idx * 90}ms`, backgroundColor: 'none' }}
            >
              <div className="feature-card__icon" aria-hidden="true">{f.icon}</div>
              <div className="feature-card__body">
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            </article>
          )
        })}
      </section>

      <section className="home-packages-section">
        <h2 className="home-grid__heading" ref={packagesHeadingRef} id="paketler">{t('home.packages.title')}</h2>
        <div className="home-grid" aria-label={t('home.ariaLabels.packages')} ref={packagesRef}>
        {packages.map((item) => {
          const target = item.key === 'economic' ? '/paket/ekonomik' : item.key === 'comfort' ? '/paket/konforlu' : '/paket/lux'
          return (
          <article
            key={item.name}
            className="home-card"
            role="link"
            tabIndex={0}
            aria-label={`${item.name} package details`}
            onClick={() => {
              navigate(target)
              setTimeout(() => {
                window.scrollTo(0, 0)
              }, 0)
            }}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' || e.key === ' ') { 
                e.preventDefault()
                navigate(target)
                setTimeout(() => {
                  window.scrollTo(0, 0)
                }, 0)
              } 
            }}
          >
            {item.key === 'comfort' && <span className="home-card__badge">{t('home.badges.bestseller')}</span>}
            {item.key === 'luxury' && <span className="home-card__badge badge--accent">{t('home.badges.premium')}</span>}
            <div className="home-card__media">
              <img src={item.img} alt={`${item.name} package`} loading="lazy" />
            </div>
            <div className="home-card__label">
            </div>
            <div className="home-card__center" aria-hidden="true">
              <p className="home-card__center-text">{item.name.toLocaleUpperCase()}</p>
            </div>
          </article>
          )})}
        </div>
      </section>

      <section className="home-testimonials" aria-label={t('home.ariaLabels.testimonials')} ref={testimonialsRef}>
        <button 
          className="testimonial-nav testimonial-nav--prev"
          onClick={() => {
            console.log('Left button clicked, current:', currentTestimonial, 'isTransitioning:', isTransitioning)
            if (!isTransitioning) {
              setIsTransitioning(true)
              setPreviousTestimonial(currentTestimonial)
              setCurrentTestimonial((prev) => prev === 0 ? testimonials.length - 1 : prev - 1)
                              setTimeout(() => {
                  setIsTransitioning(false)
                  setPreviousTestimonial(-1)
                }, 600)
            }
          }}
          aria-label="Previous review"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <div className="testimonials-container">
          <div className="testimonials-slider">
            {testimonials.map((t, index) => (
              <div 
                key={t.name} 
                className={`testimonial ${index === currentTestimonial ? 'active' : ''} ${index === previousTestimonial ? 'prev' : ''}`}
              >
                <div className="testimonial-content">
                  <div className="testimonial-quote">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="quote-icon">
                      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
                    </svg>
                  </div>
                  <blockquote className="testimonial__text">{t.text}</blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          className="testimonial-nav testimonial-nav--next"
          onClick={() => {
            console.log('Right button clicked, current:', currentTestimonial, 'isTransitioning:', isTransitioning)
            if (!isTransitioning) {
              setIsTransitioning(true)
              setPreviousTestimonial(currentTestimonial)
              setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
                              setTimeout(() => {
                  setIsTransitioning(false)
                  setPreviousTestimonial(-1)
                }, 600)
            }
          }}
          aria-label="Next review"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

    </main>
  )
}

export default HomeContent


