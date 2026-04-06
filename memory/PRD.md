# Gewürzberg CRM - Product Requirements Document

## Project Overview
B2B CRM application for Gewürzberg GmbH, a spice/binder factory based in Berlin. The system manages leads, orders, recipes, product specifications, and daily reports with AI-powered features.

## Tech Stack
- **Frontend**: React.js, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (motor async)
- **AI Integration**: Gemini API via Emergent LLM Key
- **Business Data**: SerpAPI (Google Maps real data)
- **PDF Generation**: ReportLab with DejaVu fonts (UTF-8 support)
- **PWA**: Service Worker, Web App Manifest for iOS/Android installation

## Design System
- **Primary Color**: Indigo (#4F46E5)
- **Success/Money**: Emerald (#10B981)
- **Warning**: Amber (#F59E0B)
- **Cards**: Rounded corners (rounded-2xl), soft shadows
- **Typography**: System font stack with gradient text for headers

## Core Modules

### 1. Dashboard (MODERNIZED - April 6, 2026)
Features:
- Stats cards with hover effects and colored icons
- Financial summary with indigo gradient header
- Top customers ranking with trophy icon
- Annual revenue target with gradient progress bar
- AI Sales Forecast in dark indigo theme
- Calendar with visit planning
- Upcoming visits sidebar

Design: Modern, soft corners, consistent indigo + emerald palette

### 2. Customer Activity History System
Features:
- Activity Types: Ziyaret, Telefon, Email, Sipariş, Takip
- Outcomes: Olumlu, Olumsuz, Erteledi, Sipariş Verdi, Cevap Vermedi
- Notes and Next Action scheduling
- AI suggestions based on activity history

API Endpoints:
- GET/POST `/api/leads/{lead_id}/activities`
- DELETE `/api/activities/{activity_id}`
- POST `/api/leads/{lead_id}/ai-suggestion`
- GET `/api/activities/upcoming`

### 3. Activity PDF Reports (NEW - April 6, 2026)
Features:
- Generate PDF reports of all activities
- Filter by lead, date range
- Send via email to management

API Endpoints:
- POST `/api/reports/activities/pdf` - Generate and optionally email
- GET `/api/reports/activities/download` - Direct PDF download

### 4. Management Reports
- Weekly/Monthly summaries
- Activity breakdown by outcome
- Upcoming follow-ups list
- Email reports to management

### 5. PWA Support
- manifest.json with app icons
- Service worker for caching
- Install banner for iOS/Android
- Standalone fullscreen mode

### 6. Leads Management (UPDATED)
- Mobile-optimized card layout
- Checkbox hidden on mobile
- Indigo avatar colors
- Activity history button on each card
- Last activity and next action visible

### 7. Other Modules
- DHL Shipment Tracking (indigo theme)
- Lead Finder (SerpAPI)
- Orders with payment tracking
- Recipes, Specifications, Route Planner
- AI Analytics

## Recent Updates (April 6, 2026)
- [x] Dashboard modernization with consistent colors
- [x] Customer Activity History system
- [x] AI suggestions for leads
- [x] Activity PDF report generation
- [x] Management reports in Settings
- [x] PWA support for mobile install
- [x] Mobile UI improvements (hidden checkboxes)
- [x] Sidebar shows user name instead of "Premium CRM"
- [x] Shipments theme changed to indigo

## Pending/Backlog
### P1 - High Priority
- [ ] WhatsApp Business Integration
- [ ] Bulk Email Sending
- [ ] Route Planner menu bug

### P2 - Medium Priority
- [ ] Product Videos Folder System
- [ ] Automated Weekly Email (CRON)
- [ ] Advanced Reports

## API Keys Required
- `SERPAPI_KEY` - Lead Finder
- `DHL_API_KEY` - Shipment tracking
- `EMERGENT_LLM_KEY` - AI features

## Test Credentials
- **Admin**: emre@gewuerzberg.de / 190371
- **Preview URL**: https://customer-agent-2.preview.emergentagent.com
