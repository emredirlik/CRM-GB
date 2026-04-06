# Gewürzberg CRM - Product Requirements Document

## Project Overview
B2B CRM application for Gewürzberg GmbH, a spice/binder factory based in Berlin. The system manages leads, orders, recipes, product specifications, and daily reports with AI-powered features.

## Tech Stack
- **Frontend**: React.js, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (motor async)
- **AI Integration**: Gemini API (gemini-2.0-flash via Emergent LLM Key)
- **Business Data**: SerpAPI (Google Maps real data)
- **PDF Generation**: ReportLab with DejaVu fonts (UTF-8 support)
- **PWA**: Service Worker, Web App Manifest for iOS/Android installation

## Core Modules

### 1. Authentication
- JWT-based authentication
- Admin user: `emre@gewuerzberg.de` / `190371`

### 2. Dashboard
- Stats cards (leads, orders, revenue, emails)
- Revenue target progress
- AI Sales Forecast widget
- Calendar with Visit Planning
- Upcoming Visits sidebar
- Financial Summary (Total Revenue, Paid, Pending, Payment Rate)

### 3. Leads Management (UPDATED April 6, 2026)
- CRUD operations for leads
- Bulk email campaigns
- Google Maps navigation
- Import from Lead Finder
- **NEW: Activity History System** - Track all customer interactions
- **NEW: AI Suggestions** - Get AI recommendations based on activity history

### 4. Customer Activity History System (NEW - April 6, 2026)
Features:
- **Activity Types**: Ziyaret, Telefon, Email, Sipariş, Takip
- **Outcomes**: Olumlu, Olumsuz, Erteledi, Sipariş Verdi, Cevap Vermedi
- **Notes**: Free-text notes for each activity
- **Next Action Date**: Schedule follow-up with reminders
- **AI Suggestions**: Get personalized recommendations after saving activities
- **History View**: See all past interactions in chronological order
- **Lead Card Display**: Last activity outcome and next action date visible on lead cards

API Endpoints:
- GET `/api/leads/{lead_id}/activities` - Get all activities for a lead
- POST `/api/leads/{lead_id}/activities` - Create new activity
- DELETE `/api/activities/{activity_id}` - Delete activity
- POST `/api/leads/{lead_id}/ai-suggestion` - Get AI recommendation
- GET `/api/activities/upcoming` - Get leads with upcoming action dates

### 5. Management Reports (NEW - April 6, 2026)
Features:
- **Weekly/Monthly Summary**: Orders, Revenue, Activities, New Leads
- **Activity Breakdown**: Positive/Negative/Postponed counts
- **Upcoming Follow-ups**: List of scheduled customer actions
- **Email Reports**: Send summary reports to management

API Endpoints:
- GET `/api/reports/summary` - Get report data
- POST `/api/reports/send` - Send report email

Location: Settings page → "Yönetim Raporları" section

### 6. PWA (Progressive Web App) - NEW April 6, 2026
Features:
- **manifest.json**: App name, icons, theme colors
- **Service Worker**: Offline caching
- **Install Banner**: "Ana Ekrana Ekle" prompt for iOS/Android
- **iOS Instructions**: Step-by-step guide for Safari users
- **Standalone Mode**: Full-screen app experience

Files:
- `/app/frontend/public/manifest.json`
- `/app/frontend/public/sw.js`
- PWA meta tags in `index.html`

### 7. Lead Finder (SerpAPI - Real Google Maps Data)
- 60+ countries with major cities
- SerpAPI Integration - Real Google Maps businesses
- User-defined search keywords
- Real phone numbers and websites
- Strict restaurant filtering

### 8. Orders (Multi-Product Support)
- Multiple products per order
- Payment status tracking (Bekliyor/Kısmi/Ödendi/Vadesi Geçti)
- Dynamic add/remove products in form
- WhatsApp sharing
- PDF generation

### 9. DHL Shipment Tracking (THEME UPDATED - April 6, 2026)
- DHL Paket tracking (German domestic)
- DHL Express tracking (International)
- **NEW: Indigo/Purple theme** (replaced amber/orange)
- Multi-language status labels
- Quick track feature

### 10. Recipes, Specifications, Route Planner, Daily Reports
- All functioning as documented previously

### 11. AI Analytics
- Health Score calculation
- Churn Risk Analysis
- Best Contact Time prediction
- Sales Forecasting

## Recent Updates (April 6, 2026)

### Completed Today
- [x] **Customer Activity History** - Full interaction tracking system
- [x] **AI Suggestions** - Recommendations based on customer history
- [x] **Management Reports** - Weekly/Monthly reports to management
- [x] **PWA Support** - Install app on iOS/Android home screen
- [x] **Sidebar User Name** - Shows "Emre Dirlik" instead of "Premium CRM"
- [x] **Shipments Theme Update** - Changed from amber to indigo colors
- [x] **Activity Bug Fix** - Fixed `lead_id` validation error

### Previously Completed
- [x] Financial Summary Widget
- [x] Payment Tracking for Orders
- [x] Excel Export for Leads
- [x] AI Customer Analytics Dashboard
- [x] Mobile-responsive card layouts
- [x] DHL Tracking with real tracking numbers
- [x] Multi-language system (TR/EN/DE/PL)

## Pending/Backlog

### P1 - High Priority
- [ ] WhatsApp Business Integration (Promised)
- [ ] Bulk Email Sending (Toplu Email Gönderimi)
- [ ] Route Planner menu bug investigation

### P2 - Medium Priority
- [ ] Product Videos Folder System (In Progress)
- [ ] Weekly Summary Email (Automated CRON)
- [ ] Advanced Reports (Customer Revenue, Product Profitability)

### P3 - Future
- [ ] Email Assistant AI
- [ ] Recipe Optimization AI

## API Keys Required
- `SERPAPI_KEY` - Lead Finder (Google Maps data)
- `DHL_API_KEY` - Shipment tracking
- `EMERGENT_LLM_KEY` - AI features (Gemini)

## Mail Configuration
Users must configure IMAP/SMTP settings in Settings page:
- SMTP Host, Port, Username, Password
- IMAP Host, Port
- TLS/SSL options
- Popular providers: IONOS, Strato, Gmail (App Password required)

## Test Credentials
- **Admin**: emre@gewuerzberg.de / 190371
- **Preview URL**: https://customer-agent-2.preview.emergentagent.com
