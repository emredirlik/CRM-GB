# Gewürzberg GmbH - B2B CRM PRD

## Original Problem Statement
B2B CRM application for a spice/binder factory based in Berlin (Gewürzberg GmbH). Target customers are Döner, Gyros, and Kebab factories across Europe.

## Core Features (COMPLETED)
1. **Authentication System** - Login with username/password (JWT)
2. **Dashboard** - Stats, Calendar, clickable cards, revenue target
3. **Lead Management** - CRUD with Google Maps navigation button
4. **Order Management** - Orders with PDF, WhatsApp PDF sharing
5. **Recipe Management** - Custom recipes with PDF, email sending
6. **Product Management** - Product catalog
7. **Specifications** - PDF upload, preview, edit, email
8. **Route Planner** - Map-based with address autocomplete, predefined city coords
9. **Email Composer** - SMTP integration, attachments
10. **Lead Finder** - AI-powered using Gemini API
11. **Daily Reports** - Visit reports by date with PDF export
12. **Multi-language** - EN, TR, DE, PL support

## Recent Updates (March 27, 2026)
- **WhatsApp PDF Sharing** - Orders now include PDF link in WhatsApp message
- **Specifications PDF Preview** - Full screen PDF viewer in modal
- **Google Maps Navigation** - "Git" button on Leads to open in Google Maps
- **Daily Reports Module** - New page for daily visit tracking
- **Route Planner Fixed** - Predefined city coordinates for common locations
- **Gemini Lead Finder** - Now finding 10+ leads per search

## Tech Stack
- **Frontend**: React 18, TailwindCSS, Shadcn UI
- **Backend**: FastAPI (Python), Motor (async MongoDB)
- **Database**: MongoDB
- **APIs**: Gemini (lead finding), Nominatim (geocoding)
- **PDF**: ReportLab with DejaVu fonts

## API Endpoints
- `/api/auth/*` - Authentication
- `/api/leads/*` - Lead CRUD
- `/api/orders/*` - Order CRUD + WhatsApp PDF
- `/api/recipes/*` - Recipe CRUD + email
- `/api/specifications/*` - PDF upload, preview, download, email
- `/api/daily-reports/*` - Daily visit reports
- `/api/route/*` - Route calculation
- `/api/geocode/*` - Address geocoding
- `/api/leads/search` - AI lead search (Gemini)
- `/api/agenda/*` - Calendar events
- `/api/dashboard/stats` - Dashboard statistics

## Database Collections
- `users` - Authentication
- `leads` - Customer data
- `orders` - Order records
- `recipes` - Production recipes
- `specifications` - PDF specifications
- `daily_reports` - Visit reports
- `agenda` - Calendar events
- `company_settings` - Company info
- `smtp_settings` - Email configuration

## Completed Tasks
- [x] Authentication system (admin/190371)
- [x] Dashboard with calendar
- [x] PDF generation with Turkish characters
- [x] Lead finder with Gemini API
- [x] Specifications PDF upload & preview
- [x] Recipes email functionality
- [x] Route planner with geocoding
- [x] Daily Reports module
- [x] WhatsApp PDF sharing
- [x] Google Maps navigation from Leads

## Potential Future Enhancements
- Auto-reply for incoming emails
- WhatsApp Business API integration
- Bulk email campaigns
- Customer visit scheduling
- Revenue forecasting with AI
