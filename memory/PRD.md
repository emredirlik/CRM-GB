# Gewürzberg CRM - PRD (28.07.2026)

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması. AI destekli müşteri bulma, DHL kargo takibi, çoklu ürün siparişleri, numune takibi, özel PDF oluşturma, takvim ve çoklu dil desteği içerir.

## ✅ Tamamlanan Özellikler

### Dashboard
- Kontrol Paneli ana sayfası ✅
- Dünya Saatleri Widget (Berlin, New York, Riyad, Sidney) ✅ **[YENİ - 28.07.2026]**
- Finansal özet kartları ✅
- En değerli müşteriler listesi ✅
- AI Sales Forecast ✅
- Takvim & Ziyaret Planlama ✅
- Son kargolar ✅
- Son mailler ✅

### AI Müşteri Bulucu (LeadFinder)
- Gemini AI ile akıllı müşteri arama ✅
- SerpAPI Google Maps entegrasyonu ✅
- Yunanistan fabrika veritabanı (60+ doğrulanmış) ✅
- Meksika firmaları eklendi ✅
- **Gemini API hatası düzeltildi (gemini-2.5-flash)** ✅ **[YENİ - 28.07.2026]**

### Multi-tenant Veri İzolasyonu **[YENİ - 28.07.2026]**
- Giderler endpoint'lerine user_id filtreleme ✅
- Siparişler endpoint'lerine user_id filtreleme ✅
- Numuneler endpoint'lerine user_id filtreleme ✅
- Her kullanıcı sadece kendi verilerini görür ✅

### Giderler & Faturalar
- CamScanner tarzı belge tarama (OpenCV) ✅
- PDF birleştirme ✅
- GB Ausnahmen Excel formatı ✅
- Otel özel form alanları ✅
- Kategori bazlı filtreleme ✅
- Modern UI tasarımı ✅

### Numuneler (Samples) Modülü ✅
- Numune oluşturma/düzenleme/silme ✅
- Müşteri bazlı numune takibi ✅
- Kargo takip numarası entegrasyonu ✅

### E-posta Sistemi
- IMAP okuma ✅
- Mail detay görünümü ✅
- AI ile mail özeti ✅

### Çoklu Dil Desteği
- Türkçe, Almanca, İngilizce, Lehçe ✅
- Rapor PDF'lerinde dil desteği ✅

## Teknoloji Yığını
- Frontend: React.js, TailwindCSS, Shadcn/UI
- Backend: FastAPI, Python
- Database: MongoDB
- AI: Emergent LLM (Gemini 2.5 Flash)
- Görüntü İşleme: OpenCV
- Haritalama: OpenStreetMap/Nominatim

## 🟠 Bekleyen Sorunlar (P1)

1. **Spesifikasyonlar Sayfası Çökmesi/Yavaşlık** - Performans analizi gerekli
2. **PDF ve Resim Birleştirme Hatası** - Test bekliyor
3. **Mobil PDF Görüntüleme Sorunu** - iOS/Android uyumluluğu
4. **E-posta Gönderme Sorunu** - SMTP ayarları kontrolü

## 🔵 Gelecek Görevler

### P1 (Yüksek Öncelik)
- WhatsApp Business API entegrasyonu
- Otomatik haftalık e-posta (CRON)

### P2 (Orta Öncelik)
- AI otomatik e-posta kategorilendirme
- Spesifikasyonlara PDF düzenleme
- Stok Takibi (Inventory)
- Fatura Yönetimi (Invoicing)
- Kampanya Yönetimi
- Rota Planlayıcı performans iyileştirmesi
- Döner Kebab haberleri güncelleme

## Notlar
- Production ortamında Cloudflare hatası - altyapısal sorun
- test_credentials.md: emre@gewuerzberg.de / 190371
