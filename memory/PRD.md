# Gewürzberg CRM - Product Requirements Document

## Project Overview
B2B CRM application for Gewürzberg GmbH, a spice/binder factory based in Berlin.

## Tech Stack
- **Frontend**: React.js, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Gemini API via Emergent LLM Key
- **PWA**: Service Worker + Web App Manifest

## Design System
- **Primary**: Indigo (#4F46E5)
- **Success/Money**: Emerald (#10B981)
- **Warning**: Amber (#F59E0B)

## Completed Features (April 6, 2026)

### Dashboard
- Modern stats cards with hover effects
- Financial summary (indigo theme)
- Top customers ranking
- Annual revenue target progress
- AI Sales Forecast
- Calendar with visit planning
- ✅ Schedule Visit dialog fixed (SelectItem empty value bug)

### Customer Management (Müşteri Bul)
- ✅ **German Döner Factories Database** - 97 potential customers added
- AI-powered lead finder (SerpAPI + Gemini)
- Tab interface: "Almanya Veritabanı" + "AI ile Ara"
- Region filter, search, bulk convert to customer
- Activity History tracking
- PDF/Excel export

### Product Videos
- Folder system (create/delete folders)
- Video upload with progress
- ✅ Upload/Move dialog fixed (SelectItem empty value bug)

### Mail Module
- ✅ IMAP/SMTP integration with 1&1 IONOS
- ✅ Modern dark theme UI (Gmail-inspired)
- ✅ **FIXED: Infinite loading spinner** - Optimized IMAP fetch (5s vs 22s)
- ✅ Lazy body loading - Email bodies loaded on-demand
- ✅ **All tabs working**: Gelen Kutusu, Yıldızlı, Gönderilenler, Taslaklar, Çöp Kutusu
- ✅ Email detail panel with fullscreen mode (double-click or button)
- ✅ Compose email with formatting toolbar
- ✅ Attachments support (display in detail view)
- ✅ Reply/Forward functionality
- ✅ Signature settings with image upload support
- ✅ **AI Features:**
  - AI Özet & Hızlı Yanıt (Email summarization + smart replies)
  - Çeviri (Türkçe, İngilizce, Almanca)
  - AI ile E-posta Yazma
  - Metin İyileştirme (improve, shorten, expand, formal)
- 20 emails displayed (optimized for speed)
- API: GET /api/mail/inbox, GET /api/mail/body/{id}, GET /api/mail/sent, GET /api/mail/drafts
- API: POST /api/ai/summarize-email, POST /api/ai/translate-email, POST /api/ai/compose-email, POST /api/ai/improve-text

### Lead Finder Module
- ✅ **FIXED: Germany search now works** - Removed default keywords, search button loads 97 factories
- ✅ Database shows 97 German Döner factories
- ✅ No auto-load on page open - Results only load when "Ara" button clicked

### Other Modules
- DHL Shipment Tracking (indigo theme)
- Orders with payment tracking
- Recipes, Specifications
- Route Planner
- AI Analytics

### PWA Support
- manifest.json
- Service Worker
- Install banner for iOS/Android

## Known Issues

### P1 - Pending Fixes
1. **"All Customers" PDF Design** - PDF export layout needs professional redesign
2. **Login Page Language Selector** - Changing language doesn't update text

### SMTP Email Sending
- **Status**: BLOCKED (Preview IP restricted)
- SMTP connection works, but sending blocked by IONOS policy
- Will work after deployment to production

## Test Credentials
- **Admin**: emre@gewuerzberg.de / 190371
- **URL**: https://customer-agent-2.preview.emergentagent.com

## API Keys Required
- SERPAPI_KEY
- DHL_API_KEY  
- EMERGENT_LLM_KEY

## API Endpoints
- GET /api/potential-leads - German döner factories database
- POST /api/potential-leads/{id}/convert - Convert to customer
- GET /api/mail/inbox - Fetch emails via IMAP
- POST /api/mail/send - Send email via SMTP

## Upcoming Tasks
- WhatsApp Business API Integration (P1)
- Automated Weekly Email via CRON (P1)

## Future/Backlog
- Inventory Tracking (Stok Takibi) (P2)
- Invoice Generation System (P2)
- Campaign Management (P2)
- Multi-user Roles (Admin, Sales, etc.) (P2)
