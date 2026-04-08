# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## ✅ Son Eklenen Özellikler

### 1. Klasör Navigasyonu ✅
- Klasöre tıklayınca içine giriyor
- Breadcrumb: "Ana Dizin / Klasör Adı"
- "← Geri" butonu ile üst klasöre dönme
- Alt klasör sayısı badge ile gösteriliyor

### 2. PDF Klasöre Taşıma ✅
- Her gider kartında dropdown menü (üç nokta)
- "Klasörden Çıkar" seçeneği
- "X Klasörüne Taşı" seçenekleri

### 3. PDF Önizleme ✅
- Modal içinde PDF görüntüleme (object/embed tag)
- "İndir" butonu
- Geniş modal (max-w-5xl, 80vh yükseklik)

### 4. Aylık/Yıllık Rapor ✅
- Rapor butonu dropdown menü
- "Tüm Giderler", "Aylık Rapor", "Yıllık Rapor"

### 5. Alt Klasör (Nested Folders) ✅
- Klasör içinde klasör oluşturma
- Parent klasör seçimi

### 6. Excel Export ✅
- 4 sayfa: Ausgabenübersicht, Hotel, DKV, Kreditkarte
- Tüm gider verileri dahil

## API Endpoints

### Expenses
- `PUT /api/expenses/{id}` - Gideri güncelle (klasöre taşı)
- `GET /api/expenses?folder_id=xxx` - Klasöre göre filtrele

### Reports
- `GET /api/expenses/report/pdf?report_type=monthly&month=4&year=2026`
- `GET /api/expenses/report/pdf?report_type=yearly&year=2026`

### Folders
- `POST /api/expense-folders` - `{name, category, parent_id}`
- `GET /api/expense-folders` - path ve children_count dahil

## Bekleyen
- E-posta IMAP/SMTP (CNAME kaydı bekleniyor)

## Gelecek Görevler
- WhatsApp Business API
- Stok Takibi
- Fatura Yönetimi
