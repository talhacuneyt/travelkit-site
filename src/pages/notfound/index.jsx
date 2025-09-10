import { useTranslation } from '../../hooks/useTranslation'
import { Link } from 'react-router-dom'
import './index.css'

const NotFound = () => {
  const { t } = useTranslation()

  return (
    <main className="not-found">
      <div className="not-found-container">
        <div className="not-found-number">404</div>
        <h1 className="not-found__title">{t('notFound.title')}</h1>
        <p className="not-found__subtitle">{t('notFound.description')}</p>
        <Link to="/" className="not-found-button">
          {t('notFound.backToHome')}
        </Link>
      </div>
    </main>
  )
}

export default NotFound