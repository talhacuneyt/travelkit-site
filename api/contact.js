import pkg from 'pg';
const { Pool } = pkg;

// Neon Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_kacwW2tmv8dh@ep-hidden-rain-agg3uf7b-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  console.log('🚀 Contact endpoint çağrıldı:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

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

    // 1. Neon'a kaydet
    console.log('💾 Neon\'a kaydetmeye başlanıyor...');
    let dbSuccess = false;
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          'INSERT INTO contact_messages (name, email, message, is_read, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [name, email, message, false, new Date().toISOString()]
        );

        console.log('✅ Yeni mesaj kaydedildi:', result.rows[0]);
        dbSuccess = true;
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('❌ Neon error:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack
      });
      dbSuccess = false;
    }

    // 2. Email gönderme kaldırıldı - sadece database'e kaydet
    const emailSuccess = true; // Email gönderme olmadığı için her zaman başarılı

    // Response döndür
    if (dbSuccess) {
      return res.status(200).json({
        success: true,
        message: 'Mesaj başarıyla kaydedildi'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Mesaj kaydedilemedi'
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
}
