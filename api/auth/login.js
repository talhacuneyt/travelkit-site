import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://travelkit-site.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Mock user data (in production, this would come from a database)
    const users = {
      'admin': {
        username: 'admin',
        email: 'cuneytosmanlioglu@gmail.com',
        passwordHash: '$2a$10$qvfNmGtdCToH6sxPiQl70On1lYVxbJdww9ZC/0/psThHPQynh2.5q',
        isActive: true,
        role: 'admin'
      }
    };

    const user = users[username];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Böyle bir kullanıcı yok'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Hesap deaktif'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      username: user.username,
      email: user.email,
      role: user.role,
      loginTime: Date.now(),
      sessionId: Math.random().toString(36).substring(2, 15)
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'fallback-secret-key', {
      expiresIn: '24h'
    });

    res.status(200).json({
      success: true,
      message: 'Giriş başarılı',
      token: token,
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası. Lütfen tekrar deneyin.',
      error: error.message
    });
  }
}
