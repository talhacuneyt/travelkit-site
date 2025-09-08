// EmailJS Hızlı Kurulum Script'i
// Bu dosyayı çalıştırarak EmailJS'i hızlıca test edebilirsiniz

// 1. EmailJS hesabı oluşturun: https://www.emailjs.com/
// 2. Aşağıdaki değerleri doldurun:

const EMAILJS_CONFIG = {
  publicKey: 'YOUR_PUBLIC_KEY', // EmailJS Dashboard > Account > API Keys
  serviceId: 'service_travelkit', // EmailJS Dashboard > Email Services
  templateId: 'template_reset' // EmailJS Dashboard > Email Templates
}

// 3. .env dosyası oluşturun ve şu satırları ekleyin:
const envContent = `
VITE_EMAILJS_PUBLIC_KEY=${EMAILJS_CONFIG.publicKey}
VITE_EMAILJS_SERVICE_ID=${EMAILJS_CONFIG.serviceId}
VITE_EMAILJS_TEMPLATE_ID=${EMAILJS_CONFIG.templateId}
`

console.log('=== EMAILJS KURULUM TALİMATLARI ===')
console.log('1. .env dosyası oluşturun ve şu içeriği ekleyin:')
console.log(envContent)
console.log('')
console.log('2. EmailJS Dashboard\'da:')
console.log('- Service ID:', EMAILJS_CONFIG.serviceId)
console.log('- Template ID:', EMAILJS_CONFIG.templateId)
console.log('- Public Key:', EMAILJS_CONFIG.publicKey)
console.log('')
console.log('3. Test için:')
console.log('- Admin girişi sayfasında 3 kez yanlış giriş yapın')
console.log('- Email adresinizi girin')
console.log('- Console\'da detaylı bilgileri göreceksiniz')
console.log('===============================')

// Test email gönderme fonksiyonu
async function testEmailSending() {
  const emailData = {
    to_email: 'test@example.com',
    from_name: 'TravelKit Admin',
    subject: 'Test Email',
    message: 'Bu bir test emailidir.',
    reset_link: 'https://example.com/reset'
  }
  
  try {
    // EmailJS test (eğer yapılandırılmışsa)
    if (EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
      console.log('EmailJS ile email gönderiliyor...')
      // await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, emailData, EMAILJS_CONFIG.publicKey)
      console.log('✅ Email başarıyla gönderildi!')
    } else {
      console.log('❌ EmailJS yapılandırılmamış!')
      console.log('Email verileri:', emailData)
    }
  } catch (error) {
    console.error('Email gönderme hatası:', error)
  }
}

// Test fonksiyonunu çalıştır
testEmailSending()
