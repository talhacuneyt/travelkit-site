export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    const packages = {
      'ekonomik': {
        id: 'ekonomik',
        name: 'Ekonomik Paket',
        price: 299,
        features: ['Temel seyahat malzemeleri', '1 kişilik', 'Çanta dahil'],
        description: 'Uygun fiyatlı temel seyahat paketi',
        image: '/images/ekonomik.png'
      },
      'konforlu': {
        id: 'konforlu',
        name: 'Konforlu Paket',
        price: 499,
        features: ['Gelişmiş seyahat malzemeleri', '2 kişilik', 'Premium çanta dahil'],
        description: 'Konforlu seyahat deneyimi için ideal paket',
        image: '/images/orta.jpg'
      },
      'lux': {
        id: 'lux',
        name: 'Lux Paket',
        price: 799,
        features: ['Lüks seyahat malzemeleri', '4 kişilik', 'VIP çanta dahil'],
        description: 'En lüks seyahat deneyimi için premium paket',
        image: '/images/lux.png'
      }
    };

    const packageData = packages[id];
    
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Paket bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      data: packageData
    });

  } catch (error) {
    console.error('Package endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
