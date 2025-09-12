import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/nodejs';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://kegdhelzdksivfekktkx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZ2RoZWx6ZGtzaXZmZWtrdGt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNTA1NDgsImV4cCI6MjA3MjgyNjU0OH0.9srURxR_AsLu5lqwodeFuV-zsmkkr82PRh9RSToqQUU';

const supabase = createClient(supabaseUrl, supabaseKey);

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

    // 1. Supabase'e kaydet
    console.log('💾 Supabase\'e kaydetmeye başlanıyor...');
    let supabaseSuccess = false;
    try {
      const { data: contactData, error: dbError } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: name,
            email: email,
            message: message,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (dbError) {
        console.error('❌ Supabase kayıt hatası:', {
          error: dbError,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint
        });
        supabaseSuccess = false;
      } else {
        console.log('✅ Mesaj Supabase\'e kaydedildi:', contactData);
        supabaseSuccess = true;
      }
    } catch (dbError) {
      console.error('❌ Supabase bağlantı hatası:', {
        error: dbError,
        message: dbError.message,
        stack: dbError.stack
      });
      supabaseSuccess = false;
    }

    // 2. EmailJS ile email gönder
    console.log('📧 EmailJS ile email gönderilmeye başlanıyor...');
    let emailSuccess = false;
    try {
      const emailjsResult = await emailjs.send(
        'service_gkqoexj', // Service ID
        'template_97boikk', // Template ID
        {
          from_name: name,
          from_email: email,
          message: message,
          to_name: 'TravelKit',
          reply_to: email
        },
        {
          publicKey: 'YHkV0_Y_204JXzOSm' // Public Key
        }
      );

      console.log('✅ EmailJS ile email gönderildi:', {
        status: emailjsResult.status,
        text: emailjsResult.text
      });
      emailSuccess = true;

    } catch (emailjsError) {
      console.error('❌ EmailJS hatası:', {
        error: emailjsError,
        message: emailjsError.message,
        status: emailjsError.status,
        text: emailjsError.text
      });
      emailSuccess = false;
    }

    // Response döndür
    if (supabaseSuccess && emailSuccess) {
      console.log('🎉 Hem Supabase hem EmailJS başarılı');
      return res.status(200).json({
        success: true,
        message: 'Mesaj kaydedildi ve mail gönderildi'
      });
    } else if (supabaseSuccess && !emailSuccess) {
      console.log('⚠️ Supabase başarılı, EmailJS başarısız');
      return res.status(200).json({
        success: true,
        message: 'Mesaj kaydedildi (email gönderilemedi)'
      });
    } else if (!supabaseSuccess && emailSuccess) {
      console.log('⚠️ Supabase başarısız, EmailJS başarılı');
      return res.status(200).json({
        success: true,
        message: 'Email gönderildi (veritabanına kaydedilemedi)'
      });
    } else {
      console.log('❌ Hem Supabase hem EmailJS başarısız');
      return res.status(500).json({
        success: false,
        message: 'Mesaj kaydedilemedi ve email gönderilemedi'
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
