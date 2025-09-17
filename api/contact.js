import pkg from 'pg';
import nodemailer from 'nodemailer';

const { Pool } = pkg;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Sanitize inputs
    const sanitizedName = name.trim().substring(0, 100);
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedMessage = message.trim().substring(0, 1000);

    let client;
    try {
      // Connect to database
      client = await pool.connect();
      
      // Insert message into database
      const dbResult = await client.query(
        'INSERT INTO messages (name, email, message) VALUES ($1, $2, $3) RETURNING id, created_at',
        [sanitizedName, sanitizedEmail, sanitizedMessage]
      );

      console.log('Message saved to database:', dbResult.rows[0].id);

      // Send email notification
      try {
        const transporter = createTransporter();
        
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `New Contact Message from ${sanitizedName}`,
          html: `
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${sanitizedName}</p>
            <p><strong>Email:</strong> ${sanitizedEmail}</p>
            <p><strong>Message:</strong></p>
            <p>${sanitizedMessage.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Received at: ${new Date().toLocaleString()}</small></p>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
        // Don't fail the request if email fails, just log it
      }

      return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        id: dbResult.rows[0].id
      });

    } finally {
      if (client) {
        client.release();
      }
    }

  } catch (error) {
    console.error('Contact form error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}