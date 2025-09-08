import './index.css'
import { useRef, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation'

function Hakkimizda() {
  const visionMissionRef = useRef(null)
  const { t } = useTranslation()

  const scrollToVisionMission = () => {
    if (visionMissionRef.current) {
      visionMissionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  useEffect(() => {
    // Vision Mission section scroll animation
    const visionMissionSection = visionMissionRef.current
    if (visionMissionSection) {
      const visionMissionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              visionMissionObserver.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.25 }
      )
      visionMissionObserver.observe(visionMissionSection)

      // Individual items animation
      const items = visionMissionSection.querySelectorAll('.hakkimizda-vision-mission__item')
      const itemsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              itemsObserver.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.25 }
      )
      items.forEach((item) => itemsObserver.observe(item))
    }
  }, [])

  return (
    <main className="hakkimizda-wrapper">
      <section className="hakkimizda-hero">
        <div className="hakkimizda-hero__background">
          <div className="hakkimizda-hero__bg-gradient"></div>
          <div className="hakkimizda-hero__shape1"></div>
          <div className="hakkimizda-hero__shape2"></div>
        </div>
        
        <div className="hakkimizda-hero__content">
          <h1 className="hakkimizda-hero__title">
            {t('about.title')}
          </h1>
          <p className="hakkimizda-hero__description">
            {t('about.description')}
          </p>
          <p className="hakkimizda-hero__description2">
            {t('about.description2')}
          </p>
          <div className="hakkimizda-hero__button-container">
            <button 
              className="hakkimizda-hero__button"
              onClick={scrollToVisionMission}
            >
              {t('about.visionMission')}
            </button>
          </div>
        </div>
      </section>

      <section ref={visionMissionRef} className="hakkimizda-vision-mission">
        <div className="hakkimizda-vision-mission__grid">
          <div className="hakkimizda-vision-mission__item">
            <h2>
              {t('about.vision.title')}
            </h2>
            <p>
              {t('about.vision.content')}
            </p>
          </div>

          <div className="hakkimizda-vision-mission__item">
            <h2>
              {t('about.mission.title')}
            </h2>
            <p>
              {t('about.mission.content')}
            </p>
          </div>
        </div>
      </section>

    </main>
  )
}

export default Hakkimizda