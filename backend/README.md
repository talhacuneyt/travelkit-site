# TravelKit Backend API

Kuveyt Türk ödeme sistemi entegrasyonu ile TravelKit backend API'si.

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Environment dosyasını oluşturun:
```bash
cp env.example .env
```

3. `.env` dosyasını düzenleyin ve Kuveyt Türk API bilgilerinizi girin.

## Çalıştırma

### Geliştirme Ortamı
```bash
npm run dev
```

### Üretim Ortamı
```bash
npm start
```

## API Endpoints

### Sağlık Kontrolü
- `GET /api/health` - API durumu

### Ödeme İşlemleri
- `POST /api/payments/create-session` - Ödeme oturumu oluştur
- `GET /api/payments/status/:sessionId` - Ödeme durumu kontrol et
- `POST /api/payments/webhook` - Kuveyt Türk webhook

## Kuveyt Türk API Entegrasyonu

### Gerekli Bilgiler
- Merchant ID
- API Key
- Secret Key
- Base URL

### Test Ortamı
Geliştirme ortamında gerçek API çağrıları yapılmaz, test verileri döner.

### Webhook
Kuveyt Türk'tan gelen ödeme bildirimleri `/api/payments/webhook` endpoint'inde işlenir.

## Güvenlik

- CORS yapılandırması
- Webhook imza doğrulama
- Environment variables ile gizli bilgilerin korunması

## Geliştirme

Backend API'si frontend ile birlikte çalışacak şekilde tasarlanmıştır. Frontend'den gelen ödeme istekleri işlenir ve Kuveyt Türk API'si ile entegre edilir.
