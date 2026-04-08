# Gewürzberg CRM - PRD (08.04.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM - Giderler & Faturalar modülü

## ✅ Tamamlanan Özellikler

### 1. GB Ausnahmen Excel Formatı ✅
- 4 Sayfa: Ausgabenübersicht 2026, Hotel, DKV 2026, Kreditkarte 2026
- Hotel sayfası: Hotelname, Check-In, Check-Out, Land, Nacht, Preis, Adresse, PDF Seite
- Aylara göre gruplandırma (JANUAR, FEBRUAR, vs.)
- GESAMT toplam satırı

### 2. Otel Kategorisi Özel Form Alanları ✅
- Check-In (tarih yerine)
- Check-Out
- Gece Sayısı (Nacht)
- Otel Adı (Hotelname)
- Mavi kutuda öne çıkarılmış

### 3. Dashboard Modernleştirme ✅
- Gradient header "Kontrol Paneli"
- Tarih gösterimi (8 Nisan 2026 Çarşamba)
- Modern stat kartları (gradient ikonlar)
- Hover animasyonları

### 4. Hiyerarşik Yıl/Ay Seçimi ✅
- YIL dropdown (2024-2027)
- AY dropdown (Tüm Aylar + 12 ay)
- Excel ve Rapor filtreleme

### 5. Liste Görünümü Butonları ✅
- Görüntüle, İndir, Sil butonları HER ZAMAN görünür

### 6. PDF Birleştirme (Klasör Bazlı) ✅
- Seçili klasördeki tüm PDF'ler birleştirilir

## API Endpoints

### Excel Export
- `GET /api/expenses/export/excel?year=2026&month=4`
- Hotel sayfası: Check-In, Check-Out, Nacht alanları

### Upload (Hotel)
- `POST /api/expenses/upload`
- Form alanları: check_in, check_out, nights

## Bekleyen
- E-posta IMAP/SMTP (CNAME kaydı bekleniyor)
- Mobil kamera perspektif düzeltme

## Gelecek Görevler
- WhatsApp Business API
- Stok Takibi
- Fatura Yönetimi
