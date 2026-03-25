# SpiceCRM - B2B Müşteri Yönetim Sistemi PRD

## Orijinal Problem
Berlin'de baharat ve binder üreten bir fabrika için agent tabanlı B2B CRM sistemi. Sistem müşteri bilgilerini otomatik toplayacak ve mail gönderecek.

## Kullanıcı Personaları
- **Satış Ekibi**: Potansiyel müşterileri bulur, iletişim kurar, sipariş takibi yapar
- **Yönetici**: Dashboard'dan istatistikleri takip eder, gelir raporları görür

## Temel Gereksinimler (Statik)
1. Müşteri bilgileri: İsim, Soyisim, Firma, Vergi No, Adres, E-posta, Şehir, Ülke
2. Otomatik müşteri bulma (AI destekli)
3. Mail gönderimi (SMTP)
4. Çoklu dil desteği (TR/DE/EN)
5. Sipariş takibi

## Uygulanan Özellikler

### Tarih: 2026-03-25

#### Dashboard
- [x] 4 istatistik kartı (Müşteri, Sipariş, Gelir, Mail)
- [x] Son eklenen müşteriler tablosu
- [x] Hoş geldiniz banner

#### Müşteri Yönetimi (/leads)
- [x] Müşteri CRUD işlemleri
- [x] Arama/filtreleme
- [x] Mail gönderme butonu

#### AI Müşteri Bulucu (/find-leads)
- [x] GPT-5.2 ile otomatik müşteri araması
- [x] Anahtar kelime bazlı arama
- [x] Ülke/şehir filtresi
- [x] Bulunan müşterileri içe aktarma
- [x] Arama geçmişi

#### Sipariş Yönetimi (/orders)
- [x] Sipariş oluşturma (ürün, kod, müşteri, adet, fiyat)
- [x] Durum takibi (Beklemede/Onaylandı/Gönderildi/Teslim/İptal)
- [x] Otomatik toplam hesaplama
- [x] Sipariş düzenleme/silme

#### Mail Sistemi
- [x] Şablon yönetimi
- [x] AI ile mail oluşturma (GPT-5.2)
- [x] SMTP ayarları
- [x] Mail geçmişi

#### Çoklu Dil
- [x] Türkçe (TR)
- [x] Almanca (DE)
- [x] İngilizce (EN)

## Teknoloji Stack
- **Frontend**: React, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI, Python
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 (Emergent LLM Key)

## Öncelikli Backlog

### P0 (Kritik) - Tamamlandı
- [x] Temel CRUD işlemleri
- [x] Sipariş sistemi
- [x] AI müşteri bulma

### P1 (Önemli)
- [ ] SMTP test edilecek (kullanıcı bilgileri gerekli)
- [ ] Daha fazla müşteri bulma kapasitesi (Perplexity/Google API)

### P2 (İstenen)
- [ ] Toplu mail gönderimi
- [ ] Mail şablonları için değişken desteği
- [ ] Sipariş faturalandırma
- [ ] Raporlama/analitik dashboard

## Sonraki Görevler
1. SMTP ayarlarını test et (kullanıcı bilgileri ile)
2. Müşteri bulma kapasitesini artır (opsiyonel API entegrasyonu)
3. Sipariş raporlama özellikleri ekle
