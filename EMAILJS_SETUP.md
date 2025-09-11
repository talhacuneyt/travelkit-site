# EmailJS Kurulum Talimatları

Admin panelinde şifre sıfırlama email gönderme özelliği için EmailJS kurulumu gereklidir.

## 1. EmailJS Hesabı Oluşturma

1. [EmailJS.com](https://www.emailjs.com/) adresine gidin
2. "Sign Up" ile ücretsiz hesap oluşturun
3. Email adresinizi doğrulayın

## 2. Email Servisi Ekleme

1. Dashboard'da "Email Services" bölümüne gidin
2. "Add New Service" butonuna tıklayın
3. Gmail, Outlook veya başka bir email servisi seçin
4. Email adresinizi ve şifrenizi girin
5. Service ID'yi not edin (örn: `service_travelkit`)

## 3. Email Template Oluşturma

1. "Email Templates" bölümüne gidin
2. "Create New Template" butonuna tıklayın
3. Template adını girin (örn: `template_reset`)
4. Aşağıdaki template'i kullanın:

```
Subject: {{subject}}

Merhaba {{username}},

{{message}}

🔐 Şifre Sıfırlama Linki:
{{reset_link}}

⚠️ Bu link 1 saat geçerlidir.
⚠️ Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.

Bu email otomatik olarak gönderilmiştir.
Email sent via EmailJS.com
```

## 4. Public Key Alma

1. "Account" bölümüne gidin
2. "API Keys" sekmesinde Public Key'i kopyalayın

## 5. Kod Güncelleme

`src/pages/admin/index.jsx` dosyasında aşağıdaki değerleri güncelleyin:

```javascript
// Satır 48'de
emailjs.init('YOUR_PUBLIC_KEY') // Public Key'inizi buraya yazın

// Satır 220-223'te
await emailjs.send(
  'service_travelkit', // Service ID'nizi buraya yazın
  'template_reset', // Template ID'nizi buraya yazın
  emailData,
  'YOUR_PUBLIC_KEY' // Public Key'inizi buraya yazın
)
```

## 6. Test Etme

1. Admin girişi sayfasında 3 kez yanlış giriş yapın
2. Email adresinizi girin
3. "Şifre Sıfırlama Linki Gönder" butonuna tıklayın
4. Email'inizin gelip gelmediğini kontrol edin

## 7. Güvenlik Notları

- Public Key'i asla public repository'de paylaşmayın
- Production'da environment variables kullanın
- Email template'inde hassas bilgileri paylaşmayın

## 8. Environment Variables (Önerilen)

`.env` dosyası oluşturun:

```
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_EMAILJS_SERVICE_ID=your_service_id_here
VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
```

Kod güncellemesi:

```javascript
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY)

await emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  emailData,
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
)
```

## Sorun Giderme

- **Email gelmiyor**: Spam klasörünü kontrol edin
- **Hata mesajı**: Console'da hata detaylarını kontrol edin
- **Template hatası**: EmailJS template'inizi kontrol edin
- **Service hatası**: Email servisi ayarlarınızı kontrol edin
