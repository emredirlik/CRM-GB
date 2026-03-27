# Gewürzberg GmbH - B2B CRM PRD

## Original Problem Statement
B2B CRM application for a spice/binder factory based in Berlin (Gewürzberg GmbH). Target customers are Döner, Gyros, and Kebab factories across Europe.

## Core Features (COMPLETED)
1. **Authentication System** - Login with username/password (JWT)
2. **Dashboard** - Stats, Calendar, clickable cards, revenue target
3. **Lead Management** - CRUD for customer leads
4. **Order Management** - Orders with PDF generation
5. **Recipe Management** - Custom recipes with PDF, email sending
6. **Product Management** - Product catalog
7. **Specifications** - PDF upload, edit, email to customers
8. **Route Planner** - Map-based with address autocomplete
9. **Email Composer** - SMTP integration, attachments
10. **Lead Finder** - AI-powered using Gemini API
11. **Multi-language** - EN, TR, DE, PL support

## Recent Updates (March 27, 2026)
- **Dashboard Calendar** - Replaced Agenda with interactive calendar
- **Gemini Lead Finder** - Switched from Kimi to Gemini API for better results
- **Specifications PDF Upload** - Simplified to drag-drop PDF upload only
- **Recipes Email** - Added email button to send recipes
- **Route Planner** - Turkish localization, improved geocoding

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **APIs**: Gemini (lead finding), Nominatim (geocoding)
- **PDF**: ReportLab with DejaVu fonts

## API Endpoints
- `/api/auth/*` - Authentication
- `/api/leads/*` - Lead CRUD
- `/api/orders/*` - Order CRUD
- `/api/recipes/*` - Recipe CRUD + email
- `/api/specifications/*` - PDF upload, download, email
- `/api/route/*` - Route calculation
- `/api/geocode/*` - Address geocoding
- `/api/lead-finder/*` - AI lead search
- `/api/agenda/*` - Calendar events
- `/api/dashboard/stats` - Dashboard statistics

## Database Collections
- `users` - Authentication
- `leads` - Customer data
- `orders` - Order records
- `recipes` - Production recipes
- `specifications` - PDF specifications
- `agenda` - Calendar events
- `company_settings` - Company info
- `smtp_settings` - Email configuration

## Completed Tasks
- [x] Authentication system (admin/190371)
- [x] Dashboard with calendar
- [x] PDF generation with Turkish characters
- [x] Lead finder with Gemini API
- [x] Specifications PDF upload
- [x] Recipes email functionality
- [x] Route planner with geocoding

## Pending/Future Tasks
- [ ] WhatsApp PDF sharing
- [ ] Auto-reply for emails
- [ ] WhatsApp Business API integration
