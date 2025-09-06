const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const kuveytTurkService = require('./services/kuveytTurkService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TravelKit Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Ödeme oturumu oluştur
app.post('/api/payments/create-session', async (req, res) => {
  try {
    const { 
      packageType, 
      packageTitle, 
      packagePrice, 
      customerInfo, 
      paymentMethod 
    } = req.body;

    // Fiyatı sayıya çevir (₺ işaretini kaldır)
    const amount = parseFloat(packagePrice.replace('₺', '').replace(',', ''));
    
    // Sipariş ID oluştur
    const orderId = `TK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const paymentData = {
      amount: amount,
      orderId: orderId,
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      billingAddress: customerInfo.address,
      packageType: packageType,
      packageTitle: packageTitle,
      paymentMethod: paymentMethod
    };

    let result;
    
    // Geliştirme ortamında test ödeme kullan
    if (process.env.NODE_ENV === 'development') {
      result = await kuveytTurkService.createTestPayment(paymentData);
    } else {
      result = await kuveytTurkService.createPaymentSession(paymentData);
    }

    if (result.success) {
      res.json({
        success: true,
        sessionId: result.sessionId,
        paymentUrl: result.paymentUrl,
        orderId: orderId,
        amount: amount,
        message: 'Ödeme oturumu başarıyla oluşturuldu'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Payment session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası: Ödeme oturumu oluşturulamadı'
    });
  }
});

// Ödeme durumunu kontrol et
app.get('/api/payments/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    let result;
    
    if (process.env.NODE_ENV === 'development') {
      // Test ortamında sabit response
      result = {
        success: true,
        status: 'completed',
        data: {
          sessionId: sessionId,
          status: 'completed',
          amount: 299,
          currency: 'TRY'
        }
      };
    } else {
      result = await kuveytTurkService.checkPaymentStatus(sessionId);
    }

    if (result.success) {
      res.json({
        success: true,
        status: result.status,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası: Ödeme durumu kontrol edilemedi'
    });
  }
});

// Webhook endpoint (Kuveyt Türk'tan gelen bildirimler)
app.post('/api/payments/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    const signature = req.headers['x-kuveyt-turk-signature'];
    const payload = req.body;

    // Webhook doğrulama
    if (!kuveytTurkService.verifyWebhook(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const webhookData = JSON.parse(payload);
    
    // Webhook işlemleri
    console.log('Webhook received:', webhookData);
    
    // Burada ödeme durumuna göre işlemler yapılabilir
    // - Veritabanı güncelleme
    // - E-posta gönderme
    // - Stok güncelleme vb.

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Test ödeme sayfası (geliştirme ortamı için)
app.get('/api/payments/test-success', (req, res) => {
  res.json({
    success: true,
    message: 'Test ödeme başarılı',
    sessionId: req.query.sessionId || 'test_session'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Sunucu hatası'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint bulunamadı'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TravelKit Backend API running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5174'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
