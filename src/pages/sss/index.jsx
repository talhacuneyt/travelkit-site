import './index.css'
import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'

function SSS() {
  const faqRef = useRef(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const scrollToFAQ = (e) => {
    e.preventDefault();
    console.log('Button clicked!');

    // Alternative method using setTimeout to ensure DOM is ready
    setTimeout(() => {
      if (faqRef.current) {
        console.log('FAQ ref found, scrolling...');
        faqRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        console.log('FAQ ref not found!');
        // Fallback: scroll to FAQ section by ID
        const faqSection = document.querySelector('[data-faq-section]');
        if (faqSection) {
          faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  }

  const qa = t('faq.questions')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    const featureCards = document.querySelectorAll('.sss-faq-feature')
    featureCards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <main className="sss-wrapper">
      <section className="sss-hero">
        <div className="sss-hero__background">
          <div className="sss-hero__bg-gradient"></div>
          <div className="sss-hero__shape1"></div>
          <div className="sss-hero__shape2"></div>
        </div>

        <div className="sss-hero__content">
          <h1 className="sss-hero__title">
            {t('faq.title')}
          </h1>
          <p className="sss-hero__description">
            {t('faq.description')}
          </p>
          <p className="sss-hero__description2">
            {t('faq.description2')}
          </p>
          <div className="sss-hero__button-container">
                        <button 
              className="sss-hero__button"
              onClick={scrollToFAQ}
            >
              {t('faq.cta')}
            </button>
          </div>
        </div>
      </section>

      <section ref={faqRef} data-faq-section className="sss-faq">
        <div className="sss-faq__features">
          {qa.map((item, idx) => (
            <article key={idx} className="sss-faq-feature">
              <div className="sss-faq-feature__body">
                <h3 className="sss-faq-feature__title">{item.q}</h3>
                <p className="sss-faq-feature__answer">{item.a}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="sss-contact">
          <h3 className="sss-contact__title">
            {t('faq.notFound.title')}
          </h3>
          <button 
            className="sss-contact__button"
            onClick={() => navigate('/iletisim')}
          >
            {t('faq.notFound.cta')}
          </button>
        </div>
      </section>
    </main>
  )
}

export default SSS