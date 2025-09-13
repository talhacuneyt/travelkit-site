# Fiyat Sistemi Dokümantasyonu

## 🎯 Amaç
Tüm cihazlarda tutarlı fiyat gösterimi sağlamak ve fiyat değişikliklerini merkezi olarak yönetmek.

## 📁 Dosya Yapısı

### Merkezi Konfigürasyon
- `src/config/prices.js` - Ana fiyat konfigürasyonu
- `src/components/Price/Price.jsx` - Fiyat bileşeni
- `src/styles/price.css` - Fiyat stilleri

### API Endpoints
- `api/packages.js` - Paket bilgileri (cache busting ile)
- `api/prices.js` - Fiyat güncelleme API'si

## 🔧 Kullanım

### Fiyat Bileşeni
```jsx
import Price from '../components/Price/Price'

// Paket tipinden fiyat al
<Price packageType="economic" size="large" />

// Manuel fiyat değeri
<Price value={299} showDecimals={true} />

// Responsive fiyat
<Price packageType="comfort" size="medium" className="package-price" />
```

### Fiyat Fonksiyonları
```javascript
import { getPackagePrice, formatPrice, logPriceChange } from '../config/prices'

// Paket fiyatını al
const price = getPackagePrice('economic') // "₺299"

// Fiyat formatla
const formatted = formatPrice(299, { showDecimals: true }) // "₺299,00"

// Fiyat değişikliğini logla (sadece development)
logPriceChange('economic', '₺299', '₺399')
```

## 🚀 Özellikler

### Cache Busting
- Vite build'de dosya isimlerine hash eklenir
- API response'larında `no-cache` başlıkları
- ETag ile cache kontrolü

### Responsive Tasarım
- Mobil ve desktop'ta aynı fiyat görünümü
- Fiyat kesilmesini önleyen CSS
- Tabular numbers ile tutarlı hizalama

### Development/Production Ayrımı
- Development'ta fiyat değişiklikleri loglanır
- Production'da loglar kapatılır
- Koşullu loglama sistemi

## 📱 Responsive Fiyat Görünümü

### CSS Sınıfları
```css
.price--large    /* 2rem (desktop) / 1.5rem (mobile) */
.price--medium   /* 1.5rem (desktop) / 1.25rem (mobile) */
.price--small    /* 1rem (desktop) / 0.9rem (mobile) */
```

### Fiyat Container
```css
.price-container {
  display: inline-block;
  min-width: fit-content;
  max-width: 100%;
}
```

## 🔄 Fiyat Güncelleme Süreci

1. **Config Güncelleme**: `src/config/prices.js` dosyasını düzenle
2. **Cache Temizleme**: Vercel deploy sonrası otomatik
3. **Doğrulama**: Tüm cihazlarda aynı fiyat görünümü

## 🐛 Sorun Giderme

### Fiyat Tutarsızlığı
- Tarayıcı cache'ini temizle
- Hard refresh (Ctrl+F5) yap
- Vercel deploy'u kontrol et

### Fiyat Kesilmesi
- `.price-container` sınıfını kullan
- `white-space: nowrap` kontrolü
- Responsive breakpoint'leri kontrol et

### Development Logları
- `import.meta.env.DEV` kontrolü
- Console'da fiyat değişiklikleri görünür
- Production'da loglar otomatik kapanır

## 📊 Performans

### Optimizasyonlar
- Merkezi config ile tek kaynak
- Lazy loading ile gereksiz render'ları önle
- CSS ile responsive optimizasyon

### Cache Stratejisi
- API'lerde `no-cache` başlıkları
- Build'de hash-based cache busting
- ETag ile conditional requests

## 🔒 Güvenlik

### Fiyat Doğrulama
- Geçersiz fiyat değerleri için fallback
- Console error'ları ile hata takibi
- Type safety ile güvenli fiyat işleme

### Admin Kontrolü
- Fiyat güncelleme API'si
- JWT token ile yetkilendirme
- Audit log ile değişiklik takibi
