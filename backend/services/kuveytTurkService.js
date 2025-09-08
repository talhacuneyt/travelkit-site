const axios = require('axios');

class KuveytTurkService {
  constructor() {
    this.merchantId = process.env.KUVEYT_TURK_MERCHANT_ID;
    this.apiKey = process.env.KUVEYT_TURK_API_KEY;
    this.secretKey = process.env.KUVEYT_TURK_SECRET_KEY;
    this.baseUrl = process.env.KUVEYT_TURK_BASE_URL || 'https://api.kuveytturk.com.tr';
  }

  // Ödeme oturumu oluştur
  async createPaymentSession(paymentData) {
    try {
      const sessionData = {
        merchantId: this.merchantId,
        amount: paymentData.amount,
        currency: 'TRY',
        orderId: paymentData.orderId,
        customerInfo: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone
        },
        billingAddress: {
          address: paymentData.billingAddress,
          city: paymentData.city || 'İstanbul',
          country: 'TR'
        },
        returnUrl: `${process.env.FRONTEND_URL}/satin-al/success`,
        cancelUrl: `${process.env.FRONTEND_URL}/satin-al/cancel`,
        webhookUrl: `${process.env.BACKEND_URL}/api/payments/webhook`
      };

      const response = await axios.post(`${this.baseUrl}/api/v1/payments/sessions`, sessionData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Merchant-Id': this.merchantId
        }
      });

      return {
        success: true,
        sessionId: response.data.sessionId,
        paymentUrl: response.data.paymentUrl,
        data: response.data
      };
    } catch (error) {
      console.error('Kuveyt Türk API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Ödeme oturumu oluşturulamadı'
      };
    }
  }

  // Ödeme durumunu kontrol et
  async checkPaymentStatus(sessionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/payments/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Merchant-Id': this.merchantId
        }
      });

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      console.error('Payment Status Check Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Ödeme durumu kontrol edilemedi'
      };
    }
  }

  // Webhook doğrulama
  verifyWebhook(payload, signature) {
    try {
      // Kuveyt Türk webhook imzasını doğrula
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  // Test ödeme (geliştirme ortamı için)
  async createTestPayment(paymentData) {
    // Geliştirme ortamında gerçek API çağrısı yapmadan test
    return {
      success: true,
      sessionId: `test_${Date.now()}`,
      paymentUrl: `${process.env.FRONTEND_URL}/satin-al/test-payment`,
      data: {
        amount: paymentData.amount,
        currency: 'TRY',
        orderId: paymentData.orderId,
        status: 'pending'
      }
    };
  }
}

module.exports = new KuveytTurkService();

