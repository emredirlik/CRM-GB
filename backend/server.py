from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    company_name: str
    tax_number: Optional[str] = ""
    address: Optional[str] = ""
    email: Optional[str] = ""
    city: Optional[str] = ""
    country: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    company_name: str
    tax_number: str
    address: str
    email: EmailStr
    city: str
    country: str
    notes: Optional[str] = ""

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company_name: Optional[str] = None
    tax_number: Optional[str] = None
    address: Optional[str] = None
    email: Optional[EmailStr] = None
    city: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None

class EmailTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    body: str
    language: str  # tr, de, en
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmailTemplateCreate(BaseModel):
    name: str
    subject: str
    body: str
    language: str

class SMTPSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    host: str
    port: int
    username: str
    password: str
    from_email: str
    from_name: str
    use_tls: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SMTPSettingsCreate(BaseModel):
    host: str
    port: int
    username: str
    password: str
    from_email: str
    from_name: str
    use_tls: bool = True

class EmailHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    lead_email: str
    lead_name: str
    company_name: str
    subject: str
    body: str
    status: str  # sent, failed
    error_message: Optional[str] = None
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SendEmailRequest(BaseModel):
    lead_id: str
    subject: str
    body: str

class GenerateEmailRequest(BaseModel):
    lead_id: str
    language: str  # tr, de, en
    tone: Optional[str] = "professional"  # professional, friendly, formal

class DashboardStats(BaseModel):
    total_leads: int
    emails_sent: int
    emails_failed: int
    recent_leads: List[dict]
    total_orders: int = 0
    total_revenue: float = 0.0

# Order Models
class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    lead_name: str  # For display
    company_name: str  # For display
    product_name: str
    product_code: str
    pieces: Optional[int] = 1  # Adet (kaç paket/kutu)
    quantity: Optional[int] = None  # Legacy field for backwards compatibility
    amount: Optional[float] = None  # Miktar (10 kg gibi)
    unit: Optional[str] = "kg"  # Birim (kg, g, adet, paket, litre)
    unit_price: float  # Birim fiyatı (€/kg gibi)
    total_price: float
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    lead_id: str
    product_name: str
    product_code: str
    pieces: int = 1
    amount: float
    unit: str
    unit_price: float
    notes: Optional[str] = ""

class OrderUpdate(BaseModel):
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    pieces: Optional[int] = None
    amount: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None

# Lead Finder Models
class SearchLeadsRequest(BaseModel):
    keywords: List[str]  # e.g., ["gyros producer", "döner manufacturer"]
    location: str  # e.g., "Athens"
    country: str  # e.g., "Greece"
    limit: int = 20

class FoundLeadResponse(BaseModel):
    company_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None

class SearchResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query_keywords: List[str]
    location: str
    country: str
    leads_found: List[dict]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "completed"

# ===================== HELPER FUNCTIONS =====================

