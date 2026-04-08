# Gewürzberg CRM - PRD

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## Tamamlanan Özellikler (08.04.2026)

### Temel Modüller
- ✅ Dashboard, Müşteriler, Siparişler, Reçeteler, Spesifikasyonlar, Günlük Raporlar
- ✅ Çoklu dil desteği (TR, EN, DE, PL)
- ✅ PDF oluşturma ve indirme
- ✅ Route Planner (localStorage ile veri saklama)
- ✅ PWA desteği

### Giderler & Faturalar (YENİ)
- ✅ Kategoriler: Otel, Kredi Kartı, DKV, Diğer Giderler
- ✅ PDF yükleme (Drag & Drop destekli)
- ✅ Klasör oluşturma
- ✅ Mobil Fatura Tarama (OCR) - Kamera ile tarama
- ✅ Otomatik veri çekme: Tarih, Firma, Tutar
- ✅ Excel rapor dışa aktarma
- ✅ PDF rapor oluşturma
- ✅ Grid/List görünüm

### Grid/List Görünüm (YENİ)
- ✅ Müşteriler sayfası
- ✅ Siparişler sayfası
- ✅ Reçeteler sayfası
- ✅ Tüm aksiyonlar (Düzenle, Sil, Görüntüle vb.) kartlarda erişilebilir

### Videolar Sayfası (GÜNCELLENDİ)
- ✅ Video indirme
- ✅ WhatsApp ile paylaşma
- ✅ E-posta ile paylaşma

### Aktivite Geçmişi
- ✅ "Numune Test Edildi" aktivite türü eklendi

### UI/UX İyileştirmeleri
- ✅ AI Chatbox navigasyonu engellemeyecek şekilde yukarı kaydırıldı
- ✅ Mobil tam uyumluluk

### Düzeltilen Hatalar
- ✅ Müşteri düzenleme crash sorunu (ÇÖZÜLDÜ)
- ✅ Yeni kullanıcı giriş hatası (DB kontrolü eklendi)
- ✅ Dil senkronizasyonu (eksik çeviriler tamamlandı)

## Bekleyen Görevler
- 🔴 E-posta sistemi (CNAME kaydı bekleniyor)
- 🟡 "Made with Emergent" yazısı (görünmüyor, kontrol edilmeli)
- 🟡 GB Ausnahmen 2026.ods formatına uygun Excel (örnek dosya bekleniyor)

## Gelecek Görevler
- WhatsApp Business API
- Otomatik Haftalık Email (CRON)
- AI Otomatik Kategorizasyon
- Stok Takibi
- Fatura Yönetimi

## API Endpoints
- `/api/expenses` - Giderler CRUD
- `/api/expense-folders` - Klasörler
- `/api/expenses/scan-ocr` - Fatura tarama (OCR)
- `/api/expenses/export/excel` - Excel dışa aktarma
- `/api/expenses/report/pdf` - PDF rapor
