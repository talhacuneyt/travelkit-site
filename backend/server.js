import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Kullanıcı veritabanı (gerçek projede veritabanı kullanılmalı)
const users = {
  'admin': {
    username: 'admin',
    email: 'admin@travelkit.com',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzK1a2', // travelkit2024
    isActive: true,
    role: 'admin'
  }
};

// Başarısız giriş sayacı (kullanıcı bazlı)
const failedAttempts = new Map();
const resetTokens = new Map();

// Email transporter oluştur
const emailTransporter = nodemailer.createTransport({
  service: 'gmail', // Gmail kullanıyoruz
  auth: {
    user: process.env.EMAIL_USER || 'travelkit.admin@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Email gönderim fonksiyonu
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      html: html
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://travelkit-site.vercel.app',
    'https://travelkit-site-git-main.vercel.app',
    'https://travelkit-site.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP için 15 dakikada maksimum 100 istek
  message: {
    error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
    retryAfter: '15 dakika'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Genel rate limiting
app.use('/api/', limiter);

// Login için özel rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 20, // Her IP için 15 dakikada maksimum 20 login denemesi
  message: {
    success: false,
    message: 'Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.',
    retryAfter: '15 dakika'
  }
});

// Password reset için rate limiting
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 3, // Her IP için 1 saatte maksimum 3 reset isteği
  message: {
    success: false,
    message: 'Çok fazla şifre sıfırlama isteği. Lütfen 1 saat sonra tekrar deneyin.',
    retryAfter: '1 saat'
  }
});

// SMS API için daha sıkı rate limiting
const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 3, // Her IP için 1 dakikada maksimum 3 SMS
  message: {
    error: 'SMS gönderme limiti aşıldı. Lütfen 1 dakika sonra tekrar deneyin.',
    retryAfter: '1 dakika'
  }
});

// Payment API için orta seviye rate limiting
const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 10, // Her IP için 5 dakikada maksimum 10 payment isteği
  message: {
    error: 'Payment isteği limiti aşıldı. Lütfen 5 dakika sonra tekrar deneyin.',
    retryAfter: '5 dakika'
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'TravelKit Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip;
    const userAgent = req.get('User-Agent');

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı adı ve şifre gerekli'
      });
    }

    // Kullanıcı var mı kontrol et
    const user = users[username];
    if (!user || !user.isActive) {
      // Kullanıcı yoksa açık mesaj dön
      return res.status(401).json({
        success: false,
        message: 'Böyle bir kullanıcı yok'
      });
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Yanlış şifre - kullanıcı bazlı counter
      await handleFailedPassword(username, clientIP, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Başarılı giriş - counter'ı sıfırla
    failedAttempts.delete(username);

    // JWT token oluştur
    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
        loginTime: Date.now()
      },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: {
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Password reset endpoint
app.post('/api/auth/reset-password', resetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email adresi gerekli'
      });
    }

    // Kullanıcıyı email ile bul
    const user = Object.values(users).find(u => u.email === email);

    if (!user || !user.isActive) {
      // Kullanıcı yoksa genel mesaj (account enumeration koruması)
      return res.json({
        success: true,
        message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama linki gönderilecektir'
      });
    }

    // Reset token oluştur
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 saat

    resetTokens.set(resetToken, {
      username: user.username,
      email: user.email,
      expires: tokenExpiry
    });

    // Email gönder
    await sendPasswordResetEmail(user.email, user.username, resetToken);

    res.json({
      success: true,
      message: 'Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama linki gönderilecektir'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Token doğrulama endpoint
app.post('/api/auth/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token gerekli'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

    res.json({
      success: true,
      user: {
        username: decoded.username,
        role: decoded.role
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
});

// Reset failed attempts endpoint
app.post('/api/auth/reset-attempts', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (username && failedAttempts.has(username)) {
      failedAttempts.delete(username);
      console.log(`Failed attempts reset for user: ${username}`);
    }
    
    res.json({
      success: true,
      message: 'Failed attempts reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Reset failed'
    });
  }
});

// Payment endpoints
app.post('/api/payments/create-session', paymentLimiter, async (req, res) => {
  try {
    const { packageType, amount, customerInfo } = req.body;

    // Validate required fields
    if (!packageType || !amount || !customerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Package type, amount and customer info are required'
      });
    }

    // Validate amount is a number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number'
      });
    }

    // Mock payment session creation
    const sessionData = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      packageType,
      amount: numericAmount,
      customerInfo,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    console.log('Payment session created:', sessionData);

    res.json({
      success: true,
      message: 'Payment session created successfully',
      data: sessionData
    });

  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

