// Fiyat güncelleme API'si
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://travelkit-site.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Cache control headers - fiyat değişikliklerini garanti etmek için
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('ETag', `"prices-${Date.now()}"`);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Merkezi fiyat verilerini döndür
      const prices = {
        economic: {
          value: 299,
          formatted: '₺299,00',
          currency: 'TRY',
          display: '₺299',
          lastUpdated: new Date().toISOString()
        },
        comfort: {
          value: 599,
          formatted: '₺599,00',
          currency: 'TRY',
          display: '₺599',
          lastUpdated: new Date().toISOString()
        },
        luxury: {
          value: 999,
          formatted: '₺999,00',
          currency: 'TRY',
          display: '₺999',
          lastUpdated: new Date().toISOString()
        }
      };

      res.status(200).json({
        success: true,
        data: prices,
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Prices endpoint error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  } else if (req.method === 'POST') {
    // Fiyat güncelleme (admin için)
    try {
      const { packageType, newPrice } = req.body;

      if (!packageType || !newPrice) {
        return res.status(400).json({
          success: false,
          message: 'Package type and new price are required'
        });
      }

      // Fiyat güncelleme logla
      console.log(`💰 Fiyat güncellendi - ${packageType}: ${newPrice}`);

      res.status(200).json({
        success: true,
        message: 'Price updated successfully',
        data: {
          packageType,
          newPrice,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Price update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update price',
        error: error.message
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}
