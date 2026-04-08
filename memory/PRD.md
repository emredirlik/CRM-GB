# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## ✅ Son Düzeltmeler

### 1. Excel Export ✅
- API çalışıyor (4 sayfa: Ausgabenübersicht, Hotel, DKV, Kreditkarte)
- 13 satır veri test edildi
- NOT: Tarayıcınızda Excel açılmıyorsa veya boş görünüyorsa, dosyayı bilgisayarınıza indirip Microsoft Excel veya LibreOffice ile açın

### 2. PDF Görüntüleme ✅
- FileResponse import hatası düzeltildi
- Modal ile PDF embed edilip görüntüleniyor

### 3. Aylık/Yıllık Rapor ✅ (YENİ)
- Rapor butonu dropdown menü oldu
- "Tüm Giderler", "Aylık Rapor", "Yıllık Rapor" seçenekleri

### 4. Alt Klasör (Nested Folders) ✅ (YENİ)
- Klasör içinde klasör oluşturabilme
- "Üst Klasör (Opsiyonel)" seçeneği eklendi
- Klasör path gösterimi (örn: "2024 / Nisan")

### 5. PDF Birleştirme ✅
- PyPDF2 ile toplu PDF birleştirme
- Klasör bazlı veya tüm giderler birleştirilebilir

## Mevcut Özellikler

### Giderler & Faturalar
- PDF Yükleme (drag & drop + dialog)
- CamScanner tarzı kamera tarama
- OCR (PyMuPDF + pdfplumber + pytesseract)
- PDF Birleştirme
- Excel Export (GB Ausnahmen 2026 formatı - 4 sayfa)
- PDF Rapor (Tüm/Aylık/Yıllık)
- Klasör yönetimi (oluştur, sil, alt klasör)
- Kategori filtreleme

## API Endpoints

### Reports
- `GET /api/expenses/report/pdf?report_type=all` - Tüm giderler
- `GET /api/expenses/report/pdf?report_type=monthly&month=4&year=2026` - Aylık
- `GET /api/expenses/report/pdf?report_type=yearly&year=2026` - Yıllık

### Folders (Nested Support)
- `POST /api/expense-folders` - `{name, category, parent_id}`
- `GET /api/expense-folders` - Tüm klasörler (path bilgisi dahil)
- `DELETE /api/expense-folders/{id}` - Alt klasörlerle birlikte siler

## Bekleyen
- E-posta IMAP/SMTP (CNAME kaydı bekleniyor)

## Gelecek Görevler
- WhatsApp Business API
- Stok Takibi
- Fatura Yönetimi
