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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            // GET /api/messages - Tüm mesajları listele
            console.log('📨 Fetching messages from Neon...');

            const client = await pool.connect();
            try {
                const result = await client.query(`
          SELECT id, name, email, message, is_read, created_at 
          FROM contact_messages 
          ORDER BY created_at DESC
      `);

                console.log('📩 Mesajlar yüklendi:', result.rows.length);
                res.json(result.rows);
            } finally {
                client.release();
            }
        }
        else if (req.method === 'DELETE') {
            // DELETE /api/messages/:id - Mesaj sil veya DELETE /api/messages/delete-all - Tüm mesajları sil
            const { id } = req.query;

            if (id === 'delete-all') {
                // Tüm mesajları sil
                console.log('🗑️ Deleting all messages...');
                const client = await pool.connect();
                try {
                    const result = await client.query('DELETE FROM contact_messages RETURNING *');
                    console.log('✅ Tüm mesajlar silindi:', result.rows.length);
                    res.json({
                        success: true,
                        message: 'Tüm mesajlar başarıyla silindi',
                        deletedCount: result.rows.length
                    });
                } finally {
                    client.release();
                }
            } else {
                // Tek mesaj sil
                console.log('🗑️ Deleting message:', id);
                const client = await pool.connect();
                try {
                    const result = await client.query(
                        'DELETE FROM contact_messages WHERE id = $1 RETURNING *',
                        [id]
                    );
                    if (result.rows.length === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Mesaj bulunamadı'
                        });
                    }

                    console.log('✅ Mesaj silindi:', result.rows[0]);
                    res.json({
                        success: true,
                        message: 'Mesaj başarıyla silindi'
                    });
                } finally {
                    client.release();
                }
            }
        }
        else if (req.method === 'PATCH') {
            // PATCH /api/messages/:id - Mesaj güncelle (okundu işaretle)
            const { id } = req.query;
            const { is_read } = req.body;
            console.log('📝 Updating message:', id, 'is_read:', is_read);

            const client = await pool.connect();
            try {
                const result = await client.query(
                    'UPDATE contact_messages SET is_read = $1 WHERE id = $2 RETURNING *',
                    [is_read, id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Mesaj bulunamadı'
                    });
                }

                console.log('✅ Mesaj güncellendi:', result.rows[0]);
                res.json({
                    success: true,
                    message: 'Mesaj başarıyla güncellendi',
                    data: result.rows[0]
                });
            } finally {
                client.release();
            }
        }
        else {
            res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('❌ Messages endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
}