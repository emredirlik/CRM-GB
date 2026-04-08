# Gewürzberg CRM - PRD

## Özet
Berlin merkezli baharat fabrikası için B2B CRM uygulaması.

## Tamamlanan Özellikler
- ✅ Dashboard, Müşteriler, Siparişler, Reçeteler, Spesifikasyonlar, Günlük Raporlar
- ✅ Çoklu dil desteği (TR, EN, DE, PL)
- ✅ PDF oluşturma ve indirme
- ✅ Route Planner (localStorage ile veri saklama)
- ✅ PWA desteği
- ✅ **E-posta sistemi (.eml dosyası olarak indirme - PDF ekleriyle)** (08.04.2026)
- ✅ **Mobil dropdown menü (Orders, Leads sayfalarında)** (08.04.2026)

## Son Değişiklikler (08.04.2026)
1. **E-posta Sistemi Güncellendi**: IONOS IMAP yerine .eml dosyası indirme yöntemi. Kullanıcı kendi mail uygulamasında (Outlook, Thunderbird vb.) açıp gönderebilir.
2. **Mobil Uyumluluk**: Orders ve Leads sayfalarında mobilde dropdown menü (üç nokta) ile tüm aksiyonlar erişilebilir.

## Bekleyen Görevler
- P1: WhatsApp Business API
- P1: Otomatik Haftalık Email (CRON)
- P2: AI Otomatik Kategorizasyon
- P2: Stok Takibi
- P2: Fatura Yönetimi

## Teknik Bilgiler
- Frontend: React + TailwindCSS + Shadcn/UI
- Backend: FastAPI + MongoDB
- Mail: .eml dosya indirme (tüm mail clientları destekler)
