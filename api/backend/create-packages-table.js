import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Postgres pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:YOUR_PASSWORD@ep-rough-king-a5q8q8q8.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createPackagesTable() {
  try {
    console.log('🚀 Creating packages table in NeonDB...');
    
    const client = await pool.connect();
    
    try {
      // Create packages table
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS packages (
          id SERIAL PRIMARY KEY,
          package_type VARCHAR(50) UNIQUE NOT NULL,
          slug VARCHAR(50) UNIQUE NOT NULL,
          title VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          sections JSONB NOT NULL DEFAULT '{}',
          items JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      await client.query(createTableQuery);
      console.log('✅ Packages table created');
      
      // Insert default packages
      const insertQuery = `
        INSERT INTO packages (package_type, slug, title, description, price, sections, items) VALUES
        ('economic', 'economic', 'Ekonomik', 'Seyahate zahmetsiz ve eksiksiz bir başlangıç yapmak isteyenler için, akıllı ve şık bir çözüm.', 299.00, 
         '{"personalCare": "Kişisel Bakım Ürünleri", "comfort": "Konfor", "technology": "Teknoloji", "health": "Sağlık / İlk Yardım", "additions": "Ekonomik Paket Eklemeleri"}',
         '{"personalCare": ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"], "comfort": ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem"], "technology": ["Powerbank", "Çoklu Fonksiyonlu Kablo"], "health": ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"], "additions": ["Bavul İçi Düzenleyici", "Boyun Yastığı", "Seyahat Terliği", "QR Kart, müzik listesi", "Lavanta kesesi"]}'),
        
        ('comfort', 'comfort', 'Konforlu', 'Seyahatinizi daha konforlu hale getiren gelişmiş malzemelerle donatılmış paket.', 499.00,
         '{"personalCare": "Kişisel Bakım Ürünleri", "comfort": "Konfor", "technology": "Teknoloji", "health": "Sağlık / İlk Yardım", "additions": "Konforlu Paket Eklemeleri"}',
         '{"personalCare": ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"], "comfort": ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem", "Boyun Yastığı", "Seyahat Terliği"], "technology": ["Powerbank", "Çoklu Fonksiyonlu Kablo", "Bluetooth Kulaklık"], "health": ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"], "additions": ["Bavul İçi Düzenleyici", "QR Kart, müzik listesi", "Lavanta kesesi", "Seyahat Yastığı"]}'),
        
        ('lux', 'lux', 'Lux', 'En lüks seyahat deneyimi için özel olarak seçilmiş premium malzemeler.', 799.00,
         '{"personalCare": "Kişisel Bakım Ürünleri", "comfort": "Konfor", "technology": "Teknoloji", "health": "Sağlık / İlk Yardım", "additions": "Lux Paket Eklemeleri"}',
         '{"personalCare": ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"], "comfort": ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem", "Boyun Yastığı", "Seyahat Terliği", "Premium Seyahat Yastığı"], "technology": ["Powerbank", "Çoklu Fonksiyonlu Kablo", "Bluetooth Kulaklık", "Seyahat Adaptörü"], "health": ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"], "additions": ["Bavul İçi Düzenleyici", "QR Kart, müzik listesi", "Lavanta kesesi", "Premium Seyahat Yastığı", "VIP Çanta"]}')
        ON CONFLICT (package_type) DO NOTHING;
      `;
      
      await client.query(insertQuery);
      console.log('✅ Default packages inserted');
      
      // Verify the data
      const verifyQuery = 'SELECT package_type, slug, title, price FROM packages ORDER BY id';
      const verifyResult = await client.query(verifyQuery);
      
      console.log('📊 Packages in database:');
      verifyResult.rows.forEach(row => {
        console.log(`  - ${row.package_type} (slug: ${row.slug}) - ${row.title} - ₺${row.price}`);
      });
      
      console.log('🎉 Packages table setup completed successfully!');
      
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error creating packages table:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createPackagesTable();
