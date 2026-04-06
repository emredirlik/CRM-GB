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

### 4. Lead Finder (SerpAPI - Real Google Maps Data) - UPDATED April 2026
**NEW: Real factory data from Google Maps via SerpAPI**

Features:
- 60+ countries with major cities
- **SerpAPI Integration** - Searches Google Maps for REAL businesses
- **User-defined search keywords** - Users can type their own search terms
- **Keyword presets**: Döner Fabrikası, Gyros Üretim, Kebap Fabrikası, Et İşleme, Helal Et, Cinar Food, Özturk
- **Quick location buttons**: Berlin, Athens, Istanbul, Bucharest, Madrid, Amsterdam, Dubai
- **Real phone numbers and websites** from Google Maps
- **Strict restaurant filtering** - No restaurants, imbiss, fast food
- **Fallback to AI** (Gemini) if SerpAPI has no results
- Lead import accepts minimal data (empty email/tax_number OK)

API Key: SERPAPI_KEY in backend/.env

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
- **Note**: DHL API key pending activation (401 error)

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

### Completed (April 6, 2026 - Latest)
- [x] **Admin Account Updated** - Username: emre@gewuerzberg.de, Password: 190371
- [x] **Download All Customers PDF** - New "PDF İndir" button on Leads page
- [x] **Shipments Mobile Layout Fixed** - Card-based responsive design, no horizontal scroll
- [x] **Shipments Full Localization** - TR/DE/EN/PL translations for all texts
- [x] **Specifications Page Translated** - All UI text in Turkish/German/English/Polish
- [x] **Daily Reports Card View** - Replaced table with card layout
- [x] **Monthly Report PDF Download** - New "Aylık Rapor İndir" button
- [x] **DHL Real Tracking Verified** - CS638795298DE tracking works
- [x] **LanguageContext Extended** - Added admin, logout, mail, signature keys for all languages

### Previously Completed
- [x] **SerpAPI Integration** - Real Google Maps data for Lead Finder
- [x] **DHL Official API integration** - Working with key (KmQLlhNJirCHXDovLQAZ9AJt7PbR6nGK)
- [x] **Multi-Language Support** - Full TR/EN/DE/PL translation coverage
- [x] **Gmail-like Mail Inbox** - Dark theme, categories, compose dialog
- [x] **Admin User Management Page** - Restricted to admin users
- [x] **Product Videos Tab** - New section for product video management
- [x] **Orders/Leads Card View** - Modern card layout instead of tables
- [x] **Mobile Header Branding** - "Gewürzberg GmbH" and username visible

### Pending
- [ ] Email Signature Configuration (backend wiring)
- [ ] Product Videos Drag & Drop + WhatsApp sharing validation

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`

### Leads
- `GET/POST /api/leads`
- `GET/PUT/DELETE /api/leads/{id}`
- `POST /api/leads/search` (Lead Finder - SerpAPI + AI fallback)

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

## Environment Variables
### Backend (.env)
- MONGO_URL
- DB_NAME
- EMERGENT_LLM_KEY
- SERPAPI_KEY
- DHL_API_KEY

### Frontend (.env)
- REACT_APP_BACKEND_URL

## Known Issues
- Email features are MOCKED (logged to database, not sent)
- Greek Lead Finder results are hardcoded (60 factories)

## Test Credentials
- **Username**: admin
- **Password**: 190371
