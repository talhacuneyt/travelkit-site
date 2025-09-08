import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first, then browser language, default to Turkish
    const savedLanguage = localStorage.getItem('travelkit-language')
    if (savedLanguage) return savedLanguage
    
    const browserLanguage = navigator.language || navigator.userLanguage
    return browserLanguage.startsWith('en') ? 'en' : 'tr'
  })

  useEffect(() => {
    localStorage.setItem('travelkit-language', language)
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'tr' ? 'en' : 'tr')
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    isTurkish: language === 'tr',
    isEnglish: language === 'en'
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
