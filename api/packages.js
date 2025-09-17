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
    console.log('📦 Fetching packages from Neon...');

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, package_type, slug, title, description, price, sections, items, created_at, updated_at 
        FROM packages 
        ORDER BY id ASC
      `);

      console.log('📦 Packages loaded:', result.rows.length);
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Packages endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
