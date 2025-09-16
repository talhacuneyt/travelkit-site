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
import emailjs from '@emailjs/nodejs';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://kegdhelzdksivfekktkx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZ2RoZWx6ZGtzaXZmZWtrdGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTA1NDgsImV4cCI6MjA3MjgyNjU0OH0.9srURxR_AsLu5lqwodeFuV-zsmkkr82PRh9RSToqQUU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Postgres pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:YOUR_PASSWORD@ep-rough-king-a5q8q8q8.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

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
          email: 'info@travelkit.com.tr',
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
        email: 'info@travelkit.com.tr',
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
const emailUser = process.env.EMAIL_USER || 'info@travelkit.com.tr';
const emailPass = process.env.EMAIL_PASS || '54e6e2B2935D0';

console.log('📧 Email konfigürasyonu:', {
  user: emailUser,
  passSet: emailPass !== 'your-app-password' ? '✅ Ayarlandı' : '❌ Varsayılan değer'
});

const emailTransporter = nodemailer.createTransport({
  host: 'mail.kurumsaleposta.com', // Natro SMTP sunucusu
  port: 587,
  secure: false, // TLS kullan
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Email gönderim fonksiyonu
async function sendEmail(to, subject, html) {
  try {
    // Gmail uygulama şifresi kontrolü
    if (emailPass === 'your-app-password') {
      console.error('❌ Gmail uygulama şifresi ayarlanmamış!');
      return {
        success: false,
        error: 'Gmail uygulama şifresi ayarlanmamış. Lütfen EMAIL_PASS environment değişkenini ayarlayın.'
      };
    }

    const mailOptions = {
      from: emailUser,
      to: to,
      subject: subject,
      html: html
    };

    console.log('📧 Email gönderiliyor:', { to, subject });
    const result = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email başarıyla gönderildi:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Email gönderim hatası:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
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
    console.log('📦 Fetching packages...');

    // Mock packages data (Supabase tablosu oluşturulana kadar)
    const mockPackages = [
      {
        id: 1,
        package_type: 'economic',
        slug: 'economic',
        title: 'Ekonomik',
        description: 'Seyahate zahmetsiz ve eksiksiz bir başlangıç yapmak isteyenler için, akıllı ve şık bir çözüm.',
        price: 299.00,
        sections: {
          personalCare: "Kişisel Bakım Ürünleri",
          comfort: "Konfor",
          technology: "Teknoloji",
          health: "Sağlık / İlk Yardım",
          additions: "Ekonomik Paket Eklemeleri"
        },
        items: {
          personalCare: ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"],
          comfort: ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem"],
          technology: ["Powerbank", "Çoklu Fonksiyonlu Kablo"],
          health: ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"],
          additions: ["Bavul İçi Düzenleyici", "Boyun Yastığı", "Seyahat Terliği", "QR Kart, müzik listesi", "Lavanta kesesi"]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        package_type: 'comfort',
        slug: 'comfort',
        title: 'Konforlu',
        description: 'Seyahatinizi daha konforlu hale getiren gelişmiş malzemelerle donatılmış paket.',
        price: 499.00,
        sections: {
          personalCare: "Kişisel Bakım Ürünleri",
          comfort: "Konfor",
          technology: "Teknoloji",
          health: "Sağlık / İlk Yardım",
          additions: "Konforlu Paket Eklemeleri"
        },
        items: {
          personalCare: ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"],
          comfort: ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem", "Boyun Yastığı", "Seyahat Terliği"],
          technology: ["Powerbank", "Çoklu Fonksiyonlu Kablo", "Bluetooth Kulaklık"],
          health: ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"],
          additions: ["Bavul İçi Düzenleyici", "QR Kart, müzik listesi", "Lavanta kesesi", "Seyahat Yastığı"]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        package_type: 'lux',
        slug: 'lux',
        title: 'Lux',
        description: 'En lüks seyahat deneyimi için özel olarak seçilmiş premium malzemeler.',
        price: 799.00,
        sections: {
          personalCare: "Kişisel Bakım Ürünleri",
          comfort: "Konfor",
          technology: "Teknoloji",
          health: "Sağlık / İlk Yardım",
          additions: "Lux Paket Eklemeleri"
        },
        items: {
          personalCare: ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"],
          comfort: ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem", "Boyun Yastığı", "Seyahat Terliği", "Premium Seyahat Yastığı"],
          technology: ["Powerbank", "Çoklu Fonksiyonlu Kablo", "Bluetooth Kulaklık", "Seyahat Adaptörü"],
          health: ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"],
          additions: ["Bavul İçi Düzenleyici", "QR Kart, müzik listesi", "Lavanta kesesi", "Premium Seyahat Yastığı", "VIP Çanta"]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    console.log('📦 Mock packages loaded:', mockPackages.length);
    res.json(mockPackages);
  } catch (error) {
    console.error('❌ Package fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get single package by slug endpoint
app.get('/api/packages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Slug mapping - frontend'den gelen paket tiplerini veritabanı slug'larına çevir
    const slugMapping = {
      'luxury': 'lux',
      'economic': 'economic',
      'comfort': 'comfort'
    };

    const actualSlug = slugMapping[slug] || slug;

    // Supabase'den paketi slug'a göre çek
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('slug', actualSlug)
      .single();

    if (error) {
      console.error('❌ Supabase package fetch error:', error);
      return res.status(404).json({
        success: false,
        message: 'Paket bulunamadı'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Package fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Get single package by id endpoint (for admin panel)
app.get('/api/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // NeonDB'den paketi id'ye göre çek
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM packages WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Paket bulunamadı'
        });
      }

      const packageData = result.rows[0];

      res.json({
        success: true,
        data: packageData
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Package fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Database error'
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
    const { data, error } = await supabase
      .from('packages')
      .update({
        title,
        description,
        price: parseFloat(price),
        sections: sections || {},
        items: items || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase package update error:', error);
      return res.status(404).json({
        success: false,
        message: 'Paket bulunamadı veya güncellenemedi'
      });
    }

    console.log(`✅ Paket güncellendi: ${id} - Fiyat: ${price}`);
    res.json(data);

  } catch (error) {
    console.error('❌ Package update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  console.log('🚀 Contact endpoint çağrıldı (Backend):', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  try {
    console.log('📝 Request body:', req.body);
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      console.log('❌ Validation error - missing fields:', { name: !!name, email: !!email, message: !!message });
      return res.status(400).json({
        success: false,
        message: 'İsim, email ve mesaj gerekli'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Email validation error:', email);
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir email adresi girin'
      });
    }

    console.log('✅ Validation passed:', { name, email, message: message.substring(0, 50) + '...' });

    // 1. Supabase'e kaydet
    console.log('💾 Supabase\'e kaydetmeye başlanıyor...');
    let dbSuccess = false;
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name,
            email,
            message,
            is_read: false,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        dbSuccess = false;
      } else {
        console.log('✅ Yeni mesaj kaydedildi:', data[0]);
        dbSuccess = true;
      }
    } catch (dbError) {
      console.error('❌ Supabase error:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack
      });
      dbSuccess = false;
    }

    // 2. EmailJS ile email gönder
    let emailSuccess = false;
    try {
      const emailjsResult = await emailjs.send(
        'service_gkqoexj', // Service ID
        'template_97boikk', // Template ID
        {
          from_name: name,
          from_email: email,
          message: message,
          to_name: 'TravelKit',
          reply_to: email
        },
        {
          publicKey: 'YHkV0_Y_204JXzOSm' // Public Key
        }
      );

      // EmailJS başarılı
      emailSuccess = true;

    } catch (emailjsError) {
      console.error('❌ EmailJS hatası:', {
        error: emailjsError,
        message: emailjsError.message,
        status: emailjsError.status,
        text: emailjsError.text
      });
      emailSuccess = false;

      // EmailJS başarısız olursa nodemailer ile dene
      console.log('📧 Nodemailer ile email gönderilmeye çalışılıyor...');
      try {
        const emailResult = await sendEmail(
          'info@travelkit.com.tr', // Admin email
          `TravelKit İletişim Formu - ${name}`,
          `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
              <meta charset="UTF-8">
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background: #f4f4f9;
                  margin: 0;
                  padding: 30px;
                }
                .container {
                  max-width: 650px;
                  margin: auto;
                  background: #ffffff;
                  border-radius: 10px;
                  border: 1px solid #e0e0e0;
                  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
                  overflow: hidden;
                }
                .header {
                  color: #fff;
                  text-align: center;
                  padding: 20px;
                }
                .header img {
                  max-width: 120px;
                  margin-bottom: 10px;
                }
                .header h1 {
                  margin: 0;
                  font-size: 22px;
                  font-weight: bold;
                }
                .content {
                  background: linear-gradient(135deg, #ff6600, #ff914d);
                  padding: 25px;
                  color: #333;
                }
                .field {
                  margin-bottom: 20px;
                }
                .label {
                  font-weight: bold;
                  font-size: 14px;
                  margin-bottom: 5px;
                  display: block;
                  color: #fff;
                  font-weight: bold;
                }
                .value {
                  font-size: 15px;
                  color: #111;
                }
                .message-box {
                  background: #f9f9f9;
                  padding: 15px;
                  border-radius: 6px;
                  border: 1px solid #ddd;
                  font-size: 14px;
                  line-height: 1.5;
                  white-space: pre-line;
                }
                .footer {
                  background: linear-gradient(135deg, #ff6600, #ff914d);
                  text-align: center;
                  padding: 15px;
                  font-size: 12px;
                  color: #fff;
                  font-weight: bold;
                  border-top: 1px solid #eee;
                }
                .footer a {
                  color: #ff6600;
                  text-decoration: none;
                  font-weight: bold;
                }
                .logo {
                  color: white !important;
                  background-color: white
                }
                .title {
                  color: #ff6600;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                    <img class="logo" src="https://travelkit.com.tr/images/logo.png" alt="TravelKit Logo">
                    <h1 class="title">Yeni İletişim Mesajı</h1>
                </div>
                <div class="content">
                  <div class="field">
                    <span class="label">Gönderen:</span>
                    <div class="value">${name}</div>
                  </div>
                  <div class="field">
                    <span class="label">E-posta:</span>
                    <div class="value">${email}</div>
                  </div>
                  <div class="field">
                    <span class="label">Mesaj:</span>
                    <div class="message-box">${message.replace(/\n/g, '\n')}</div>
                  </div>
                </div>
                <div class="footer">
                  Bu mesaj <strong>travelkit.com.tr</strong> web sitesi üzerinden gönderildi.<br>
                  Cevaplamak için: <a href="mailto:${email}">${email}</a>
                </div>
              </div>
            </body>
            </html>
          `
        );

        if (emailResult.success) {
          console.log('✅ Nodemailer ile email gönderildi');
          emailSuccess = true;
        } else {
          console.error('❌ Nodemailer hatası:', emailResult.error);
          emailSuccess = false;
        }
      } catch (nodemailerError) {
        console.error('❌ Nodemailer exception:', {
          error: nodemailerError,
          message: nodemailerError.message,
          stack: nodemailerError.stack
        });
        emailSuccess = false;
      }
    }

    // Response döndür
    if (dbSuccess && emailSuccess) {
      console.log('🎉 Hem Postgres hem Email gönderimi başarılı');
      return res.status(200).json({
        success: true,
        message: 'Mesaj kaydedildi ve mail gönderildi'
      });
    } else if (dbSuccess && !emailSuccess) {
      console.log('⚠️ Postgres başarılı, Email başarısız');
      return res.status(200).json({
        success: true,
        message: 'Mesaj kaydedildi (email gönderilemedi)'
      });
    } else if (!dbSuccess && emailSuccess) {
      console.log('⚠️ Postgres başarısız, Email başarılı');
      return res.status(200).json({
        success: true,
        message: 'Email gönderildi (veritabanına kaydedilemedi)'
      });
    } else {
      console.log('❌ Hem Postgres hem Email başarısız');
      return res.status(500).json({
        success: false,
        message: 'Mesaj kaydedilemedi ve email gönderilemedi'
      });
    }

  } catch (error) {
    console.error('💥 Contact form genel hatası:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası. Lütfen tekrar deneyin.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// Messages endpoint - Supabase'den mesajları çek
app.get('/api/messages', async (req, res) => {
  try {
    console.log('📨 Fetching messages from Supabase...');

    // Supabase'den mesajları çek
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({
        error: 'Database error',
        message: error.message
      });
    }

    console.log('📩 Mesajlar yüklendi:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Messages endpoint error:', error);
    res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
});

// 404 handler - en sona koy
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
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
