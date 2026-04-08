# Gewürzberg CRM - PRD

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## Tamamlanan Özellikler (08.04.2026)

### Giderler & Faturalar (TAM FONKSİYONEL - GB AUSNAHMEN FORMATI)
- ✅ Kategoriler: Otel, Kredi Kartı, DKV, Diğer Giderler
- ✅ PDF yükleme (Drag & Drop destekli)
- ✅ Klasör oluşturma
- ✅ Mobil Fatura Tarama (OCR) - Kamera ile tarama
- ✅ Detaylı form alanları:
  - Açıklama / Ort / Hotelname
  - Ülke (Land)
  - Yerel Para Birimi (TRY, PLN vb.)
  - Adres
  - Fatura Adı
  - Notlar
- ✅ **Excel Rapor - GB Ausnahmen 2026 Formatı:**
  - Sheet 1: Ausgabenübersicht 2026 (Genel Özet)
  - Sheet 2: Hotel (Otel giderleri)
  - Sheet 3: DKV 2026 (Yakıt giderleri)
  - Sheet 4: Kreditkarte 2026 (Kredi kartı)
  - Aylık gruplandırma (JANUAR, FEBRUAR...)
  - GESAMT toplamları
  - Almanca sütun başlıkları
- ✅ PDF rapor oluşturma
- ✅ Grid/List görünüm

### Grid/List Görünüm
- ✅ Müşteriler
- ✅ Siparişler  
- ✅ Reçeteler
- Tüm aksiyonlar kartlarda erişilebilir

### Videolar Sayfası
- ✅ Video indirme
- ✅ WhatsApp ile paylaşma
- ✅ E-posta ile paylaşma

### Aktivite Geçmişi
- ✅ "Numune Test Edildi" aktivite türü

### UI/UX İyileştirmeleri
- ✅ AI Chatbox yukarı kaydırıldı
- ✅ Mobil tam uyumluluk

### Düzeltilen Hatalar
- ✅ Müşteri düzenleme crash sorunu
- ✅ Yeni kullanıcı giriş hatası
- ✅ Dil senkronizasyonu

## Bekleyen Görevler
- 🔴 E-posta sistemi (CNAME kaydı bekleniyor)

## Gelecek Görevler
- WhatsApp Business API
- Stok Takibi
- Fatura Yönetimi

## API Endpoints - Giderler
```
GET  /api/expenses              - Tüm giderler
POST /api/expenses/upload       - PDF yükle (detaylı alanlar)
GET  /api/expenses/{id}/view    - PDF görüntüle
GET  /api/expenses/{id}/download- PDF indir
DEL  /api/expenses/{id}         - Gider sil
POST /api/expenses/scan-ocr     - Fatura tara (OCR)
GET  /api/expenses/export/excel - GB Ausnahmen Excel
GET  /api/expenses/report/pdf   - PDF rapor
```
