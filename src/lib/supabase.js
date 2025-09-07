import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oxgttvuktsjokfgxbibh.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z3R0dnVrdHNqb2tmZ3hiaWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODA3NDcsImV4cCI6MjA3MjY1Njc0N30.PRAg8CW1ezMVkQVmebqgX6EhLBInz6JS7Aoe74yv2mg'

// EmailJS Configuration - Environment variables with fallback
export const EMAILJS_CONFIG = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YHkV0_Y_204JXzOSm',
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_gkqoexj',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_mlpj99e'
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

export const supabase = null // Geçici olarak devre dışı - API key sorunu
