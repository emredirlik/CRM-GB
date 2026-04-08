# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM - Giderler & Faturalar modülü

## ✅ Tamamlanan Özellikler

### 1. CamScanner Tarzı Belge Tarama (OpenCV) ✅
- Backend: OpenCV ile otomatik kenar algılama (Canny edge detection)
- 4 köşe tespiti ve perspektif düzeltme (warpPerspective)
- Adaptive thresholding ile siyah-beyaz dönüşüm
- Belge bulunamazsa CLAHE kontrast artırma
- Frontend: "Orijinal" ve "Taranmış" toggle butonları
- **Dosya Seç** butonu - kamera erişimi olmadan da çalışır
- OCR ile tarih, tutar ve satıcı bilgisi otomatik algılama

### 2. PDF Birleştirme - Klasör Seçimi ✅
- PDF Birleştir dropdown menü
- "Klasörsüz" seçeneği: Sadece klasöre atanmamış PDF'leri birleştirir
- Klasör seçimi: Her klasör ayrı listelenmiş

### 3. Çoklu Dil Desteği (TR/DE/EN/PL) ✅
### 4. GB Ausnahmen Excel Formatı ✅
### 5. Otel Özel Form Alanları ✅
### 6. Hiyerarşik Yıl/Ay Seçimi ✅
### 7. E-posta IMAP Sistemi ✅

## API Endpoints

### CamScanner Tarama
- `POST /api/expenses/scan-ocr`
- Response: `{success, processed_image (base64), vendor, date, total}`

### PDF Birleştirme
- `POST /api/expenses/merge-pdfs`
- Body: `{"folder_id": "xxx"}` veya `{"expense_ids": ["id1", "id2"]}`

## Teknoloji Yığını
- Frontend: React.js, TailwindCSS, Shadcn/UI
- Backend: FastAPI, Python
- Database: MongoDB
- Görüntü İşleme: OpenCV (opencv-python-headless)
- PDF İşleme: PyPDF2, PyMuPDF

## Gelecek Görevler
- WhatsApp Business API (P1)
- Otomatik Haftalık Email (P1)
- AI Auto-Kategorileme (P2)
- Stok Takibi (P2)
