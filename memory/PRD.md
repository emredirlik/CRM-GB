# Gewürzberg CRM - PRD

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## Düzeltilen Sorunlar (08.04.2026 - Son Güncelleme)

### 1. PDF Rapor Hatası ✅
- Font paketi (`fonts-dejavu-core`) yüklendi
- `/api/expenses/report/pdf` artık 200 döndürüyor

### 2. Excel Export ✅
- Çalışıyor, "Excel indirildi" toast mesajı gösteriliyor

### 3. Klasör Silme ✅
- DELETE `/api/expense-folders/{folder_id}` endpoint'i eklendi
- Klasör üzerine hover yapınca silme butonu görünür

### 4. Checkbox'lar Kaldırıldı ✅
- Liste görünümünden checkbox'lar kaldırıldı
- Grid görünümü temiz kartlar gösteriyor

### 5. Mobil Uyumluluk ✅
- Giderler sayfası mobilde düzgün görünüyor
- Upload Dialog mobil responsive yapıldı
- Form alanları tek sütuna dönüyor

### 6. IMAP Bloklaması ✅
- Mail endpoint'leri devre dışı (CNAME bekleniyor)
- Sistem artık bloklanmıyor

## Aktif Özellikler

### Giderler & Faturalar
- CamScanner tarzı kamera tarayıcı (DocumentScanner.js)
- PDF yükleme (Drag & Drop + Dialog)
- Kategoriler: Otel, Kredi Kartı, DKV, Diğer Giderler
- Klasör yönetimi (oluştur, sil)
- Excel export (GB Ausnahmen 2026 formatı)
- PDF Rapor
- OCR: PyMuPDF + pdfplumber + pytesseract
- Grid/List görünüm

### Müşteriler (Leads)
- Liste ve Grid görünüm (checkbox'sız)
- PDF ve Excel export
- Müşteri ekleme/düzenleme/silme
- Email gönderme

## Bekleyen
- E-posta IMAP/SMTP (CNAME kaydı bekleniyor)

## Gelecek Görevler
- WhatsApp Business API
- Otomatik Haftalık E-posta (CRON)
- Stok Takibi
- Fatura Yönetimi

## Notlar
- Tarama özelliği: Otomatik kenar kesme (edge detection) şu an basit kontrast/parlaklık iyileştirmesi yapıyor. Daha gelişmiş CV kütüphanesi (OpenCV) gerekli.
