# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## ✅ Düzeltilen Sorunlar (Son Güncelleme)

### 1. PDF Yükle Çalışmıyordu ✅
- `FileResponse` import edilmemişti → Düzeltildi
- Upload API çalışıyor, test edildi

### 2. Excel Boş Geliyordu ✅
- API çalışıyor, 4 sayfa (Ausgabenübersicht, Hotel, DKV, Kreditkarte)
- 12 satır veri mevcut

### 3. PDF Görüntüleme Hatası ✅
- `FileResponse` import edildi
- Modal açılıyor, PDF görüntüleniyor

### 4. Klasör Silme ✅
- DELETE endpoint eklendi
- Hover ile silme butonu görünür

### 5. PDF Birleştirme ✅ (YENİ)
- PyPDF2 ile toplu PDF birleştirme
- Klasör bazlı veya seçili giderler birleştirilebilir
- Mor "PDF Birleştir" butonu eklendi

## Mevcut Özellikler

### Giderler & Faturalar
- PDF Yükleme (drag & drop + dialog)
- CamScanner tarzı kamera tarama (DocumentScanner)
- OCR (PyMuPDF + pdfplumber + pytesseract)
- PDF Birleştirme (klasör bazlı)
- Excel Export (GB Ausnahmen 2026 formatı)
- PDF Rapor
- Klasör yönetimi (oluştur, sil)
- Kategori filtreleme (Otel, Kredi Kartı, DKV, Diğer)
- Grid/List görünüm

### Müşteriler
- Liste ve Grid görünüm
- PDF ve Excel export
- CRUD işlemleri

## API Endpoints

### Expenses
- `GET /api/expenses` - Tüm giderler
- `POST /api/expenses/upload` - PDF yükleme
- `POST /api/expenses/scan-ocr` - OCR tarama
- `GET /api/expenses/{id}/view` - PDF görüntüleme
- `POST /api/expenses/merge-pdfs` - PDF birleştirme
- `GET /api/expenses/export/excel` - Excel export
- `GET /api/expenses/report/pdf` - PDF rapor

### Folders
- `GET /api/expense-folders` - Klasörler
- `POST /api/expense-folders` - Klasör oluştur
- `DELETE /api/expense-folders/{id}` - Klasör sil

## Bekleyen
- E-posta IMAP/SMTP (CNAME kaydı bekleniyor)

## Gelecek Görevler
- WhatsApp Business API
- Stok Takibi
- Fatura Yönetimi
