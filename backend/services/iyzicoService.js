const Iyzipay = require('iyzipay');
const crypto = require('crypto');

class IyzicoService {
  constructor() {
    this.iyzipay = new Iyzipay({
      apiKey: process.env.IYZICO_API_KEY || 'sandbox-API_KEY',
      secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-SECRET_KEY',
      uri: process.env.IYZICO_URI || 'https://sandbox-api.iyzipay.com'
    });
  }

  // Ödeme formu oluştur
  async createPaymentForm(paymentData) {
    try {
      const {
        amount,
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        billingAddress,
        packageType,
        packageTitle,
        returnUrl,
        cancelUrl
      } = paymentData;

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: orderId,
        price: amount.toString(),
        paidPrice: amount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        installment: '1',
        basketId: orderId,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: process.env.IYZICO_CALLBACK_URL || 'http://localhost:3001/api/payments/iyzico-callback',
        enabledInstallments: [2, 3, 6, 9],
        buyer: {
          id: `BY${Date.now()}`,
          name: customerName,
          surname: customerName.split(' ')[1] || customerName,
          gsmNumber: customerPhone,
          email: customerEmail,
          identityNumber: '11111111111',
          lastLoginDate: new Date().toISOString().split('T')[0] + ' 12:00:00',
          registrationDate: new Date().toISOString().split('T')[0] + ' 12:00:00',
          registrationAddress: billingAddress,
          ip: '127.0.0.1',
          city: 'Istanbul',
          country: 'Turkey',
          zipCode: '34000'
        },
        shippingAddress: {
          contactName: customerName,
          city: 'Istanbul',
          country: 'Turkey',
          address: billingAddress,
          zipCode: '34000'
        },
        billingAddress: {
          contactName: customerName,
          city: 'Istanbul',
          country: 'Turkey',
          address: billingAddress,
          zipCode: '34000'
        },
        basketItems: [
          {
            id: packageType,
            name: packageTitle,
            category1: 'Travel Kit',
            category2: 'Package',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: amount.toString()
          }
        ]
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.threedsInitialize.create(request, (err, result) => {
          if (err) {
            console.error('Iyzico payment form creation error:', err);
            reject({
              success: false,
              error: 'Ödeme formu oluşturulamadı: ' + err.errorMessage
            });
          } else {
            if (result.status === 'success') {
              resolve({
                success: true,
                paymentId: result.paymentId,
                paymentPageUrl: result.paymentPageUrl,
                token: result.token,
                conversationId: result.conversationId
              });
            } else {
              reject({
                success: false,
                error: 'Ödeme formu oluşturulamadı: ' + result.errorMessage
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Iyzico service error:', error);
      return {
        success: false,
        error: 'Ödeme servisi hatası: ' + error.message
      };
    }
  }

  // Ödeme durumunu kontrol et
  async checkPaymentStatus(paymentId) {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        paymentId: paymentId
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.payment.retrieve(request, (err, result) => {
          if (err) {
            console.error('Iyzico payment status check error:', err);
            reject({
              success: false,
              error: 'Ödeme durumu kontrol edilemedi: ' + err.errorMessage
            });
          } else {
            if (result.status === 'success') {
              resolve({
                success: true,
                status: result.paymentStatus,
                data: {
                  paymentId: result.paymentId,
                  status: result.paymentStatus,
                  amount: result.paidPrice,
                  currency: result.currency,
                  conversationId: result.conversationId,
                  paymentItems: result.paymentItems
                }
              });
            } else {
              reject({
                success: false,
                error: 'Ödeme durumu alınamadı: ' + result.errorMessage
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Iyzico payment status check error:', error);
      return {
        success: false,
        error: 'Ödeme durumu kontrol hatası: ' + error.message
      };
    }
  }

  // Webhook doğrulama
  verifyWebhook(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.IYZICO_SECRET_KEY || 'sandbox-SECRET_KEY')
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
    try {
      // Test ortamında sabit bir ödeme URL'si döndür
      const testPaymentUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/satin-al?test-payment=true&orderId=${paymentData.orderId}&amount=${paymentData.amount}`;
      
      return {
        success: true,
        paymentId: `test_${Date.now()}`,
        paymentPageUrl: testPaymentUrl,
        token: `test_token_${Date.now()}`,
        conversationId: paymentData.orderId
      };
    } catch (error) {
      console.error('Test payment creation error:', error);
      return {
        success: false,
        error: 'Test ödeme oluşturulamadı: ' + error.message
      };
    }
  }

  // Ödeme iptal et
  async cancelPayment(paymentId, reason = 'CUSTOMER_CANCELLATION') {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        paymentId: paymentId,
        ip: '127.0.0.1',
        reason: reason
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.cancel.create(request, (err, result) => {
          if (err) {
            console.error('Iyzico payment cancellation error:', err);
            reject({
              success: false,
              error: 'Ödeme iptal edilemedi: ' + err.errorMessage
            });
          } else {
            if (result.status === 'success') {
              resolve({
                success: true,
                message: 'Ödeme başarıyla iptal edildi',
                data: result
              });
            } else {
              reject({
                success: false,
                error: 'Ödeme iptal edilemedi: ' + result.errorMessage
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Iyzico payment cancellation error:', error);
      return {
        success: false,
        error: 'Ödeme iptal hatası: ' + error.message
      };
    }
  }

  // İade işlemi
  async refundPayment(paymentId, amount, reason = 'CUSTOMER_REFUND') {
    try {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        paymentId: paymentId,
        price: amount.toString(),
        ip: '127.0.0.1',
        reason: reason
      };

      return new Promise((resolve, reject) => {
        this.iyzipay.refund.create(request, (err, result) => {
          if (err) {
            console.error('Iyzico payment refund error:', err);
            reject({
              success: false,
              error: 'İade işlemi yapılamadı: ' + err.errorMessage
            });
          } else {
            if (result.status === 'success') {
              resolve({
                success: true,
                message: 'İade işlemi başarıyla tamamlandı',
                data: result
              });
            } else {
              reject({
                success: false,
                error: 'İade işlemi yapılamadı: ' + result.errorMessage
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Iyzico payment refund error:', error);
      return {
        success: false,
        error: 'İade işlemi hatası: ' + error.message
      };
    }
  }
}

module.exports = new IyzicoService();
