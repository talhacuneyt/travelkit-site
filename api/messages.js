import pkg from 'pg';

const { Pool } = pkg;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;
  try {
    // Connect to database
    client = await pool.connect();

    if (req.method === 'GET') {
      // Get all messages
      const result = await client.query(
        'SELECT id, name, email, message, created_at FROM messages ORDER BY created_at DESC'
      );

      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });

    } else if (req.method === 'POST') {
      // Create new message (if needed for admin panel)
      const { name, email, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
      }

      const result = await client.query(
        'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3) RETURNING *',
        [name, email, message]
      );

      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });

    } else if (req.method === 'PATCH') {
      // Update message (mark as read, etc.)
      const { id } = req.query;
      const { is_read } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Message ID is required' });
      }

      const result = await client.query(
        'UPDATE messages SET is_read = $1 WHERE id = $2 RETURNING *',
        [is_read || false, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });

    } else if (req.method === 'DELETE') {
      // Delete message or delete all
      const { id } = req.query;

      if (id === 'delete-all') {
        // Delete all messages
        const result = await client.query('DELETE FROM messages RETURNING *');

        return res.status(200).json({
          success: true,
          message: 'All messages deleted successfully',
          deletedCount: result.rows.length
        });
      } else if (id) {
        // Delete single message
        const result = await client.query(
          'DELETE FROM messages WHERE id = $1 RETURNING *',
          [id]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Message not found' });
        }

        return res.status(200).json({
          success: true,
          message: 'Message deleted successfully'
        });
      } else {
        return res.status(400).json({ error: 'Message ID is required' });
      }

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Messages API error:', error.message);
    return res.status(500).json({ error: error.message });
  } finally {
    if (client) {
      client.release();
    }
  }
}