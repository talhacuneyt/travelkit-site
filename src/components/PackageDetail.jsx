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
const FeatureSection = ({ icon: Icon, sectionKey, itemsKey, isEven = false }) => {
  const { t } = useTranslation()

  return (
    <article className={`paket-feature ${isEven ? 'is-even' : ''}`}>
      <div className="paket-feature__icon" aria-hidden>
        <Icon />
      </div>
      <div className="paket-feature__body">
        <h3 className="paket__group-title">{t(sectionKey)}</h3>
        <div className="paket__chips">
          {t(itemsKey).map((item, index) => (
            <span key={index} className="paket__chip">{item}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

// Main package detail component
const PackageDetail = ({ packageType }) => {
  const { t } = useTranslation()

  // Handle purchase functionality
  const handlePurchase = (packageType) => {
    // Redirect to purchase page with package info
    window.location.href = `/satin-al?package=${packageType}`
  }

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

  // Feature sections configuration
  const featureSections = [
    {
      icon: PersonalCareIcon,
      sectionKey: `packages.${packageType}.sections.personalCare`,
      itemsKey: `packages.${packageType}.items.personalCare`,
      isEven: false
    },
    {
      icon: ComfortIcon,
      sectionKey: `packages.${packageType}.sections.comfort`,
      itemsKey: `packages.${packageType}.items.comfort`,
      isEven: true
    },
    {
      icon: TechnologyIcon,
      sectionKey: `packages.${packageType}.sections.technology`,
      itemsKey: `packages.${packageType}.items.technology`,
      isEven: false
    },
    {
      icon: HealthIcon,
      sectionKey: `packages.${packageType}.sections.health`,
      itemsKey: `packages.${packageType}.items.health`,
      isEven: true
    }
  ]

  return (
    <main className="paket">
      <section className="paket-hero">
        <FloatingParticles />
        <div className="paket-hero__inner">
          <h1 className="paket__title">{t(`packages.${packageType}.title`)}</h1>
          <p className="paket__description">{t(`packages.${packageType}.description`)}</p>
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
                  sectionKey={feature.sectionKey}
                  itemsKey={feature.itemsKey}
                  isEven={feature.isEven}
                />
              ))}
            </div>
          </section>

          <section className="paket__section">
            <h2 className="paket__section-title">{t(`packages.${packageType}.sections.additions`)}</h2>
            <div className="paket__chips">
              {t(`packages.${packageType}.items.additions`).map((item, index) => (
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
