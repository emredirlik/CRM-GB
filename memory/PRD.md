# Gewürzberg CRM - PRD

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## Tamamlanan Özellikler
- ✅ Dashboard, Müşteriler, Siparişler, Reçeteler, Spesifikasyonlar, Günlük Raporlar
- ✅ Çoklu dil desteği (TR, EN, DE, PL)
- ✅ PDF oluşturma ve indirme
- ✅ Route Planner (localStorage ile veri saklama)
- ✅ PWA desteği
- ✅ Mail sistemi (IMAP - şu an pasif, CNAME sonrası aktif edilecek)

## Son Değişiklikler (08.04.2026)
1. **Giderler & Faturalar Sayfası**: Tam fonksiyonel gider yönetimi
   - Kategoriler: Otel, Kredi Kartı, DKV, Diğer Giderler
   - PDF yükleme (Drag & Drop destekli)
   - Klasör oluşturma
   - Excel ve PDF rapor dışa aktarma
   - Grid/List görünüm

2. **Grid/List Görünüm**: Müşteriler sayfasına eklendi

3. **Aktivite Türü**: "Numune Test Edildi" seçeneği eklendi

4. **Videolar**: İndirme, WhatsApp, E-posta seçenekleri eklendi

5. **Dil Çevirileri**: Eksik çeviriler tamamlandı

6. **Yeni Kullanıcı Girişi**: DB'den kullanıcı kontrolü eklendi

## Bekleyen/Devam Eden Görevler
- 🔴 E-posta sistemi (CNAME kaydı sonrası aktif edilecek)
- 🟡 Mobil UI iyileştirmeleri
- 🟡 Diğer sayfalara Grid/List görünüm
- 🟡 PDF karakter sorunları kontrolü

## Gelecek Görevler
- WhatsApp Business API
- Otomatik Haftalık Email (CRON)
- AI Otomatik Kategorizasyon
- Stok Takibi
- Fatura Yönetimi

## Teknik Bilgiler
- Frontend: React + TailwindCSS + Shadcn/UI
- Backend: FastAPI + MongoDB
- Giderler: /api/expenses, /api/expense-folders endpoints
