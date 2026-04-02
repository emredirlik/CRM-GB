# Gewürzberg CRM - Product Requirements Document

## Project Overview
B2B CRM application for Gewürzberg GmbH, a spice/binder factory based in Berlin. The system manages leads, orders, recipes, product specifications, and daily reports with AI-powered features.

## Tech Stack
- **Frontend**: React.js, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (motor async)
- **AI Integration**: Gemini API (gemini-2.5-flash-lite via Emergent LLM Key)
- **PDF Generation**: ReportLab with DejaVu fonts (UTF-8 support)
- **Web Scraping**: BeautifulSoup4 (DHL Tracking)

## Core Modules

### 1. Authentication
- JWT-based authentication
- Admin user: `admin` / `190371`

### 2. Dashboard
- Stats cards (leads, orders, revenue, emails)
- Revenue target progress
- AI Sales Forecast widget
- Calendar with Visit Planning (FIXED: layout overflow)
- Upcoming Visits sidebar

### 3. Leads Management
- CRUD operations for leads
- Bulk email campaigns
- Google Maps navigation
- Import from Lead Finder

### 4. Lead Finder (AI-Powered) - UPDATED April 2026
**NEW: Built-in Database of 49 REAL German Döner Factories**
Including: Polat Dönerproduktion GmbH, ÖZTAS, Düzgün Food GmbH, BDK Berlin Döner Kebab, etc.

Features:
- 60+ countries with major cities
- Region filters (Europe, Middle East, Asia, Africa, Americas, Oceania)
- **Known factories database for Germany** (instant results, no API needed)
- **AI enhancement for additional factories** (via Gemini)
- Country-specific keywords:
  - Germany: "Döner Produktion", "Döner Fabrik", "Fleischverarbeitung"
  - Greece: "gyros", "souvlaki", "κρεατοσκευάσματα"
  - Turkey: "döner fabrikası", "et işleme tesisi"
- **STRICT filtering**: Only factories with GmbH/A.Ş./S.A./Ltd
- Fixed: Lead import accepts minimal data (empty email/tax_number OK)

### 5. Orders (Multi-Product Support)
- Multiple products per order
- Dynamic add/remove products in form
- Per-product subtotal calculation
- WhatsApp sharing (without total price)
- PDF generation with multi-product table

### 6. DHL Shipment Tracking - UPDATED April 2026
Features:
- **DHL Paket tracking** (German domestic)
- **DHL Express tracking** (International, CS/JD prefix numbers)
- Multi-language status labels (EN/TR/DE)
- Quick track feature with "DHL'de Gör" (View on DHL) button
- Status types: picked_up, in_transit, out_for_delivery, delivered, customs, exception, pending
- Link to official DHL tracking page

### 7. Recipes
- Recipe management
- Email sharing capability

### 8. Specifications
- PDF upload with automatic text extraction
- In-browser text editing
- PDF regeneration from edited text

### 9. Route Planner
- Interactive Leaflet map
- "Use My Location" GPS feature
- Auto-optimize route
- Address autocomplete

### 10. Daily Reports
- Multi-language support (EN, TR, DE, PL)
- Visit types (Meeting, Delivery, Support, Sales, Follow-up)
- PDF download

## Recent Updates (April 2026)

### Completed
- [x] DHL Tracking with real web scraping (Paket + Express support)
- [x] Lead Finder - 49 real German döner factories in database
- [x] Lead Finder - country-specific keywords
- [x] Lead Finder - STRICT factory filtering (no restaurants)
- [x] Lead Import fix - accepts minimal data
- [x] Dashboard agenda layout fix (overflow issues)
- [x] Multi-product orders support
- [x] WhatsApp sharing format (no total price)
- [x] PDF Turkish/Polish character support

### Pending
- [ ] UI Modernization (design_guidelines.json exists)
- [ ] Monthly Reports merged single PDF
- [ ] User Management in Settings
- [ ] Email Signature Configuration
- [ ] Download All Customers PDF

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`

### Leads
- `GET/POST /api/leads`
- `GET/PUT/DELETE /api/leads/{id}`
- `POST /api/leads/search` (Lead Finder - Database + AI)

### Orders
- `GET/POST /api/orders`
- `GET/PUT/DELETE /api/orders/{id}`
- `GET /api/orders/{id}/pdf`
- `GET /api/orders/{id}/whatsapp`

### Shipments (DHL)
- `GET/POST /api/shipments`
- `POST /api/shipments/{id}/refresh`
- `POST /api/shipments/refresh-all`
- `GET /api/tracking/{tracking_number}` (Quick track - supports Paket + Express)

## Database Collections
- `users`, `leads`, `orders`, `recipes`, `products`
- `specifications`, `daily_reports`, `agenda`
- `email_log`, `company_settings`, `shipments`

## Known Real German Döner Factories (in Lead Finder Database)
1. Polat Dönerproduktion GmbH (Mönchengladbach)
2. ÖZTAS Fleischhandel & Dönerproduktion e.K. (Moers)
3. Düzgün Food GmbH (Köln) - 320 employees, 40-60 tons daily
4. BDK - Berlin Döner Kebab (Berlin) - Since 1978, 3 factories
5. Birtat / Meat World SE (Ludwigsburg)
... and 44 more verified factories

## Known Issues
- Email features are MOCKED (logged to database, not sent)
- Gemini API has daily quota limits (uses free tier)

## Test Credentials
- **Username**: admin
- **Password**: 190371
