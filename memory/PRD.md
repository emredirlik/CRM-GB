# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM - Giderler & Faturalar modülü

## ✅ Tamamlanan Özellikler

### 1. CamScanner Tarzı Belge Tarama (OpenCV) ✅ (YENİ)
- Kameradan çekilen fotoğraf backend'e gönderiliyor
- OpenCV ile otomatik kenar algılama (Canny edge detection)
- 4 köşe tespiti ve perspektif düzeltme
- Adaptive thresholding ile siyah-beyaz dönüşüm
- Kullanıcıya "Orijinal" ve "Taranmış" görüntü arasında geçiş imkanı
- OCR ile tarih, tutar ve satıcı bilgisi otomatik algılama
- İşlenmiş görüntü base64 olarak frontend'e döndürülüyor

### 2. PDF Birleştirme - Klasör Seçimi ✅ (YENİ)
- PDF Birleştir butonu dropdown menüye dönüştürüldü
- "Klasörsüz" seçeneği: Sadece klasöre atanmamış PDF'leri birleştirir
- Klasör seçimi: Seçilen klasördeki PDF'leri birleştirir
- Her klasör ayrı ayrı listelenmiş

### 3. Çoklu Dil Desteği (TR/DE/EN/PL) ✅
- Tüm butonlar ve metinler çevrildi
- Sidebar ve menüler tüm dillerde çalışıyor

### 4. GB Ausnahmen Excel Formatı ✅
- 4 Sayfa: Ausgabenübersicht, Hotel, DKV, Kreditkarte
- Hotel: Hotelname, Check-In, Check-Out, Land, Nacht, Preis, Adresse

### 5. Otel Özel Form Alanları ✅
- Check-In, Check-Out, Gece Sayısı (mavi kutuda)
- Dinamik form (kategori değişince alanlar değişir)

### 6. Hiyerarşik Yıl/Ay Seçimi ✅
- YIL ve AY dropdown'ları
- Excel ve Rapor filtreleme

### 7. E-posta IMAP Sistemi ✅
- `/api/mail/inbox` endpoint çalışıyor
- 403+ e-posta başarıyla listeleniyor

## API Endpoints

### CamScanner Tarama
- `POST /api/expenses/scan-ocr`
- Response: `{success, processed_image (base64), vendor, date, total}`

### PDF Birleştirme
- `POST /api/expenses/merge-pdfs`
- Body: `{"folder_id": "xxx"}` veya `{"expense_ids": ["id1", "id2"]}`

### Excel Export
- `GET /api/expenses/export/excel?year=2026&month=4`

### E-posta
- `GET /api/mail/inbox` - Gelen kutusu

## Teknoloji Yığını
- Frontend: React.js, TailwindCSS, Shadcn/UI
- Backend: FastAPI, Python
- Database: MongoDB
- Görüntü İşleme: OpenCV (opencv-python-headless)
- PDF İşleme: PyPDF2, PyMuPDF
- Excel: openpyxl

## Gelecek Görevler
- WhatsApp Business API (P1)
- Otomatik Haftalık Email (P1)
- AI Auto-Kategorileme (P2)
- Stok Takibi (P2)
- Fatura Yönetimi (P2)
