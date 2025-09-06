# Environment Variables Kurulumu

## .env Dosyası Oluşturma

Proje kök dizininde `.env` dosyası oluşturun ve aşağıdaki içeriği ekleyin:

```env
# Supabase Configuration (Mevcut)
VITE_SUPABASE_URL=https://oxgttvuktsjokfgxbibh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Z3R0dnVrdHNqb2tmZ3hiaWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODA3NDcsImV4cCI6MjA3MjY1Njc0N30.PRAg8CW1ezMVkQVmebqgX6EhLBInz6JS7Aoe74yv2mg

# EmailJS Configuration (Yeni)
VITE_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
VITE_EMAILJS_SERVICE_ID=service_travelkit
VITE_EMAILJS_TEMPLATE_ID=template_reset
```

## EmailJS Kurulumu

1. [EmailJS.com](https://www.emailjs.com/) adresine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'da:
   - **Email Services** bölümünden service oluşturun
   - **Email Templates** bölümünden template oluşturun
   - **Account > API Keys** bölümünden Public Key alın

4. `.env` dosyasındaki `YOUR_PUBLIC_KEY_HERE` kısmını gerçek Public Key ile değiştirin

## Test Etme

1. `.env` dosyasını oluşturduktan sonra projeyi yeniden başlatın:
   ```bash
   npm run dev
   ```

2. Admin girişi sayfasında 3 kez yanlış giriş yapın

3. Email adresinizi girin ve "Şifre Sıfırlama Linki Gönder" butonuna tıklayın

4. EmailJS yapılandırılmışsa gerçek email gönderilir, değilse console'da bilgiler görünür

## Güvenlik

- `.env` dosyasını git'e commit etmeyin
- Production'da environment variables'ları sunucu üzerinde ayarlayın
- Public Key'i asla public repository'de paylaşmayın
