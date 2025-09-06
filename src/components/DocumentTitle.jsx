import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

const DocumentTitle = () => {
  const { language } = useLanguage()
  const location = useLocation()

  useEffect(() => {
    const getPageTitle = () => {
      const baseTitle = 'TravelKit'
      
      // Sayfa başlıkları
      const pageTitles = {
        '/': language === 'en' ? 'Home' : 'Anasayfa',
        '/hakkimizda': language === 'en' ? 'About Us' : 'Hakkımızda',
        '/iletisim': language === 'en' ? 'Contact' : 'İletişim',
        '/sss': language === 'en' ? 'FAQ' : 'SSS',
        '/paket/ekonomik': language === 'en' ? 'Economic Package' : 'Ekonomik Paket',
        '/paket/konforlu': language === 'en' ? 'Comfort Package' : 'Konforlu Paket',
        '/paket/lux': language === 'en' ? 'Luxury Package' : 'Lüks Paket',
        '/admin': language === 'en' ? 'Admin Panel' : 'Admin Paneli'
      }

      const pageTitle = pageTitles[location.pathname]
      
      if (pageTitle) {
        return `${baseTitle} | ${pageTitle}`
      }
      
      // 404 sayfası için
      if (location.pathname !== '/' && !Object.keys(pageTitles).includes(location.pathname)) {
        return language === 'en' ? `${baseTitle} | Page Not Found` : `${baseTitle} | Sayfa Bulunamadı`
      }
      
      // Ana sayfa için
      return baseTitle
    }

    document.title = getPageTitle()
  }, [language, location.pathname])

  return null
}

export default DocumentTitle
