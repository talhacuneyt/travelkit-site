-- TravelKit Packages Table
CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  package_type VARCHAR(50) UNIQUE NOT NULL, -- 'economic', 'comfort', 'lux'
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sections JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default packages
INSERT INTO packages (package_type, title, description, price, sections, items) VALUES
('economic', 'Ekonomik', 'Seyahate zahmetsiz ve eksiksiz bir başlangıç yapmak isteyenler için, akıllı ve şık bir çözüm.', 299.00, 
 '{"personalCare": "Kişisel Bakım Ürünleri", "comfort": "Konfor", "technology": "Teknoloji", "health": "Sağlık / İlk Yardım", "additions": "Ekonomik Paket Eklemeleri"}',
 '{"personalCare": ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"], "comfort": ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem"], "technology": ["Powerbank", "Çoklu Fonksiyonlu Kablo"], "health": ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"], "additions": ["Bavul İçi Düzenleyici", "Boyun Yastığı", "Seyahat Terliği", "QR Kart, müzik listesi", "Lavanta kesesi"]}'),

('comfort', 'Konforlu', 'Seyahatinizi daha konforlu hale getiren gelişmiş malzemelerle donatılmış paket.', 499.00,
 '{"personalCare": "Kişisel Bakım Ürünleri", "comfort": "Konfor", "technology": "Teknoloji", "health": "Sağlık / İlk Yardım", "additions": "Konforlu Paket Eklemeleri"}',
 '{"personalCare": ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"], "comfort": ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem", "Boyun Yastığı", "Seyahat Terliği"], "technology": ["Powerbank", "Çoklu Fonksiyonlu Kablo", "Bluetooth Kulaklık"], "health": ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"], "additions": ["Bavul İçi Düzenleyici", "QR Kart, müzik listesi", "Lavanta kesesi", "Seyahat Yastığı"]}'),

('lux', 'Lux', 'En lüks seyahat deneyimi için özel olarak seçilmiş premium malzemeler.', 799.00,
 '{"personalCare": "Kişisel Bakım Ürünleri", "comfort": "Konfor", "technology": "Teknoloji", "health": "Sağlık / İlk Yardım", "additions": "Lux Paket Eklemeleri"}',
 '{"personalCare": ["Diş Fırçası & Macun", "Şampuan & Duş Jeli", "Deodorant", "Güneş Kremi", "El Kremi", "Islak Mendil", "Mikrofiber Havlu", "Çamaşır Torbası", "Dezenfektan"], "comfort": ["Kulak Tıkacı", "Göz Bandı", "Seyahat Defteri & Kalem", "Boyun Yastığı", "Seyahat Terliği", "Premium Seyahat Yastığı"], "technology": ["Powerbank", "Çoklu Fonksiyonlu Kablo", "Bluetooth Kulaklık", "Seyahat Adaptörü"], "health": ["Ağrı Kesici", "Basit Alerji İlacı", "Yara Bandı", "Antiseptik Krem", "Burun Spreyi", "Maske", "Sineksavar"], "additions": ["Bavul İçi Düzenleyici", "QR Kart, müzik listesi", "Lavanta kesesi", "Premium Seyahat Yastığı", "VIP Çanta"]}');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access" ON packages FOR SELECT USING (true);

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated users can update" ON packages FOR UPDATE USING (true);
