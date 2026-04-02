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
- 60+ countries with major cities
- Region filters (Europe, Middle East, Asia, Africa, Americas, Oceania)
- **Country-specific search keywords**:
  - Germany/Europe: "Döner Produktion", "Döner Fabrik", "Fleischverarbeitung"
  - Greece: "gyros", "souvlaki", "κρεατοσκευάσματα"
  - Turkey: "döner fabrikası", "döner üretim tesisi"
- **STRICT filtering**: Only factories with GmbH/A.Ş./S.A./Ltd in name
- NO restaurants, shops, or retail businesses
- Fixed: Lead import now accepts minimal data (empty email/tax_number allowed)

### 5. Orders (Multi-Product Support)
- Multiple products per order
- Dynamic add/remove products in form
- Per-product subtotal calculation
- WhatsApp sharing (without total price)
- PDF generation with multi-product table

### 6. DHL Shipment Tracking - UPDATED April 2026
- **REAL tracking data** (not demo/mock)
- Web scraping via BeautifulSoup4
- Status types: picked_up, in_transit, out_for_delivery, delivered, exception
- Multi-language status labels (EN/TR/DE)
- Quick track feature
- Link to DHL website

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
- [x] DHL Tracking with REAL data (web scraping, not demo)
- [x] Lead Finder - country-specific keywords (Döner Produktion for DE, gyros/souvlaki for GR)
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
- `POST /api/leads/search` (Lead Finder - AI)

### Orders
- `GET/POST /api/orders`
- `GET/PUT/DELETE /api/orders/{id}`
- `GET /api/orders/{id}/pdf`
- `GET /api/orders/{id}/whatsapp`

### Shipments (DHL)
- `GET/POST /api/shipments`
- `POST /api/shipments/{id}/refresh`
- `POST /api/shipments/refresh-all`
- `GET /api/tracking/{tracking_number}` (Quick track)

## Database Collections
- `users`, `leads`, `orders`, `recipes`, `products`
- `specifications`, `daily_reports`, `agenda`
- `email_log`, `company_settings`, `shipments`

## Known Issues
- Email features are MOCKED (logged to database, not sent)

## Test Credentials
- **Username**: admin
- **Password**: 190371
