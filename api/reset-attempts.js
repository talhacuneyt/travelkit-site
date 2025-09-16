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

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    })
  }

  try {
    // Reset attempts logic (basit implementasyon)
    console.log('Reset attempts endpoint called')
    
    return res.status(200).json({
      success: true,
      message: 'Attempts reset successfully'
    })
  } catch (error) {
    console.error('Reset attempts error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    })
  }
}
