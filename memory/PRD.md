# Gewürzberg GmbH - B2B CRM Application

## Product Overview
A comprehensive B2B CRM application for Gewürzberg GmbH, a spice and binder factory based in Berlin, Germany. The application provides AI-powered customer management, email integration, shipment tracking, and multi-language support.

## Core Features

### 1. Dashboard
- Financial summary with revenue tracking
- Recent leads and shipments widgets
- Calendar with event management
- AI-powered sales forecasting
- Customer health indicators

### 2. Customer Management (Müşteriler)
- Full CRUD operations for leads
- Customer segmentation with AI
- Lead finder with German factory database (97 pre-seeded)
- PDF export functionality

### 3. Mail System (Gewürzberg E-Mail)
- **IMAP/SMTP Integration** via 1&1 IONOS
- **Pagination**: Page 1, 2, 3... navigation (20 emails per page)
- **Custom Folders**: Create/delete custom mail folders
- **Full-screen Reading Mode**: Toggle for email viewing
- **Attachment Handling**: Detection and display of email attachments
- **AI Features** (Multi-language: TR, EN, DE, PL, EL, BG):
  - AI Summary & Quick Reply
  - Translation (6 languages)
  - Spam Analysis
  - Customer Recognition
  - Sentiment Analysis
  - AI Compose with tone selection
  - Text improvement (improve, shorten, expand, formalize)
- **Email Settings**: IMAP/SMTP configuration dialog
- **Signature Management**: HTML signature editor with image support

### 4. Shipment Tracking (Kargo Takip)
- DHL API integration
- Real-time tracking status

### 5. Orders (Siparişler)
- Multi-product order management
- PDF invoice generation

### 6. Daily Reports (Günlük Raporlar)
- Visit logging with customer selection
- Email reports to recipients
- PDF export (daily/monthly)

### 7. Route Planner (Rota Planlayıcı)
- Google Maps integration
- Multi-stop route optimization

### 8. Multi-Language Support
Supported Languages:
- 🇹🇷 Türkçe (Turkish)
- 🇬🇧 English
- 🇩🇪 Deutsch (German)
- 🇵🇱 Polski (Polish)
- 🇬🇷 Ελληνικά (Greek) - NEW
- 🇧🇬 Български (Bulgarian) - NEW

## Technical Architecture

### Frontend
- React.js with Tailwind CSS
- Shadcn/UI components
- Context API for state management (Auth, Language)
- Axios for API calls

### Backend
- FastAPI (Python)
- MongoDB for data persistence
- IMAP/SMTP for email
- Emergent Integrations for AI (Gemini)

### Key API Endpoints
- `/api/mail/inbox?page=X&limit=Y&folder=INBOX` - Paginated email fetch
- `/api/mail/body/{email_id}` - Lazy load email body
- `/api/mail/folders` - Get/Create custom folders
- `/api/ai/summarize-email` - Multi-language AI summary
- `/api/ai/translate-email` - 6-language translation
- `/api/ai/compose-email` - Multi-language compose
- `/api/ai/analyze-spam` - Spam detection
- `/api/ai/recognize-customer` - CRM customer matching
- `/api/ai/analyze-sentiment` - Sentiment analysis

## What's Been Implemented (Latest Session - April 2026)

### Mail Inbox Enhancements
1. ✅ Language synchronization (TR/DE/EN/PL/EL/BG)
2. ✅ Pagination with total count (401 emails, 21 pages)
3. ✅ Custom folder creation/deletion
4. ✅ Full-screen email reading mode
5. ✅ Attachment indicators in email list
6. ✅ AI features with 6-language support:
   - Summary & Quick Reply
   - Translation to 6 languages
   - Spam Analysis
   - Customer Recognition
   - Sentiment Analysis

### Login Page
1. ✅ Language selector now works dynamically
2. ✅ Added Greek and Bulgarian languages

### Backend AI
1. ✅ Multi-language AI summarization
2. ✅ Multi-language email composition
3. ✅ 6-language translation support
4. ✅ Spam/Customer/Sentiment analysis endpoints

## Pending Issues (P1)

### 1. "All Customers" PDF Design
- Current PDF export layout needs professional redesign
- Files: `/app/backend/server.py` (ReportLab functions)

## Upcoming Tasks (P1)
- WhatsApp Business API Integration
- Automated Weekly Email via CRON

## Future Tasks (Backlog - P2)
- Inventory Tracking (Stok Takibi)
- Invoice Generation System
- Campaign Management
- Multi-user Roles (Admin, Sales, etc.)

## Test Credentials
See `/app/memory/test_credentials.md`

## 3rd Party Integrations
- **IMAP/SMTP**: 1&1 IONOS
- **AI**: Emergent LLM Key (Gemini 2.5 Flash)
- **DHL**: DHL Tracking API
- **SerpAPI**: For lead finding

## File Structure
```
/app/
├── backend/
│   ├── server.py          # FastAPI endpoints (~6700 lines)
│   ├── pdf_utils.py       # PDF generation
│   └── .env               # Backend config
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   └── LanguageContext.js  # 6 languages
│   │   ├── pages/
│   │   │   ├── MailInbox.js        # Full mail client
│   │   │   ├── Login.js            # 6 language selector
│   │   │   └── ...
│   │   └── components/ui/          # Shadcn components
│   └── .env
└── memory/
    ├── PRD.md
    └── test_credentials.md
```
