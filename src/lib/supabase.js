import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kegdhelzdksivfekktkx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZ2RoZWx6ZGtzaXZmZWtrdGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTA1NDgsImV4cCI6MjA3MjgyNjU0OH0.9srURxR_AsLu5lqwodeFuV-zsmkkr82PRh9RSToqQUU'

// EmailJS Configuration - Environment variables with fallback
export const EMAILJS_CONFIG = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YHkV0_Y_204JXzOSm',
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_gkqoexj',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_mlpj99e' // Admin için
}

// İletişim formu için ayrı template
export const CONTACT_EMAILJS_CONFIG = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YHkV0_Y_204JXzOSm',
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_gkqoexj',
  templateId: import.meta.env.VITE_CONTACT_TEMPLATE_ID || 'template_contact_form'
}

// Configuration kontrolü
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? 'Mevcut' : 'Yok')
console.log('EmailJS Public Key:', EMAILJS_CONFIG.publicKey)
console.log('EmailJS Service ID:', EMAILJS_CONFIG.serviceId)
console.log('EmailJS Template ID:', EMAILJS_CONFIG.templateId)
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables bulunamadı. Veritabanı özellikleri devre dışı.')
}
console.log('✅ EmailJS yapılandırması tamamlandı!')

export const supabase = createClient(supabaseUrl, supabaseKey)
