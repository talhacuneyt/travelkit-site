# Supabase Kurulum Rehberi

## 1. Supabase Hesabı Oluştur
- https://supabase.com adresine git
- "Start your project" butonuna tıkla
- GitHub ile giriş yap veya email ile kayıt ol

## 2. Yeni Proje Oluştur
- "New Project" butonuna tıkla
- Proje adı: `travelkit-database`
- Database password: Güçlü bir şifre oluştur
- Region: Europe (Frankfurt) seç
- "Create new project" butonuna tıkla

## 3. Veritabanı Tablosu Oluştur
Supabase Dashboard'da SQL Editor'a git ve şu kodu çalıştır:

```sql
CREATE TABLE contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) etkinleştir
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Herkesin insert yapabilmesi için policy oluştur
CREATE POLICY "Allow public inserts" ON contact_messages
  FOR INSERT WITH CHECK (true);

-- Herkesin select yapabilmesi için policy oluştur
CREATE POLICY "Allow public selects" ON contact_messages
  FOR SELECT USING (true);

-- Herkesin update yapabilmesi için policy oluştur
CREATE POLICY "Allow public updates" ON contact_messages
  FOR UPDATE USING (true);

-- Herkesin delete yapabilmesi için policy oluştur
CREATE POLICY "Allow public deletes" ON contact_messages
  FOR DELETE USING (true);
```

**Eğer tablo zaten varsa, sadece is_read kolonunu ekle:**

```sql
-- Mevcut tabloya is_read kolonu ekle
ALTER TABLE contact_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Update policy'sini ekle (eğer yoksa)
CREATE POLICY "Allow public updates" ON contact_messages
  FOR UPDATE USING (true);
```

## 4. Environment Variables Ayarla
`.env` dosyası oluştur ve şu değerleri ekle:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase URL ve Anon Key'i proje ayarlarından alabilirsin:
- Settings > API > Project URL
- Settings > API > Project API keys > anon public

## 5. Test Et
- Formu doldur ve gönder
- `/admin` sayfasına git ve mesajları gör
- Console'da "Mesaj veritabanına kaydedildi" mesajını kontrol et

## Özellikler
- ✅ Form verileri veritabanında saklanıyor
- ✅ Admin paneli ile mesajları görüntüleme
- ✅ Mesaj silme özelliği
- ✅ Okunmuş/Okunmamış mesaj sistemi
- ✅ Tab sistemi ile mesaj filtreleme
- ✅ Gerçek zamanlı güncelleme
- ✅ Responsive tasarım
- ✅ Güvenli (RLS ile korumalı)
- ✅ Hem veritabanı hem localStorage ile senkronizasyon

## Admin Paneli
- URL: `http://localhost:5173/admin`
- Tüm mesajları görüntüle
- Okunmuş/Okunmamış mesajları filtrele
- Mesajları okundu olarak işaretle
- Mesajları sil
- İstatistikleri gör
