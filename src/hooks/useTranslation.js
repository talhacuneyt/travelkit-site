import { useLanguage } from '../contexts/LanguageContext'
import { tr } from '../translations/tr'
import { en } from '../translations/en'
import { useCallback } from 'react'

export const useTranslation = () => {
  const { language } = useLanguage()
  
  const translations = {
    tr,
    en
  }
  
  const t = useCallback((key) => {
    const keys = key.split('.')
    let value = translations[language]
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        console.warn(`Translation key "${key}" not found for language "${language}"`)
        return key
      }
    }
    
    return value || key
  }, [language])
  
  return { t, language }
}
