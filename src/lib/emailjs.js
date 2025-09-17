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