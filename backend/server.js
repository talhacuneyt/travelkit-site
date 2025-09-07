const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const iyzicoService = require('./services/iyzicoService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://travelkit-site.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:5174'
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
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
    
    // Iyzico ile ödeme formu oluştur
    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/satin-al?success=true&orderId=${orderId}`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/satin-al?cancel=true&orderId=${orderId}`;
    
    const iyzicoData = {
      ...paymentData,
      returnUrl,
      cancelUrl
    };

    // Geliştirme ortamında test ödeme kullan
    if (process.env.NODE_ENV === 'development') {
      result = await iyzicoService.createTestPayment(iyzicoData);
    } else {
      result = await iyzicoService.createPaymentForm(iyzicoData);
    }

    if (result.success) {
      res.json({
        success: true,
        sessionId: result.paymentId,
        paymentUrl: result.paymentPageUrl,
        orderId: orderId,
        amount: amount,
        token: result.token,
        message: 'Iyzico ödeme formu başarıyla oluşturuldu'
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
app.get('/api/payments/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    let result;
    
    if (process.env.NODE_ENV === 'development') {
      // Test ortamında sabit response
      result = {
        success: true,
        status: 'completed',
        data: {
          paymentId: paymentId,
          status: 'completed',
          amount: 299,
          currency: 'TRY'
        }
      };
    } else {
      result = await iyzicoService.checkPaymentStatus(paymentId);
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

// Iyzico callback endpoint
app.post('/api/payments/iyzico-callback', (req, res) => {
  try {
    const { token, status, paymentId } = req.body;
    
    console.log('Iyzico callback received:', { token, status, paymentId });
    
    // Callback işlemleri
    if (status === 'success') {
      // Başarılı ödeme işlemleri
      console.log('Payment successful:', paymentId);
    } else {
      // Başarısız ödeme işlemleri
      console.log('Payment failed:', paymentId);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Iyzico callback processing error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Webhook endpoint (Iyzico'dan gelen bildirimler)
app.post('/api/payments/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    const signature = req.headers['x-iyzico-signature'];
    const payload = req.body;

    // Webhook doğrulama
    if (!iyzicoService.verifyWebhook(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const webhookData = JSON.parse(payload);
    
    // Webhook işlemleri
    console.log('Iyzico webhook received:', webhookData);
    
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

