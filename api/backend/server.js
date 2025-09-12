import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://kegdhelzdksivfekktkx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZ2RoZWx6ZGtzaXZmZWtrdGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTA1NDgsImV4cCI6MjA3MjgyNjU0OH0.9srURxR_AsLu5lqwodeFuV-zsmkkr82PRh9RSToqQUU';

const supabase = createClient(supabaseUrl, supabaseKey);

// __dirname için ES6 modül uyumluluğu
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Users dosya yolu
const USERS_FILE = path.join(__dirname, 'users.json');

// Kullanıcı veritabanını yükle veya oluştur
let users = {};

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
      console.log('✅ Kullanıcı veritabanı yüklendi');
    } else {
      // Varsayılan admin kullanıcısı oluştur
      users = {
        'admin': {
          username: 'admin',
          email: 'cuneytosmanlioglu@gmail.com',
          passwordHash: '$2a$12$mxOtN6NUWviwfeNi6eN2te2hPcH5Q8/sy7.Y6l2R6A3UCMTLUOmqe',
          isActive: true,
          role: 'admin'
        }
      };
      saveUsers();
      console.log('✅ Varsayılan admin kullanıcısı oluşturuldu');
    }
  } catch (error) {
    console.error('❌ Kullanıcı veritabanı yüklenirken hata:', error);
    // Hata durumunda varsayılan kullanıcı oluştur
    users = {
      'admin': {
        username: 'admin',
        email: 'cuneytosmanlioglu@gmail.com',
        passwordHash: '$2a$12$mxOtN6NUWviwfeNi6eN2te2hPcH5Q8/sy7.Y6l2R6A3UCMTLUOmqe',
        isActive: true,
        role: 'admin'
      }
    };
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('✅ Kullanıcı veritabanı kaydedildi');
  } catch (error) {
    console.error('❌ Kullanıcı veritabanı kaydedilirken hata:', error);
  }
}

// Uygulama başlatıldığında kullanıcıları yükle
loadUsers();


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
    'https://travelkit.com.tr',
    'https://www.travelkit.com.tr',
    /\.vercel\.app$/  // Tüm Vercel preview domain'leri için regex
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// OPTIONS preflight isteği için özel handler
app.options('*', cors());
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
      return res.status(401).json({
        success: false,
        message: 'Böyle bir kullanıcı yok'
      });
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Başarılı giriş - JWT token oluştur
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

// Reset attempts endpoint (admin için)
app.post('/api/auth/reset-attempts', async (req, res) => {
  try {
    // Bu endpoint sadece admin panelinde kullanılıyor
    // Gerçek implementasyon gerekirse buraya eklenebilir
    res.json({
      success: true,
      message: 'Reset attempts endpoint - not implemented yet'
    });
  } catch (error) {
    console.error('Reset attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Şifre değiştirme endpoint
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, token } = req.body;

    if (!currentPassword || !newPassword || !token) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar gerekli'
      });
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const username = decoded.username;

    // Kullanıcıyı bul
    const user = users[username];
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifreyi kontrol et
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mevcut şifre yanlış'
      });
    }

    // Yeni şifre validasyonu
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre en az 6 karakter olmalıdır'
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Yeni şifre mevcut şifre ile aynı olamaz'
      });
    }

    // Yeni şifreyi hash'le ve kaydet
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hashedNewPassword;

    // Değişiklikleri dosyaya kaydet
    saveUsers();

    console.log(`✅ Şifre değiştirildi - Kullanıcı: ${username}`);
    console.log(`🔐 Yeni şifre hash: ${hashedNewPassword}`);

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
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
app.get('/api/packages', async (req, res) => {
  try {
    // Supabase'den paketleri çek
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('id');

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Paketler yüklenirken hata oluştu'
      });
    }

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Package fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get single package endpoint
app.get('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: package, error } = await supabase
      .from('packages')
      .select('*')
      .eq('package_type', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({
        success: false,
        message: 'Paket bulunamadı'
      });
    }

    res.json({
      success: true,
      data: package
    });
  } catch (error) {
    console.error('Package fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Update package endpoint
app.put('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, sections, items } = req.body;

    // Validation
    if (!title || !description || !price) {
      return res.status(400).json({
        success: false,
        message: 'Başlık, açıklama ve fiyat gerekli'
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir fiyat girin'
      });
    }

    // Supabase'de paketi güncelle
    const { data: updatedPackage, error } = await supabase
      .from('packages')
      .update({
        title,
        description,
        price: parseFloat(price),
        sections: sections || {},
        items: items || {},
        updated_at: new Date().toISOString()
      })
      .eq('package_type', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Paket güncellenirken hata oluştu'
      });
    }

    console.log(`✅ Paket güncellendi: ${id} - Fiyat: ${price}`);

    res.json({
      success: true,
      message: 'Paket başarıyla güncellendi',
      data: updatedPackage
    });

  } catch (error) {
    console.error('Package update error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
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
