# Gewürzberg CRM - Product Requirements Document

## Project Overview
B2B CRM application for Gewürzberg GmbH, a spice/binder factory based in Berlin. The system manages leads, orders, recipes, product specifications, and daily reports with AI-powered features.

## Tech Stack
- **Frontend**: React.js, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (motor async)
- **AI Integration**: Gemini API (via Emergent LLM Key)
- **PDF Generation**: ReportLab with DejaVu fonts (UTF-8 support)

## Core Modules

### 1. Authentication
- JWT-based authentication
- Admin user: `admin` / `190371`

### 2. Dashboard
- Stats cards (leads, orders, revenue, emails)
- Revenue target progress
- AI Sales Forecast widget
- Calendar with Visit Planning
- Upcoming Visits sidebar

### 3. Leads Management
- CRUD operations for leads
- Bulk email campaigns
- Google Maps navigation
- Import from Lead Finder

### 4. Lead Finder (AI-Powered)
- 60+ countries with major cities
- Region filters (Europe, Middle East, Asia, Africa, Americas, Oceania)
- Keyword filters (Gyros, Döner, Meat Processing, Halal, etc.)
- Predefined factory database + Gemini AI enhancement
- Quick search buttons

### 5. Orders (Multi-Product Support) ✅ COMPLETED
- **Multiple products per order** - Fully implemented!
- Dynamic add/remove products in form
- Per-product subtotal calculation
- Total price = sum of all subtotals
- WhatsApp sharing with PDF
- PDF generation with multi-product table

### 6. Recipes
- Recipe management
- Email sharing capability

### 7. Specifications
- PDF upload with automatic text extraction (pdfplumber/PyMuPDF)
- In-browser text editing
- PDF regeneration from edited text

### 8. Route Planner
- Interactive Leaflet map
- "Use My Location" GPS feature
- Auto-optimize route (nearest neighbor algorithm)
- Address autocomplete
- Google Maps integration

### 9. Daily Reports
- Multi-language support (EN, TR, DE, PL)
- Visit types (Meeting, Delivery, Support, Sales, Follow-up)
- Full day PDF download (clean minimal design)
- Email reports feature (MOCKED)

## Implemented Features

### Phase 1 - Completed (March 2026)
- [x] Lead Finder with 60+ countries
- [x] Route Planner GPS location
- [x] Route auto-optimization
- [x] Daily Reports multi-language
- [x] PDF text wrapping fix
- [x] AI Sales Forecast
- [x] Visit Planning on Dashboard
- [x] **Multiple products per order** ✅

### Phase 2 - Pending
- [ ] AI Email Assistant (Gemini)
- [ ] AI Churn Prediction
- [ ] AI Recipe Optimization
- [ ] AI Chatbot
- [ ] AI Route Optimization (advanced)

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`

### Leads
- `GET/POST /api/leads`
- `GET/PUT/DELETE /api/leads/{id}`
- `POST /api/leads/search` (Lead Finder)
- `POST /api/leads/bulk-email`

### Orders (Updated for Multi-Product)
- `GET/POST /api/orders`
- `GET/PUT/DELETE /api/orders/{id}`
- `GET /api/orders/{id}/pdf`
- `GET /api/orders/{id}/whatsapp`

**OrderCreate Schema:**
```json
{
  "lead_id": "string",
  "products": [
    {
      "product_name": "string",
      "product_code": "string",
      "pieces": 1,
      "amount": 10.0,
      "unit": "kg",
      "unit_price": 5.50
    }
  ],
  "notes": "string"
}
```

### Specifications
- `GET/POST /api/specifications`
- `POST /api/specifications/upload-pdf`
- `GET /api/specifications/{id}/text`
- `PUT /api/specifications/{id}/text`
- `GET /api/specifications/{id}/regenerate-pdf`

### Daily Reports
- `GET/POST /api/daily-reports`
- `GET /api/daily-reports/date/{date}/pdf`
- `POST /api/daily-reports/date/{date}/email` (MOCKED)

### Route Planner
- `GET /api/geocode/search`
- `GET /api/geocode/reverse`
- `POST /api/route/calculate`
- `POST /api/route/pdf`

### Analytics
- `GET /api/dashboard/stats`
- `GET /api/sales/forecast`

## Database Collections
- `users`
- `leads`
- `orders` (Updated: now contains `products` array)
- `recipes`
- `products`
- `specifications`
- `daily_reports`
- `agenda`
- `email_log`
- `company_settings`

## Known Issues
- Email features are MOCKED (logged to database, not sent)

## Future Enhancements
- WhatsApp Business API integration
- Real email integration (SendGrid/Resend)
- Advanced AI features (Churn prediction, Email assistant, Recipe optimization)
