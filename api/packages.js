export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    res.status(200).json({
      success: true,
      data: packages
    });

  } catch (error) {
    console.error('Packages endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
