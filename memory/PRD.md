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
- **FIXED**: Now displays all leads correctly

### 3. Lead Finder (Müşteri Bul)
- Search factories by country (Germany from DB, others via AI)
- **FIXED**: Greece and other countries work without keywords (uses default keywords)
- **FIXED**: Import functionality works correctly
- Multi-country support

### 4. Shipments (Kargo Takip)
- DHL API integration
- Real-time tracking status
- **FIXED**: Displays all shipments correctly (3 active)

### 5. Mail System (Gewürzberg Mail)
- **RENAMED**: Sidebar now shows "Gewürzberg Mail"
- IMAP/SMTP Integration via 1&1 IONOS
- Pagination: Page 1, 2, 3... navigation (20 emails per page)
- Custom Folders: Create/delete custom mail folders
- Full-screen Reading Mode: Toggle for email viewing
- **IMPROVED**: Better mobile responsiveness and scroll handling
- Attachment Handling: Detection and display of email attachments
- **AI Features** (Multi-language: TR, EN, DE, PL, EL, BG):
  - AI Summary & Quick Reply (in selected UI language)
  - Translation (6 languages with native labels)
  - Spam Analysis
  - Customer Recognition
  - Sentiment Analysis
  - AI Compose with tone selection and 6 language display
  - Text improvement (improve, shorten, expand, formalize)
- Email Settings: IMAP/SMTP configuration dialog
- Signature Management: HTML signature editor with image support

### 6. Daily Reports (Günlük Raporlar)
- Visit logging with customer selection
- Email reports to recipients
- PDF export (daily/monthly)
- **NEW**: Route Map page with visual route and total km estimate

### 7. Route Planner (Rota Planlayıcı)
- Google Maps integration
- Multi-stop route optimization

### 8. Multi-Language Support
Supported Languages:
- 🇹🇷 Türkçe (Turkish)
- 🇬🇧 English
- 🇩🇪 Deutsch (German)
- 🇵🇱 Polski (Polish)
- 🇬🇷 Ελληνικά (Greek)
- 🇧🇬 Български (Bulgarian)

## What's Been Fixed (This Session - April 2026)

### Critical Fixes
1. ✅ **Customers page** - Lead model fixed (first_name, last_name now optional)
2. ✅ **Shipments page** - Now displays all 3 shipments
3. ✅ **LeadFinder Greece** - Default keywords added for non-Germany searches
4. ✅ **LeadFinder Import** - Import button works correctly
5. ✅ **Sidebar Label** - Changed to "Gewürzberg Mail"
6. ✅ **Mail AI Languages** - All 6 languages now shown in translate dropdown and AI compose

### Improvements
1. ✅ Mail page mobile responsiveness improved
2. ✅ Email body scroll handling fixed
3. ✅ AI summarization uses UI language
4. ✅ AI compose shows language options
5. ✅ Daily Report PDF now includes route map with stops visualization

## Technical Architecture

### Frontend
- React.js with Tailwind CSS
- Shadcn/UI components
- Context API for state management (Auth, Language)
- Axios for API calls

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
