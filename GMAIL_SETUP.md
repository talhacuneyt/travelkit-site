# Natro XMail Cloud SMTP Kurulum Rehberi

## Natro XMail Cloud SMTP Ayarları

Natro XMail Cloud ile email gönderebilmek için normal şifrenizi kullanabilirsiniz:

### 1. Natro XMail Cloud Hesabınızı Kullanın
- `info@travelkit.com.tr` hesabınızı kullanın
- Natro XMail Cloud şifrenizi kullanın

### 2. Environment Değişkenlerini Ayarlayın

Backend klasöründe `.env` dosyası oluşturun:

```env
# Email Configuration
EMAIL_USER=info@travelkit.com.tr
EMAIL_PASS=your-natro-password  # Natro XMail Cloud şifrenizi yazın
```

### 4. Alternatif: Doğrudan Kod İçinde Ayarlama

Eğer .env dosyası oluşturamıyorsanız, `api/backend/server.js` dosyasında:

```javascript
const emailTransporter = nodemailer.createTransport({
  host: 'mail.kurumsaleposta.com', // Natro SMTP sunucusu
  port: 587,
  secure: false, // TLS kullan
  auth: {
    user: 'info@travelkit.com.tr',
    pass: 'your-natro-password'  // Natro XMail Cloud şifrenizi buraya yazın
  },
  tls: {
    rejectUnauthorized: false
  }
});
```

### 5. Test Etme

Backend'i yeniden başlatın ve iletişim formunu test edin.

## Önemli Notlar

- Normal Gmail şifrenizi kullanmayın, çalışmaz
- Uygulama şifresi 16 haneli olmalı (boşluksuz)
- 2FA etkin olmalı, yoksa uygulama şifresi oluşturamazsınız
- Şifreyi güvenli bir yerde saklayın

## Hata Çözümleri

**"Invalid login: 535-5.7.8 Username and Password not accepted"**
- Uygulama şifresi kullanıyor musunuz?
- 2FA etkin mi?
- Şifre doğru kopyalandı mı?

**"Less secure app access"**
- Bu özellik artık desteklenmiyor
- Mutlaka uygulama şifresi kullanın
