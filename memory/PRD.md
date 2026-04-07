# Gewürzberg GmbH - B2B CRM Application

## Product Overview
A comprehensive B2B CRM application for Gewürzberg GmbH, a spice and binder factory based in Berlin, Germany. The application provides AI-powered customer management, email integration, shipment tracking, and multi-language support.

## Core Features

### 1. Dashboard
- Financial summary with revenue tracking
- Recent leads and shipments widgets
- Calendar with event management
- AI-powered sales forecasting
- Customer health indicators

### 2. Customer Management (Müşteriler)
- Full CRUD operations for leads
- Customer segmentation with AI
- Lead finder with German factory database (97 pre-seeded)
- PDF export functionality
- **COMPACT LAYOUT**: Single-row list view for better visibility

### 3. Lead Finder (Müşteri Bul)
- Search factories by country (Germany from DB, others via AI)
- Multi-country support with default keywords

### 4. Shipments (Kargo Takip)
- DHL API integration
- Real-time tracking status

### 5. Orders (Siparişler)
- **COMPACT LAYOUT**: Single-row list view showing product, customer, quantity, status, payment status, date

### 6. Mail System (Gewürzberg Mail)
- IMAP/SMTP Integration via 1&1 IONOS
- Pagination: 20 emails per page
- Custom Folders
- **FULL SCREEN READING**: Maximized email viewing area
- **EMAIL AUTOCOMPLETE**: Remembers previously used email addresses
- **AI Features** (Multi-language: TR, EN, DE, PL, EL, BG):
  - AI Summary & Quick Reply
  - Translation (6 languages)
  - AI Compose with tone and language selection
  - Spam Analysis, Customer Recognition, Sentiment Analysis

### 7. Food Fairs (Gıda Fuarları) - NEW!
- 18 international food exhibitions
- Shows upcoming events (2026-2027)
- Filter by country, search, featured/upcoming tabs
- Direct links to fair websites and flight booking
- Fairs include: ANUGA, Gulfood, FOOD EXPO Greece, SIAL Paris, ISM Cologne, Biofach, Alimentaria, CIBUS, FHC China, PLMA Amsterdam, IFE London, Fi Europe, WorldFood Moscow, FOODEX Japan, Fancy Food Show, Tavola, InterFood Bulgaria, Polagra Food

### 8. Daily Reports (Günlük Raporlar)
- Visit logging with customer selection
- Email reports to recipients
- PDF export (daily/monthly)
- Route Map with visual stops and total km

### 9. Route Planner (Rota Planlayıcı)
- Google Maps integration
- Multi-stop route optimization

### 10. Multi-Language Support
Supported Languages: TR, EN, DE, PL, EL, BG

## What's Been Implemented (April 2026 Session)

### Latest Session Updates (7 Nisan 2026)
1. ✅ **Route Planner State Persistence** - Sayfa değiştirildiğinde seçimler korunuyor (localStorage)
2. ✅ **Orders Dil Desteği** - "Vade", tarih formatları ve tüm UI metinleri 4 dilde (TR/EN/DE/PL)
3. ✅ **Sipariş Email Dil Seçimi** - Müşteriye mail gönderirken dil seçimi dropdown'u eklendi
4. ✅ **Recipes Dil Senkronizasyonu** - Tüm Türkçe hardcoded metinler 4 dile çevrildi
5. ✅ **Preview Dialog Dil Desteği** - Sipariş önizleme diyaloğu çoklu dil desteği

### Previous Session Updates
1. ✅ **Food Fairs Page** - 18 international food exhibitions with future dates
2. ✅ **Döner & Kebab News Page** - Entertainment section with 10 fun facts about döner/kebab
   - Multilingual content (TR, EN, DE, PL)
   - Detail modal when clicking news items
   - External links to sources
3. ✅ **Compact Leads List** - Single-row layout with better visibility
4. ✅ **Compact Orders List** - Single-row layout with WhatsApp, Email, PDF, Edit, Delete buttons
5. ✅ **Email Autocomplete** - Saves used addresses to localStorage
6. ✅ **AI Compose Languages** - Working language tabs (TR, EN, DE, PL, EL, BG)
7. ✅ **PWA Logo Update** - New logo applied to manifest.json
8. ✅ **Full Language Support** - All UI labels change when switching languages
9. ✅ **PDF Multi-language** - Lead and Report PDFs support lang parameter
10. ✅ **Mobile Header** - Compact premium design with logo

### Previous Session Fixes
1. ✅ Customers page - Lead model fixed
2. ✅ Shipments page - Displays all shipments
3. ✅ LeadFinder Greece - Default keywords
4. ✅ Sidebar Label - "Gewürzberg Mail"
5. ✅ Mail AI Languages - 6 languages in dropdowns

## Technical Architecture

### Frontend
- React.js with Tailwind CSS
- Shadcn/UI components
- Context API (Auth, Language)
- localStorage for email history

### Backend
- FastAPI (Python)
- MongoDB for data persistence
- IMAP/SMTP for email
- Emergent Integrations for AI (Gemini)

### Key API Endpoints
- `/api/leads` - CRUD operations for customers
- `/api/shipments` - Shipment tracking
- `/api/mail/inbox?page=X&limit=Y` - Paginated email fetch
- `/api/mail/folders` - Custom folders CRUD
- `/api/ai/summarize-email` - Multi-language AI summary
- `/api/ai/translate-email` - 6-language translation
- `/api/ai/compose-email` - Multi-language compose
- `/api/ai/analyze-spam` - Spam detection
- `/api/ai/recognize-customer` - CRM customer matching
- `/api/ai/analyze-sentiment` - Sentiment analysis
- `/api/daily-reports/date/{date}/pdf` - PDF with route map

## Pending Tasks (P1)
- WhatsApp Business API Integration
- Automated Weekly Email via CRON

## Future Tasks (Backlog - P2)
- Inventory Tracking (Stok Takibi)
- Invoice Generation System
- Campaign Management
- Multi-user Roles (Admin, Sales, etc.)

## Test Credentials
See `/app/memory/test_credentials.md`

## 3rd Party Integrations
- **IMAP/SMTP**: 1&1 IONOS
- **AI**: Emergent LLM Key (Gemini 2.5 Flash)
- **DHL**: DHL Tracking API
- **SerpAPI**: For lead finding
