# SMS 2FA Kurulumu

## Twilio ile SMS Gönderme

### 1. Twilio Hesabı Oluşturun
- [Twilio Console](https://console.twilio.com/) adresine gidin
- Ücretsiz hesap oluşturun
- Telefon numarası doğrulaması yapın

### 2. Twilio Bilgilerini Alın
- Account SID
- Auth Token
- Telefon numaranız (Twilio'dan aldığınız)

### 3. Environment Variables Ayarlayın
Backend klasöründe `.env` dosyası oluşturun:

```env
# Server Configuration
PORT=3001

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. Twilio Paketini Yükleyin
```bash
cd backend
npm install
```

### 5. Backend'i Başlatın
```bash
npm start
```

## Alternatif SMS Servisleri

### AWS SNS
```javascript
const AWS = require('aws-sdk');
const sns = new AWS.SNS({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
```

### Vonage (Nexmo)
```javascript
const Vonage = require('@vonage/server-sdk');
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET
});
```

## Test Etme
1. Admin paneline gidin
2. 2FA'yı etkinleştirin
3. Telefon numaranızı girin
4. SMS'i kontrol edin

## Güvenlik Notları
- Twilio credentials'larını güvenli tutun
- Production'da rate limiting ekleyin
- SMS kodlarını süreli olarak temizleyin
