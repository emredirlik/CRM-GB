# Gewürzberg GmbH - B2B CRM PRD

## Original Problem Statement
B2B CRM application for a spice/binder factory based in Berlin (Gewürzberg GmbH). Target customers are Döner, Gyros, and Kebab factories across Europe.

## Core Features (COMPLETED)
1. **Authentication System** - Login with username/password (JWT)
2. **Dashboard** - Stats, Calendar, clickable cards, revenue target
3. **Lead Management** - CRUD with Google Maps navigation, bulk email
4. **Order Management** - Orders with PDF, WhatsApp PDF sharing
5. **Recipe Management** - Custom recipes with PDF, email sending
6. **Product Management** - Product catalog
7. **Specifications** - PDF upload, preview, edit, email
8. **Route Planner** - Map-based with address autocomplete
9. **Email Composer** - SMTP integration, attachments
10. **Lead Finder** - SUPER FAST with local factory database + Gemini AI
11. **Daily Reports** - Visit reports by date with combined PDF export
12. **Bulk Email Campaign** - Send promotions to multiple customers
13. **Multi-language** - EN, TR, DE, PL support

## Recent Updates (March 27, 2026)
- **Lead Finder MEGA UPDATE** - Local factory database for instant results (0.2s)
- **Factory Database** - 50+ real factories in Greece, Germany, Turkey, Netherlands, Poland
- **Bulk Email Campaign** - Select multiple leads and send promotional emails
- **Daily Reports Combined PDF** - Download all reports for a date in one PDF
- **Modern PDF Design** - Colorful cards with visit type badges
- **Quick Search Buttons** - 🇬🇷 Athens, 🇩🇪 Berlin, 🇹🇷 Istanbul etc.

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **APIs**: Gemini (lead finding), Nominatim (geocoding)
- **PDF**: ReportLab with DejaVu fonts

## API Endpoints
- `/api/auth/*` - Authentication
- `/api/leads/*` - Lead CRUD
- `/api/leads/search` - Factory search (Gemini + local DB)
- `/api/orders/*` - Order CRUD + WhatsApp PDF
- `/api/recipes/*` - Recipe CRUD + email
- `/api/specifications/*` - PDF upload, preview, download
- `/api/daily-reports/*` - Visit reports + combined PDF
- `/api/daily-reports/date/{date}/pdf` - Combined daily PDF
- `/api/route/*` - Route calculation
- `/api/geocode/*` - Address geocoding
- `/api/agenda/*` - Calendar events

## Database Collections
- `users` - Authentication
- `leads` - Customer data
- `orders` - Order records
- `recipes` - Production recipes
- `specifications` - PDF specifications
- `daily_reports` - Visit reports
- `agenda` - Calendar events
- `company_settings` - Company info
- `search_history` - Lead search history

## Completed Tasks
- [x] Authentication system (admin/190371)
- [x] Dashboard with calendar
- [x] PDF generation with Turkish characters
- [x] Lead finder with local database + Gemini
- [x] Specifications PDF upload & preview
- [x] Recipes email functionality
- [x] Route planner with geocoding
- [x] Daily Reports with combined PDF
- [x] WhatsApp PDF sharing
- [x] Google Maps navigation
- [x] Bulk email campaign

## Factory Database Coverage
- **Greece**: Athens (10), Thessaloniki (5)
- **Germany**: Berlin (5), Munich (3), Hamburg (2)
- **Turkey**: Istanbul (6), Ankara (2)
- **Netherlands**: Amsterdam (2), Rotterdam (2)
- **Poland**: Warsaw (2), Krakow (1)

## Potential Future Enhancements
- AI Sales Forecast using order history
- Visit scheduling in calendar
- WhatsApp Business API integration
- PDF content editing
