# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM - Giderler & Faturalar modülü

## ✅ Tamamlanan Özellikler

### 1. Hiyerarşik Yıl/Ay Seçimi ✅
- Üstte YIL dropdown (2024-2027)
- Yanında AY dropdown (Tüm Aylar + 12 ay)
- "2026 (Tüm Yıl)" göstergesi
- Veriler otomatik filtreleniyor

### 2. Excel Export (GB Ausnahmen Format) ✅
- Year ve month parametreleri ile filtreleme
- 4 sayfa: Ausgabenübersicht, Hotel, DKV, Kreditkarte
- Türkçe karakter desteği (UTF-8)
- Dosya adı: `GB_Ausnahmen_2026_Nisan.xlsx`

### 3. PDF Rapor ✅
- Seçili yıl ve aya göre rapor
- Dosya adı: `Gider_Raporu_2026_Nisan.pdf`

### 4. Liste Görünümü Butonları ✅
- Her satırda Görüntüle, İndir, Sil butonları HER ZAMAN görünür
- Üç nokta menüsü ile klasöre taşıma

### 5. Klasör Navigasyonu ✅
- Klasöre tıklayınca içine giriyor
- Breadcrumb navigasyon
- "← Geri" butonu

### 6. PDF Klasöre Taşıma ✅
- Dropdown menüde "X'e Taşı" seçenekleri

### 7. PDF Önizleme ✅
- Modal içinde embed PDF viewer
- İndir butonu

### 8. PDF Birleştirme ✅
- Klasör bazlı toplu PDF oluşturma

## API Endpoints

### Excel/Report with Year/Month
- `GET /api/expenses/export/excel?year=2026&month=4`
- `GET /api/expenses/report/pdf?year=2026&month=4`

## Bekleyen
- E-posta IMAP/SMTP (CNAME kaydı bekleniyor)
- Mobil kamera perspektif düzeltme (gelişmiş CV gerekli)

## Gelecek Görevler
- WhatsApp Business API
- Stok Takibi
- Fatura Yönetimi
