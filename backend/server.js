import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TravelKit Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Payment endpoints
app.post('/api/payments/create-session', async (req, res) => {
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

app.post('/api/payments/verify', async (req, res) => {
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
app.post('/api/send-sms', async (req, res) => {
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