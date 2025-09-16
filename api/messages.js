export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    // Mock messages data (gerçek implementasyon için database bağlantısı gerekir)
    const mockMessages = [
      {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message',
        is_read: false,
        created_at: new Date().toISOString()
      }
    ]
    
    return res.status(200).json(mockMessages)
  } catch (error) {
    console.error('Messages fetch error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}
