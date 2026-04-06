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

### Customer Management
- Activity History tracking (visit/call/email outcomes)
- AI suggestions based on activity
- Bulk email with checkbox selection (mobile + desktop)
- PDF/Excel export
- Last activity and next action visible on cards

### Activity PDF Reports
- `/api/reports/activities/pdf` - Generate report
- `/api/reports/activities/download` - Direct download
- Filter by lead/date range

### Product Videos
- Folder system (create/delete folders)
- Video upload with progress
- WhatsApp/Email sharing

### Other Modules
- DHL Shipment Tracking (indigo theme)
- Lead Finder (SerpAPI)
- Orders with payment tracking
- Recipes, Specifications
- Route Planner
- AI Analytics
- Mail with IMAP/SMTP

### PWA Support
- manifest.json
- Service Worker
- Install banner for iOS/Android

## Test Credentials
- **Admin**: emre@gewuerzberg.de / 190371
- **URL**: https://customer-agent-2.preview.emergentagent.com

## API Keys Required
- SERPAPI_KEY
- DHL_API_KEY  
- EMERGENT_LLM_KEY