def serialize_datetime(obj):
    """Convert datetime to ISO string for MongoDB storage"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def deserialize_datetime(doc, fields=['created_at', 'updated_at', 'sent_at']):
    """Convert ISO string back to datetime"""
    for field in fields:
        if field in doc and isinstance(doc[field], str):
            doc[field] = datetime.fromisoformat(doc[field])
    return doc

# ===================== LEAD ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"message": "SpiceCRM API is running"}

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead_data: LeadCreate):
    lead = Lead(**lead_data.model_dump())
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.leads.insert_one(doc)
    return lead

@api_router.get("/leads", response_model=List[Lead])
async def get_leads():
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    for lead in leads:
        deserialize_datetime(lead)
    return leads

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    deserialize_datetime(lead)
    return lead

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(lead_id: str, lead_data: LeadUpdate):
    existing = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    update_data = {k: v for k, v in lead_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    updated = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    deserialize_datetime(updated)
    return updated

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"message": "Lead deleted successfully"}

# ===================== EMAIL TEMPLATE ENDPOINTS =====================

@api_router.post("/templates", response_model=EmailTemplate)
async def create_template(template_data: EmailTemplateCreate):
    template = EmailTemplate(**template_data.model_dump())
    doc = template.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.email_templates.insert_one(doc)
    return template

@api_router.get("/templates", response_model=List[EmailTemplate])
async def get_templates():
    templates = await db.email_templates.find({}, {"_id": 0}).to_list(100)
    for template in templates:
        deserialize_datetime(template, ['created_at'])
    return templates

@api_router.get("/templates/{template_id}", response_model=EmailTemplate)
async def get_template(template_id: str):
    template = await db.email_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    deserialize_datetime(template, ['created_at'])
    return template

@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    result = await db.email_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}

# ===================== SMTP SETTINGS ENDPOINTS =====================

@api_router.post("/settings/smtp", response_model=SMTPSettings)
async def save_smtp_settings(settings_data: SMTPSettingsCreate):
    # Delete existing settings and insert new
    await db.smtp_settings.delete_many({})
    settings = SMTPSettings(**settings_data.model_dump())
    doc = settings.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.smtp_settings.insert_one(doc)
    return settings

@api_router.get("/settings/smtp")
async def get_smtp_settings():
    settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if not settings:
        return None
    deserialize_datetime(settings, ['updated_at'])
    return settings

@api_router.post("/settings/smtp/test")
async def test_smtp_connection():
    settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")
    
    try:
        if settings.get('use_tls', True):
            server = smtplib.SMTP(settings['host'], settings['port'])
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings['host'], settings['port'])
        
        server.login(settings['username'], settings['password'])
        server.quit()
        return {"success": True, "message": "SMTP connection successful"}
    except Exception as e:
        return {"success": False, "message": str(e)}

# ===================== EMAIL SENDING ENDPOINTS =====================

async def send_email_background(lead: dict, subject: str, body: str, settings: dict):
    """Background task to send email"""
    history_id = str(uuid.uuid4())
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{settings['from_name']} <{settings['from_email']}>"
        msg['To'] = lead['email']
        
        # Create HTML version
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            {body.replace(chr(10), '<br>')}
        </body>
        </html>
        """
        
        part1 = MIMEText(body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        if settings.get('use_tls', True):
            server = smtplib.SMTP(settings['host'], settings['port'])
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings['host'], settings['port'])
        
        server.login(settings['username'], settings['password'])
        server.sendmail(settings['from_email'], lead['email'], msg.as_string())
        server.quit()
        
        # Save to history
        history = {
            "id": history_id,
            "lead_id": lead['id'],
            "lead_email": lead['email'],
            "lead_name": f"{lead['first_name']} {lead['last_name']}",
            "company_name": lead['company_name'],
            "subject": subject,
            "body": body,
            "status": "sent",
            "error_message": None,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
        await db.email_history.insert_one(history)
        logger.info(f"Email sent successfully to {lead['email']}")
        
    except Exception as e:
        # Save failed attempt to history
        history = {
            "id": history_id,
            "lead_id": lead['id'],
            "lead_email": lead['email'],
            "lead_name": f"{lead['first_name']} {lead['last_name']}",
            "company_name": lead['company_name'],
            "subject": subject,
            "body": body,
            "status": "failed",
            "error_message": str(e),
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
        await db.email_history.insert_one(history)
        logger.error(f"Failed to send email to {lead['email']}: {str(e)}")

@api_router.post("/emails/send")
async def send_email(request: SendEmailRequest, background_tasks: BackgroundTasks):
    # Get lead
    lead = await db.leads.find_one({"id": request.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get SMTP settings
    settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")
    
    # Send email in background
    background_tasks.add_task(send_email_background, lead, request.subject, request.body, settings)
    
    return {"message": "Email queued for sending"}

@api_router.post("/emails/send-bulk")
async def send_bulk_emails(lead_ids: List[str], subject: str, body: str, background_tasks: BackgroundTasks):
    settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")
    
    for lead_id in lead_ids:
        lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
        if lead:
            background_tasks.add_task(send_email_background, lead, subject, body, settings)
    
    return {"message": f"Queued {len(lead_ids)} emails for sending"}

# ===================== AI EMAIL GENERATION =====================

@api_router.post("/emails/generate")
async def generate_email(request: GenerateEmailRequest):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get lead info
    lead = await db.leads.find_one({"id": request.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get API key
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    # Language prompts
    language_prompts = {
        "tr": "Türkçe olarak yaz. Alıcı Türk bir firma.",
        "de": "Schreibe auf Deutsch. Der Empfänger ist ein deutsches Unternehmen.",
        "en": "Write in English. The recipient is an international company."
    }
    
    tone_prompts = {
        "professional": "professional and business-like",
        "friendly": "friendly but professional",
        "formal": "very formal and respectful"
    }
    
    system_message = f"""You are a sales representative for a spice and binder manufacturing company based in Berlin, Germany. 
Your company produces high-quality spices and binders for food manufacturers, especially those producing döner, gyros, kebab, and souvlaki.

Write a {tone_prompts.get(request.tone, 'professional')} B2B sales email.
{language_prompts.get(request.language, language_prompts['en'])}

The email should:
1. Introduce your company briefly
2. Mention the benefits of your products (quality, consistency, competitive pricing)
3. Express interest in potential partnership
4. Include a call to action (request a meeting or call)

Keep the email concise (3-4 paragraphs max).
Do not include subject line in the body - return it separately.
"""

    user_prompt = f"""Write a sales email to:
- Contact: {lead['first_name']} {lead['last_name']}
- Company: {lead['company_name']}
- Location: {lead['city']}, {lead['country']}

Return the response in this exact JSON format:
{{"subject": "Email subject here", "body": "Email body here"}}
"""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"email-gen-{lead['id']}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=user_prompt))
        
        # Parse JSON response
        import json
        # Try to extract JSON from response
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        try:
            email_data = json.loads(response_text.strip())
            return {"subject": email_data.get("subject", ""), "body": email_data.get("body", "")}
        except json.JSONDecodeError:
            # Fallback: return raw response
            return {"subject": f"Partnership Opportunity - {lead['company_name']}", "body": response}
            
    except Exception as e:
        logger.error(f"AI email generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate email: {str(e)}")

# ===================== EMAIL HISTORY ENDPOINTS =====================

@api_router.get("/emails/history", response_model=List[EmailHistory])
async def get_email_history():
    history = await db.email_history.find({}, {"_id": 0}).sort("sent_at", -1).to_list(500)
    for item in history:
        deserialize_datetime(item, ['sent_at'])
    return history

@api_router.get("/emails/history/{lead_id}", response_model=List[EmailHistory])
async def get_lead_email_history(lead_id: str):
    history = await db.email_history.find({"lead_id": lead_id}, {"_id": 0}).sort("sent_at", -1).to_list(100)
    for item in history:
        deserialize_datetime(item, ['sent_at'])
    return history

# ===================== DASHBOARD ENDPOINTS =====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    total_leads = await db.leads.count_documents({})
    emails_sent = await db.email_history.count_documents({"status": "sent"})
    emails_failed = await db.email_history.count_documents({"status": "failed"})
    
    recent_leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    for lead in recent_leads:
        deserialize_datetime(lead)
    
    # Order stats
    total_orders = await db.orders.count_documents({})
    
    # Calculate total revenue from delivered orders
    pipeline = [
        {"$match": {"status": {"$in": ["delivered", "shipped", "confirmed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0.0
    
    return DashboardStats(
        total_leads=total_leads,
        emails_sent=emails_sent,
        emails_failed=emails_failed,
        recent_leads=recent_leads,
        total_orders=total_orders,
        total_revenue=total_revenue
    )

# ===================== ORDER ENDPOINTS =====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Get lead info
    lead = await db.leads.find_one({"id": order_data.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Calculate total price: pieces × amount × unit_price
    # Example: 1 × 10 kg × 4 €/kg = 40 €
    total_price = order_data.pieces * order_data.amount * order_data.unit_price
    
    order = Order(
        lead_id=order_data.lead_id,
        lead_name=f"{lead['first_name']} {lead['last_name']}",
        company_name=lead['company_name'],
        product_name=order_data.product_name,
        product_code=order_data.product_code,
        pieces=order_data.pieces,
        amount=order_data.amount,
        unit=order_data.unit,
        unit_price=order_data.unit_price,
        total_price=total_price,
        notes=order_data.notes
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        deserialize_datetime(order)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    deserialize_datetime(order)
    return order

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_data: OrderUpdate):
    existing = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {k: v for k, v in order_data.model_dump().items() if v is not None}
    
    # Recalculate total: pieces × amount × unit_price
    pieces = update_data.get('pieces', existing.get('pieces', 1))
    amount = update_data.get('amount', existing.get('amount', existing.get('quantity', 1)))
    unit_price = update_data.get('unit_price', existing['unit_price'])
    update_data['total_price'] = pieces * amount * unit_price
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    deserialize_datetime(updated)
    return updated

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted successfully"}

@api_router.get("/orders/lead/{lead_id}", response_model=List[Order])
async def get_lead_orders(lead_id: str):
    orders = await db.orders.find({"lead_id": lead_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for order in orders:
        deserialize_datetime(order)
    return orders

# ===================== LEAD FINDER ENDPOINTS =====================

@api_router.post("/leads/search")
async def search_for_leads(request: SearchLeadsRequest):
    """Search for potential leads using AI-powered search"""
    from lead_finder import LeadFinderService, SEARCH_TEMPLATES
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="LLM API key not configured")
    
    finder = LeadFinderService(api_key)
    
    try:
        # Search for leads
        found_leads = await finder.search_leads(
            keywords=request.keywords,
            location=request.location,
            country=request.country,
            limit=request.limit
        )
        
        # Convert to response format
        leads_data = []
        for lead in found_leads:
            leads_data.append({
                "company_name": lead.company_name,
                "email": lead.email,
                "phone": lead.phone,
                "address": lead.address,
                "city": lead.city,
                "country": lead.country,
                "website": lead.website,
                "description": lead.description,
                "source": lead.source
            })
        
        # Save search result to database
        search_result = {
            "id": str(uuid.uuid4()),
            "query_keywords": request.keywords,
            "location": request.location,
            "country": request.country,
            "leads_found": leads_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "completed"
        }
        await db.search_history.insert_one(search_result)
        
        return {
            "status": "success",
            "total_found": len(leads_data),
            "leads": leads_data
        }
        
    except Exception as e:
        logger.error(f"Lead search failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@api_router.get("/leads/search/templates")
async def get_search_templates():
    """Get predefined search templates for common industries"""
    from lead_finder import SEARCH_TEMPLATES
    return SEARCH_TEMPLATES

@api_router.get("/leads/search/history")
async def get_search_history():
    """Get history of lead searches"""
    history = await db.search_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    for item in history:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return history

@api_router.post("/leads/import")
async def import_found_leads(leads: List[dict]):
    """Import found leads into the main leads database"""
    imported = []
    skipped = []
    
    for lead_data in leads:
        # Check if lead already exists by email or company name
        existing = None
        if lead_data.get('email'):
            existing = await db.leads.find_one({"email": lead_data['email']}, {"_id": 0})
        if not existing and lead_data.get('company_name'):
            existing = await db.leads.find_one({"company_name": lead_data['company_name']}, {"_id": 0})
        
        if existing:
            skipped.append(lead_data.get('company_name', 'Unknown'))
            continue
        
        # Create new lead
        new_lead = {
            "id": str(uuid.uuid4()),
            "first_name": lead_data.get('contact_name', '').split()[0] if lead_data.get('contact_name') else "Contact",
            "last_name": lead_data.get('contact_name', '').split()[-1] if lead_data.get('contact_name') and len(lead_data.get('contact_name', '').split()) > 1 else "",
            "company_name": lead_data.get('company_name', 'Unknown'),
            "tax_number": lead_data.get('tax_number', ''),
            "address": lead_data.get('address', ''),
            "email": lead_data.get('email', f"contact@{lead_data.get('company_name', 'unknown').lower().replace(' ', '')}.com"),
            "city": lead_data.get('city', ''),
            "country": lead_data.get('country', ''),
            "notes": f"Source: {lead_data.get('source', 'AI Search')}\nWebsite: {lead_data.get('website', 'N/A')}\nPhone: {lead_data.get('phone', 'N/A')}\nDescription: {lead_data.get('description', '')}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.leads.insert_one(new_lead)
        imported.append(new_lead['company_name'])
    
    return {
        "status": "success",
        "imported_count": len(imported),
        "skipped_count": len(skipped),
        "imported": imported,
        "skipped": skipped
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

