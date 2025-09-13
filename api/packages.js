export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://travelkit-site.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Cache control headers - fiyat değişikliklerini garanti etmek için
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('ETag', `"packages-${Date.now()}"`);

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
        formattedPrice: '₺299,00',
        features: ['Temel seyahat malzemeleri', '1 kişilik', 'Çanta dahil'],
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'konforlu',
        name: 'Konforlu Paket',
        price: 599,
        formattedPrice: '₺599,00',
        features: ['Gelişmiş seyahat malzemeleri', '2 kişilik', 'Premium çanta dahil'],
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'lux',
        name: 'Lux Paket',
        price: 999,
        formattedPrice: '₺999,00',
        features: ['Lüks seyahat malzemeleri', '4 kişilik', 'VIP çanta dahil'],
        lastUpdated: new Date().toISOString()
      }
    ];

    res.status(200).json({
      success: true,
      data: packages,
      version: '1.0.0',
      timestamp: new Date().toISOString()
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
