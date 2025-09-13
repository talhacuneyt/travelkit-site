# TravelKit Website

Modern ve responsive travel kit satış sitesi. React, Vite ve modern web teknolojileri ile geliştirilmiştir.

## 🚀 Özellikler

- **Responsive Tasarım** - Tüm cihazlarda mükemmel görünüm
- **Koyu Mod Desteği** - Kullanıcı tercihine göre tema değiştirme
- **Çoklu Dil Desteği** - Türkçe ve İngilizce
- **Admin Paneli** - Mesaj yönetimi ve istatistikler
- **Ödeme Sistemi** - Kuveyt Türk entegrasyonu (hazır)
- **Modern UI/UX** - Kullanıcı dostu arayüz

## 📦 Paketler

### Ekonomik Paket - ₺299
- Temel seyahat ihtiyaçları
- Kişisel bakım ürünleri
- Sağlık malzemeleri

### Konfor Paket - ₺599
- Ekonomik paket + konfor ürünleri
- Teknoloji aksesuarları
- Premium kalite

### Lüks Paket - ₺999
- Tüm özellikler + lüks ürünler
- Premium markalar
- Özel tasarım

## 🛠️ Teknolojiler

- **Frontend:** React 19, Vite, CSS3
- **Backend:** Node.js, Express
- **Ödeme:** Kuveyt Türk API
- **Deployment:** Vercel/Netlify

## 🚀 Kurulum

### Frontend
```bash
npm install
npm run dev
```

### Backend (Geliştirme)
```bash
cd api/backend
npm install
npm run dev
```

## 🔐 Ortam Değişkenleri

Backend için gerekli ortam değişkenlerini `api/backend/.env` dosyasında tanımlayın:

```env
# Supabase Configuration
SUPABASE_URL=https://kegdhelzdksivfekktkx.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Mail Configuration (EmailJS - Template'li email gönderimi)
VITE_EMAILJS_SERVICE_ID=service_gkqoexj
VITE_EMAILJS_TEMPLATE_ID=template_97boikk
VITE_EMAILJS_PUBLIC_KEY=YHkV0_Y_204JXzOSm

# Mail Configuration (SMTP - Alternatif)
MAIL_HOST=mail.kurumsaleposta.com
MAIL_PORT=465
MAIL_USER=info@travelkit.com.tr
MAIL_PASSWORD=your-mail-password

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Vercel Deployment

Vercel'de deployment için Environment Variables'ı ayarlayın:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`
- `MAIL_HOST` (opsiyonel)
- `MAIL_PORT` (opsiyonel)
- `MAIL_USER` (opsiyonel)
- `MAIL_PASSWORD` (opsiyonel)

## 📱 Kullanım

1. Ana sayfada paketleri inceleyin
2. Detay sayfasında özellikleri görün
3. "Satın Al" butonuna tıklayın
4. Formu doldurun ve ödeme yapın

## 🔧 Geliştirme

- `npm run dev` - Frontend geliştirme sunucusu
- `npm run build` - Production build
- `npm run backend:dev` - Backend geliştirme sunucusu

## 📄 Lisans

MIT License

## 👥 Ekip

TravelKit Development Team