# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM - Giderler & Faturalar modülü

## ✅ Tamamlanan Özellikler

### 1. Çoklu Dil Desteği (TR/DE/EN/PL) ✅
- Tüm butonlar ve metinler çevrildi
- Sidebar ve menüler tüm dillerde çalışıyor
- Almanca: "Ausgaben & Rechnungen", "PDF zusammenführen", "Rechnung scannen"
- Türkçe: "Giderler & Faturalar", "PDF Birleştir", "Fatura Tara"

### 2. GB Ausnahmen Excel Formatı ✅
- 4 Sayfa: Ausgabenübersicht, Hotel, DKV, Kreditkarte
- Hotel: Hotelname, Check-In, Check-Out, Land, Nacht, Preis, Adresse

### 3. Otel Özel Form Alanları ✅
- Check-In, Check-Out, Gece Sayısı (mavi kutuda)
- Dinamik form (kategori değişince alanlar değişir)

### 4. PDF Birleştirme ✅
- Gerçek PDF dosyaları birleştiriliyor
- Test: 236KB birleşik dosya oluşturuldu
- NOT: Bozuk/test PDF'ler birleştirilemiyor ("startxref not found")

### 5. Dashboard (Eski Hali Korundu) ✅
- Basit ve temiz tasarım
- Gradient değişiklikler geri alındı

### 6. Hiyerarşik Yıl/Ay Seçimi ✅
- YIL ve AY dropdown'ları
- Excel ve Rapor filtreleme

## API Endpoints

### PDF Birleştirme
- `POST /api/expenses/merge-pdfs`
- Body: `{"folder_id": "xxx"}` veya `{"expense_ids": ["id1", "id2"]}`

### Excel Export
- `GET /api/expenses/export/excel?year=2026&month=4`

## Bekleyen
- E-posta IMAP/SMTP (CNAME kaydı bekleniyor)
- Mobil kamera otomatik belge kesme/perspektif düzeltme (OpenCV gerekli)

## Gelecek Görevler
- WhatsApp Business API
- Stok Takibi
- Fatura Yönetimi
