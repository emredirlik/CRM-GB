# Gewürzberg CRM - PRD

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## Tamamlanan Özellikler (08.04.2026)

### Giderler & Faturalar (TAM FONKSİYONEL)
- **CamScanner Tarzı Kamera Tarayıcı** (YENİ!)
  - DocumentScanner.js bileşeni ile gerçek kamera erişimi
  - Vizör çerçevesi, köşe marker'ları
  - Flaş kontrolü (destekleyen cihazlarda)
  - Kamera değiştirme (ön/arka)
  - Görüntü iyileştirme (kontrast/parlaklık)
  - Çekilen fotoğraf OCR'a otomatik gönderilir
- PDF Yükleme (Drag & Drop + Dialog)
- Kategoriler: Otel, Kredi Kartı, DKV, Diğer Giderler
- Klasör oluşturma ve yönetimi
- **Excel - GB Ausnahmen 2026 Formatı:**
  - Ausgabenübersicht 2026 (Genel Özet)
  - Hotel sayfası
  - DKV 2026 sayfası
  - Kreditkarte 2026 sayfası
- OCR: PyMuPDF + pdfplumber + pytesseract
- Grid/List görünüm

### Grid Görünüm (TÜM MODÜLLER)
- Müşteriler: Temiz kartlar (checkbox kaldırıldı)
- Siparişler: Dropdown menülü kartlar
- Reçeteler: Grid/List seçeneği

### Mobil Uyumluluk
- Tüm butonlar mobilde erişilebilir
- Responsive grid (2 sütun mobilde)
- AI Chatbox navigasyonu engellemiyor

### Düzeltilen Sorunlar (08.04.2026)
- PDF Yükle dialog'undaki SelectItem boş string hatası düzeltildi
- IMAP bağlantısı devre dışı bırakıldı (artık uygulama bloklanmıyor)
- DocumentScanner bileşeni Expenses.js'e entegre edildi

## Bekleyen
- E-posta IMAP/SMTP sistemi (Kullanıcı CNAME kaydı yapınca aktifleştirilecek)

## Gelecek Görevler
- WhatsApp Business API entegrasyonu
- Otomatik Haftalık E-posta (CRON)
- AI Auto-Categorization for incoming emails
- Stok Takibi (Inventory)
- Fatura Yönetimi (Invoice Generation)
- Kampanya Yönetimi
- Multi-user Roles (Admin, Sales, etc.)

## Teknik Notlar
- Backend: FastAPI + MongoDB
- Frontend: React + TailwindCSS + Shadcn/UI
- OCR: PyMuPDF (fitz), pdfplumber, pytesseract
- Excel: openpyxl