app.post('/api/payments/verify', paymentLimiter, async (req, res) => {
  try {
    const { sessionId, paymentData } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Mock payment verification
    const verificationResult = {
      sessionId,
      status: 'completed',
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      verifiedAt: new Date().toISOString()
    };

    console.log('Payment verified:', verificationResult);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: verificationResult
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

// Package information endpoint
app.get('/api/packages', (req, res) => {
  const packages = [
    {
      id: 'ekonomik',
      name: 'Ekonomik Paket',
      price: 299,
      features: ['Temel seyahat malzemeleri', '1 kişilik', 'Çanta dahil']
    },
    {
      id: 'konforlu',
      name: 'Konforlu Paket',
      price: 499,
      features: ['Gelişmiş seyahat malzemeleri', '2 kişilik', 'Premium çanta dahil']
    },
    {
      id: 'lux',
      name: 'Lux Paket',
      price: 799,
      features: ['Lüks seyahat malzemeleri', '4 kişilik', 'VIP çanta dahil']
    }
  ];

  res.json({
    success: true,
    data: packages
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// SMS endpoint
app.post('/api/send-sms', smsLimiter, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    // Validate required fields
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Telefon numarası ve mesaj gerekli'
      });
    }

    // Phone number validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir telefon numarası girin'
      });
    }

    // Twilio SMS gönderme (gerçek implementasyon)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = (await import('twilio')).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`SMS gönderildi: ${phoneNumber} - SID: ${result.sid}`);

      res.json({
        success: true,
        message: 'SMS başarıyla gönderildi',
        sid: result.sid
      });
    } else {
      // Twilio yapılandırılmamışsa simüle et
      console.log(`[SIMÜLE] SMS gönderildi: ${phoneNumber} - Mesaj: ${message}`);

      res.json({
        success: true,
        message: 'SMS simüle edildi (Twilio yapılandırılmamış)',
        simulated: true
      });
    }

  } catch (error) {
    console.error('SMS gönderme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'SMS gönderilemedi: ' + error.message
    });
  }
});

// Başarısız şifre yönetimi (sadece var olan kullanıcılar için)
async function handleFailedPassword(username, clientIP, userAgent) {
  const currentAttempts = failedAttempts.get(username) || 0;
  const newAttempts = currentAttempts + 1;
  failedAttempts.set(username, newAttempts);

  console.log(`Failed password attempt for user: ${username} - Attempt ${newAttempts}`);

  // 3 başarısız deneme sonrası reset linki gönder (sadece kullanıcı varsa)
  if (newAttempts >= 3) {
    const user = users[username];

    if (user && user.isActive) {
      // Sadece gerçek kullanıcıya reset linki gönder
      await sendPasswordResetEmail(user.email, username);
      console.log(`Password reset email sent to: ${user.email}`);

      // 15 dakika bekleme süresi
      setTimeout(() => {
        failedAttempts.delete(username);
      }, 15 * 60 * 1000);
    }
  }
}

// Email gönderme fonksiyonu
async function sendPasswordResetEmail(email, username, resetToken = null) {
  try {
    const resetLink = resetToken 
      ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?reset=${resetToken}`
      : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin?reset=manual`;
    
    console.log(`[EMAIL] Password reset email would be sent to: ${email}`);
    console.log(`[EMAIL] Reset link: ${resetLink}`);
    console.log(`[EMAIL] Username: ${username}`);
    
    // Her durumda email gönderimini simüle et (gerçek email gönderimi için EMAIL_USER ve EMAIL_PASS gerekli)
    const subject = 'TravelKit Admin - Şifre Sıfırlama';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">TravelKit Admin Şifre Sıfırlama</h2>
        <p>Merhaba <strong>${username}</strong>,</p>
        <p>Admin hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
        <p>Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Şifremi Sıfırla
          </a>
        </div>
        <p><strong>Önemli:</strong></p>
        <ul>
          <li>Bu link 1 saat geçerlidir</li>
          <li>Sadece bir kez kullanılabilir</li>
          <li>Bu işlemi siz yapmadıysanız, bu emaili görmezden gelin</li>
        </ul>
        <p>İyi günler,<br>TravelKit Ekibi</p>
        <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          Eğer buton çalışmıyorsa, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:<br>
          <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
        </p>
      </div>
    `;

    // Gerçek email gönderimi için EMAIL_USER ve EMAIL_PASS environment variables gerekli
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'travelkit.admin@gmail.com') {
      const result = await sendEmail(email, subject, html);
      
      if (result.success) {
        console.log(`[EMAIL] Password reset email sent successfully to: ${email}`);
        return { success: true, messageId: result.messageId };
      } else {
        console.error(`[EMAIL] Failed to send email to: ${email}`, result.error);
        return { success: false, error: result.error };
      }
    } else {
      console.log(`[EMAIL] Email configuration not found. Email would be sent to: ${email}`);
      console.log(`[EMAIL] To enable real email sending, set EMAIL_USER and EMAIL_PASS environment variables`);
      console.log(`[EMAIL] Reset link for testing: ${resetLink}`);
      return { success: true, messageId: 'simulated' };
    }
    
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TravelKit Backend server is running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api/payments`);
  console.log(`📱 SMS API: http://localhost:${PORT}/api/send-sms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});