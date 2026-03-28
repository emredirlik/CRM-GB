from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Response, Request, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from email.mime.base import MIMEBase
from email import encoders
import bcrypt
import jwt
from urllib.parse import quote
import base64

# Import PDF utilities
from pdf_utils import generate_order_pdf, generate_recipe_pdf, generate_lead_pdf, generate_route_pdf, generate_specification_pdf, generate_daily_report_pdf, generate_combined_daily_report_pdf

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

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

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id, 
        "username": username, 
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    # Check cookie first
    token = request.cookies.get("access_token")
    # Then check Authorization header
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================== AUTH MODELS =====================

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    name: str
    role: str

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

# Product Models - Ürün Kataloğu
class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    description: Optional[str] = ""
    default_unit: str = "kg"
    default_price: float = 0.0
    category: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = ""
    default_unit: str = "kg"
    default_price: float = 0.0
    category: Optional[str] = ""

# Company Settings - Firma Ayarları
class CompanySettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "company_settings"
    company_name: str = "SpiceCRM"
    logo_url: Optional[str] = None
    address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    website: Optional[str] = ""
    tax_number: Optional[str] = ""
    yearly_target: float = 0.0  # Yıllık hedef ciro
    currency: str = "EUR"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Order Models - Multi-Product Support
class OrderProductItem(BaseModel):
    """Single product item within an order"""
    product_name: str
    product_code: str
    pieces: int = 1  # Adet (kaç paket/kutu)
    amount: float  # Miktar (10 kg gibi)
    unit: str = "kg"  # Birim (kg, g, adet, paket, litre)
    unit_price: float  # Birim fiyatı (€/kg gibi)
    subtotal: Optional[float] = None  # pieces × amount × unit_price

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str
    lead_name: str  # For display
    company_name: str  # For display
    # Multi-product support
    products: List[OrderProductItem] = []
    # Legacy single-product fields (for backwards compatibility)
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    pieces: Optional[int] = 1
    quantity: Optional[int] = None
    amount: Optional[float] = None
    unit: Optional[str] = "kg"
    unit_price: Optional[float] = None
    total_price: float
    status: str = "pending"  # pending, confirmed, shipped, delivered, cancelled
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreateProductItem(BaseModel):
    """Product item for order creation"""
    product_name: str
    product_code: str
    pieces: int = 1
    amount: float
    unit: str = "kg"
    unit_price: float

class OrderCreate(BaseModel):
    lead_id: str
    # Multi-product support
    products: List[OrderCreateProductItem] = []
    # Legacy single-product fields (for backwards compatibility)
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    pieces: int = 1
    amount: Optional[float] = None
    unit: str = "kg"
    unit_price: Optional[float] = None
    notes: Optional[str] = ""

class OrderUpdate(BaseModel):
    products: Optional[List[OrderProductItem]] = None
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

# Recipe Models - Müşteriye özel üretim reçeteleri
class RecipeIngredient(BaseModel):
    name: str  # Malzeme adı
    amount: float  # Miktar
    unit: str  # Birim (kg, g, L, ml, dakika, rpm vb.)

class Recipe(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    lead_id: str  # Hangi müşteriye ait
    lead_name: str  # Müşteri adı (görüntüleme için)
    company_name: str  # Firma adı
    name: str  # Reçete adı (örn: "Gyros Özel Karışım")
    product_code: str  # Ürün kodu
    # Malzemeler
    meat_amount: float  # Et miktarı (kg)
    water_amount: float  # Su miktarı (L)
    spice_amount: float  # Baharat miktarı (kg)
    binding_amount: float  # Bağlayıcı (binding) miktarı (kg)
    # Üretim parametreleri
    mixing_time: int  # Karışım süresi (dakika)
    motor_speed: int  # Motor hızı (rpm)
    # Ek malzemeler (dinamik liste)
    additional_ingredients: Optional[List[dict]] = []  # [{"name": "Tuz", "amount": 0.5, "unit": "kg"}]
    # Notlar ve talimatlar
    instructions: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecipeCreate(BaseModel):
    lead_id: str
    name: str
    product_code: str
    meat_amount: float
    water_amount: float
    spice_amount: float
    binding_amount: float
    mixing_time: int
    motor_speed: int
    additional_ingredients: Optional[List[dict]] = []
    instructions: Optional[str] = ""
    notes: Optional[str] = ""

class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    product_code: Optional[str] = None
    meat_amount: Optional[float] = None
    water_amount: Optional[float] = None
    spice_amount: Optional[float] = None
    binding_amount: Optional[float] = None
    mixing_time: Optional[int] = None
    motor_speed: Optional[int] = None
    additional_ingredients: Optional[List[dict]] = None
    instructions: Optional[str] = None
    notes: Optional[str] = None

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

@api_router.get("/leads/{lead_id}/pdf")
async def get_lead_pdf(lead_id: str):
    """Generate PDF for a single lead with their orders and recipes"""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Get lead's orders and recipes
    orders = await db.orders.find({"lead_id": lead_id}, {"_id": 0}).to_list(100)
    recipes = await db.recipes.find({"lead_id": lead_id}, {"_id": 0}).to_list(100)
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    
    pdf_content = generate_lead_pdf(lead, orders, recipes, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=musteri_{lead_id[:8]}.pdf"}
    )

@api_router.get("/leads/{lead_id}/details")
async def get_lead_details(lead_id: str):
    """Get detailed lead info with orders and recipes"""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    deserialize_datetime(lead)
    
    # Get lead's orders
    orders = await db.orders.find({"lead_id": lead_id}, {"_id": 0}).to_list(100)
    for order in orders:
        deserialize_datetime(order)
    
    # Get lead's recipes
    recipes = await db.recipes.find({"lead_id": lead_id}, {"_id": 0}).to_list(100)
    for recipe in recipes:
        deserialize_datetime(recipe)
    
    # Calculate total revenue from this lead
    total_revenue = sum(order.get('total_price', 0) for order in orders if order.get('status') in ['delivered', 'shipped', 'confirmed'])
    
    return {
        **lead,
        "orders": orders,
        "recipes": recipes,
        "total_orders": len(orders),
        "total_recipes": len(recipes),
        "total_revenue": total_revenue
    }

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

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(period: str = "all"):
    """
    Get dashboard statistics
    period: all, month, quarter, half_year, year
    """
    total_leads = await db.leads.count_documents({})
    emails_sent = await db.email_history.count_documents({"status": "sent"})
    emails_failed = await db.email_history.count_documents({"status": "failed"})
    
    recent_leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    for lead in recent_leads:
        deserialize_datetime(lead)
    
    # Date filter for period
    now = datetime.now(timezone.utc)
    date_filter = {}
    if period == "month":
        date_filter = {"created_at": {"$gte": (now - timedelta(days=30)).isoformat()}}
    elif period == "quarter":
        date_filter = {"created_at": {"$gte": (now - timedelta(days=90)).isoformat()}}
    elif period == "half_year":
        date_filter = {"created_at": {"$gte": (now - timedelta(days=180)).isoformat()}}
    elif period == "year":
        date_filter = {"created_at": {"$gte": (now - timedelta(days=365)).isoformat()}}
    
    # Order stats with period filter
    order_filter = {"status": {"$in": ["delivered", "shipped", "confirmed"]}}
    if date_filter:
        order_filter.update(date_filter)
    
    total_orders = await db.orders.count_documents(date_filter if date_filter else {})
    
    # Calculate revenue
    pipeline = [
        {"$match": order_filter},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0.0
    
    # Get company settings for yearly target
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    yearly_target = settings.get("yearly_target", 0) if settings else 0
    
    return {
        "total_leads": total_leads,
        "emails_sent": emails_sent,
        "emails_failed": emails_failed,
        "recent_leads": recent_leads,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "yearly_target": yearly_target,
        "period": period
    }

# ===================== COMPANY SETTINGS ENDPOINTS =====================

class CompanySettingsUpdate(BaseModel):
    company_name: Optional[str] = None
    yearly_target: Optional[float] = None

@api_router.get("/company-settings")
async def get_company_settings():
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    if not settings:
        # Return defaults
        settings = {
            "id": "company_settings",
            "company_name": "Gewürzberg GmbH",
            "yearly_target": 0,
            "current_revenue": 0
        }
    
    # Calculate current revenue from all confirmed/shipped/delivered orders
    pipeline = [
        {"$match": {"status": {"$in": ["delivered", "shipped", "confirmed"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    settings["current_revenue"] = revenue_result[0]["total"] if revenue_result else 0
    
    return settings

@api_router.post("/company-settings")
async def save_company_settings(settings: CompanySettingsUpdate):
    existing = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if existing:
        await db.company_settings.update_one(
            {"id": "company_settings"}, 
            {"$set": update_data}
        )
    else:
        doc = {
            "id": "company_settings",
            "company_name": settings.company_name or "Gewürzberg GmbH",
            "yearly_target": settings.yearly_target or 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.company_settings.insert_one(doc)
    
    return {"status": "success", "message": "Company settings saved"}

# ===================== GEOCODING ENDPOINT =====================

import httpx

@api_router.get("/geocode")
async def geocode_address(city: str, country: str):
    """Geocode a city/country to lat/lng coordinates"""
    try:
        query = f"{city}, {country}"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"format": "json", "q": query, "limit": 1},
                headers={"User-Agent": "GewurzbergCRM/1.0"},
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return {
                        "lat": float(data[0]["lat"]),
                        "lng": float(data[0]["lon"]),
                        "display_name": data[0].get("display_name", query)
                    }
            elif response.status_code == 429:
                logger.warning(f"Nominatim rate limited for: {query}")
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
    return None

# Predefined city coordinates for fast geocoding without API calls
CITY_COORDS = {
    # Germany
    'berlin': (52.5200, 13.4050),
    'munich': (48.1351, 11.5820),
    'hamburg': (53.5511, 9.9937),
    'frankfurt': (50.1109, 8.6821),
    'cologne': (50.9375, 6.9603),
    'düsseldorf': (51.2277, 6.7735),
    'stuttgart': (48.7758, 9.1829),
    # Turkey
    'istanbul': (41.0082, 28.9784),
    'ankara': (39.9334, 32.8597),
    'izmir': (38.4237, 27.1428),
    'bursa': (40.1885, 29.0610),
    'antalya': (36.8969, 30.7133),
    # Greece
    'athens': (37.9838, 23.7275),
    'thessaloniki': (40.6401, 22.9444),
    'piraeus': (37.9425, 23.6469),
    'rethymno': (35.3661, 24.4765),
    'heraklion': (35.3387, 25.1442),
    # Netherlands
    'amsterdam': (52.3676, 4.9041),
    'rotterdam': (51.9244, 4.4777),
    'the hague': (52.0705, 4.3007),
    'oss': (51.7650, 5.5183),
    # Poland
    'warsaw': (52.2297, 21.0122),
    'krakow': (50.0647, 19.9450),
    'gdansk': (54.3520, 18.6466),
    # Austria
    'vienna': (48.2082, 16.3738),
    'salzburg': (47.8095, 13.0550),
    # France
    'paris': (48.8566, 2.3522),
    'lyon': (45.7640, 4.8357),
    'marseille': (43.2965, 5.3698),
    # UK
    'london': (51.5074, -0.1278),
    'manchester': (53.4808, -2.2426),
    # Belgium
    'brussels': (50.8503, 4.3517),
    'antwerp': (51.2213, 4.4051),
    # Switzerland
    'zurich': (47.3769, 8.5417),
    'geneva': (46.2044, 6.1432),
}

def get_predefined_coords(query: str):
    """Check if we have predefined coordinates for a city"""
    query_lower = query.lower().strip()
    for city, coords in CITY_COORDS.items():
        if city in query_lower or query_lower.startswith(city):
            return {"lat": coords[0], "lng": coords[1], "display_name": query}
    return None

@api_router.get("/geocode/search")
async def search_address(q: str):
    """Search for addresses and return autocomplete suggestions"""
    if len(q) < 3:
        return []
    
    # Check predefined coordinates first
    predefined = get_predefined_coords(q)
    if predefined:
        return [{
            "lat": str(predefined["lat"]),
            "lon": str(predefined["lng"]),
            "display_name": f"{q.title()} (cached)",
            "type": "city"
        }]
    
    # Add small delay to avoid rate limiting
    import asyncio
    await asyncio.sleep(0.3)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "format": "json", 
                    "q": q, 
                    "limit": 5,
                    "addressdetails": 1
                },
                headers={
                    "User-Agent": "GewurzbergCRM/1.0 (contact@gewurzberg.de)",
                    "Accept-Language": "en,de,tr"
                },
                timeout=15.0
            )
            if response.status_code == 200:
                results = response.json()
                # Add predefined results for common cities if API returns empty
                if not results:
                    predefined = get_predefined_coords(q)
                    if predefined:
                        return [{
                            "lat": str(predefined["lat"]),
                            "lon": str(predefined["lng"]),
                            "display_name": f"{q.title()}",
                            "type": "city"
                        }]
                return results
            elif response.status_code == 429:
                logger.warning("Nominatim rate limit reached, using fallback")
                # Return predefined if available
                predefined = get_predefined_coords(q)
                if predefined:
                    return [{
                        "lat": str(predefined["lat"]),
                        "lon": str(predefined["lng"]),
                        "display_name": f"{q.title()} (fallback)",
                        "type": "city"
                    }]
                return []
            else:
                logger.error(f"Nominatim error: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"Address search error: {e}")
        # Return predefined if available
        predefined = get_predefined_coords(q)
        if predefined:
            return [{
                "lat": str(predefined["lat"]),
                "lon": str(predefined["lng"]),
                "display_name": f"{q.title()} (fallback)",
                "type": "city"
            }]
        return []

@api_router.get("/geocode/reverse")
async def reverse_geocode(lat: float, lon: float):
    """Reverse geocode coordinates to address"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "format": "json",
                    "lat": lat,
                    "lon": lon,
                    "zoom": 18
                },
                headers={
                    "User-Agent": "GewurzbergCRM/1.0 (contact@gewurzberg.de)",
                    "Accept-Language": "en,de,tr"
                },
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    "display_name": data.get("display_name", f"{lat}, {lon}"),
                    "lat": lat,
                    "lon": lon
                }
            else:
                return {"display_name": f"{lat:.4f}, {lon:.4f}", "lat": lat, "lon": lon}
    except Exception as e:
        logger.error(f"Reverse geocoding error: {e}")
        return {"display_name": f"{lat:.4f}, {lon:.4f}", "lat": lat, "lon": lon}

@api_router.post("/geocode/batch")
async def geocode_batch(leads: List[dict]):
    """Geocode multiple leads at once"""
    results = {}
    async with httpx.AsyncClient() as client:
        for lead in leads:
            if lead.get("city") and lead.get("country"):
                try:
                    query = f"{lead['city']}, {lead['country']}"
                    response = await client.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={"format": "json", "q": query, "limit": 1},
                        headers={"User-Agent": "GewurzbergCRM/1.0"},
                        timeout=10.0
                    )
                    data = response.json()
                    if data and len(data) > 0:
                        # Add small random offset to prevent overlapping
                        import random
                        results[lead["id"]] = {
                            "lat": float(data[0]["lat"]) + (random.random() - 0.5) * 0.01,
                            "lng": float(data[0]["lon"]) + (random.random() - 0.5) * 0.01
                        }
                    # Rate limiting - wait a bit between requests
                    import asyncio
                    await asyncio.sleep(0.5)
                except Exception as e:
                    logger.error(f"Geocoding error for {lead.get('id')}: {e}")
    return results

# ===================== ROUTE PLANNER ENDPOINTS =====================

class RouteRequest(BaseModel):
    start_address: str
    lead_ids: List[str]

@api_router.post("/route/calculate")
async def calculate_route(request: RouteRequest):
    """Calculate optimized route with distance and duration"""
    import math
    
    # Geocode start address
    start_coords = None
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"format": "json", "q": request.start_address, "limit": 1},
                headers={"User-Agent": "GewurzbergCRM/1.0"},
                timeout=10.0
            )
            data = response.json()
            if data and len(data) > 0:
                start_coords = {
                    "lat": float(data[0]["lat"]),
                    "lng": float(data[0]["lon"]),
                    "address": data[0].get("display_name", request.start_address)
                }
        except Exception as e:
            logger.error(f"Geocoding start address error: {e}")
    
    if not start_coords:
        raise HTTPException(status_code=400, detail="Could not geocode start address")
    
    # Get leads and their coordinates
    leads_data = []
    for lead_id in request.lead_ids:
        lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
        if lead and lead.get("city") and lead.get("country"):
            leads_data.append(lead)
    
    # Geocode all leads
    geocoded_leads = []
    async with httpx.AsyncClient() as client:
        for lead in leads_data:
            try:
                query = f"{lead['city']}, {lead['country']}"
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"format": "json", "q": query, "limit": 1},
                    headers={"User-Agent": "GewurzbergCRM/1.0"},
                    timeout=10.0
                )
                data = response.json()
                if data and len(data) > 0:
                    geocoded_leads.append({
                        **lead,
                        "lat": float(data[0]["lat"]),
                        "lng": float(data[0]["lon"])
                    })
                import asyncio
                await asyncio.sleep(0.3)
            except Exception as e:
                logger.error(f"Geocoding error for lead {lead.get('id')}: {e}")
    
    if len(geocoded_leads) < 1:
        raise HTTPException(status_code=400, detail="Could not geocode any leads")
    
    # Calculate optimal route using nearest neighbor
    def haversine_distance(lat1, lon1, lat2, lon2):
        R = 6371  # Earth's radius in km
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c
    
    visited = set()
    route = []
    current = start_coords
    total_distance = 0
    
    while len(visited) < len(geocoded_leads):
        nearest = None
        nearest_dist = float('inf')
        
        for lead in geocoded_leads:
            if lead['id'] in visited:
                continue
            dist = haversine_distance(current['lat'], current['lng'], lead['lat'], lead['lng'])
            if dist < nearest_dist:
                nearest_dist = dist
                nearest = lead
        
        if nearest:
            visited.add(nearest['id'])
            route.append({
                "id": nearest['id'],
                "company_name": nearest.get('company_name', ''),
                "city": nearest.get('city', ''),
                "country": nearest.get('country', ''),
                "lat": nearest['lat'],
                "lng": nearest['lng'],
                "distance": nearest_dist
            })
            total_distance += nearest_dist
            current = {"lat": nearest['lat'], "lng": nearest['lng']}
    
    # Estimate duration (average 60 km/h + 30 min per stop)
    driving_time = (total_distance / 60) * 60  # minutes
    stop_time = len(route) * 30  # 30 minutes per stop
    total_duration = driving_time + stop_time
    
    return {
        "start_point": start_coords,
        "stops": route,
        "total_distance": total_distance,
        "total_duration": total_duration,  # in minutes
        "estimated_hours": total_duration / 60
    }

@api_router.post("/route/pdf")
async def generate_route_pdf_endpoint(request: RouteRequest):
    """Generate PDF for a calculated route"""
    # Calculate route first
    route_data = await calculate_route(request)
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_route_pdf(route_data, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rota_plani.pdf"}
    )

# ===================== EMAIL WITH ATTACHMENT =====================

@api_router.post("/emails/send-with-attachment")
async def send_email_with_attachment(
    lead_id: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    attachment: Optional[UploadFile] = File(None),
    background_tasks: BackgroundTasks = None
):
    """Send email with optional file attachment"""
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")
    
    # Read attachment if provided
    attachment_data = None
    attachment_name = None
    if attachment:
        attachment_data = await attachment.read()
        attachment_name = attachment.filename
    
    history_id = str(uuid.uuid4())
    
    try:
        msg = MIMEMultipart()
        msg['Subject'] = subject
        msg['From'] = f"{settings['from_name']} <{settings['from_email']}>"
        msg['To'] = lead['email']
        
        # Add body
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            {body.replace(chr(10), '<br>')}
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        
        # Add attachment if provided
        if attachment_data and attachment_name:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment_data)
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{attachment_name}"')
            msg.attach(part)
        
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
            "has_attachment": attachment_name is not None,
            "attachment_name": attachment_name,
            "error_message": None,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
        await db.email_history.insert_one(history)
        
        return {"success": True, "message": "Email sent successfully"}
        
    except Exception as e:
        # Save failed attempt
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
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ===================== SPECIFICATIONS ENDPOINTS =====================

class SpecificationIngredient(BaseModel):
    name: str
    percentage: Optional[str] = None
    description: Optional[str] = None

class SpecificationCreate(BaseModel):
    name: str
    product_code: str
    category: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[List[SpecificationIngredient]] = []
    nutritional_info: Optional[str] = None
    allergens: Optional[str] = None
    storage_instructions: Optional[str] = None
    shelf_life: Optional[str] = None
    certifications: Optional[str] = None

class Specification(SpecificationCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/specifications")
async def create_specification(spec_data: SpecificationCreate):
    spec = Specification(**spec_data.model_dump())
    doc = spec.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    # Convert ingredients to dicts
    if doc.get('ingredients'):
        doc['ingredients'] = [ing if isinstance(ing, dict) else ing.model_dump() for ing in doc['ingredients']]
    await db.specifications.insert_one(doc)
    return {"id": spec.id, "message": "Specification created successfully"}

@api_router.get("/specifications")
async def get_specifications():
    specs = await db.specifications.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    for s in specs:
        deserialize_datetime(s)
    return specs

@api_router.get("/specifications/{spec_id}")
async def get_specification(spec_id: str):
    spec = await db.specifications.find_one({"id": spec_id}, {"_id": 0})
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    deserialize_datetime(spec)
    return spec

@api_router.put("/specifications/{spec_id}")
async def update_specification(spec_id: str, spec_data: SpecificationCreate):
    existing = await db.specifications.find_one({"id": spec_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    update_data = spec_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    # Convert ingredients to dicts
    if update_data.get('ingredients'):
        update_data['ingredients'] = [ing if isinstance(ing, dict) else ing for ing in update_data['ingredients']]
    
    await db.specifications.update_one({"id": spec_id}, {"$set": update_data})
    return {"message": "Specification updated successfully"}

@api_router.delete("/specifications/{spec_id}")
async def delete_specification(spec_id: str):
    result = await db.specifications.delete_one({"id": spec_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Specification not found")
    return {"message": "Specification deleted successfully"}

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF using pdfplumber"""
    import pdfplumber
    text_parts = []
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as e:
        logger.error(f"PDF text extraction error: {e}")
        # Fallback to PyMuPDF
        try:
            import fitz
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc:
                text_parts.append(page.get_text())
            doc.close()
        except Exception as e2:
            logger.error(f"PyMuPDF fallback error: {e2}")
    
    return "\n\n---PAGE BREAK---\n\n".join(text_parts)

@api_router.post("/specifications/upload-pdf")
async def upload_specification_pdf(file: UploadFile = File(...)):
    """Upload a PDF specification document and extract text for editing"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    content = await file.read()
    spec_id = str(uuid.uuid4())
    
    # Extract text from PDF for editing
    extracted_text = extract_text_from_pdf(content)
    
    # Store specification with PDF data and extracted text
    doc = {
        "id": spec_id,
        "filename": file.filename,
        "name": file.filename.replace('.pdf', '').replace('_', ' ').replace('-', ' '),
        "description": "",
        "notes": "",
        "content_type": "application/pdf",
        "size": len(content),
        "pdf_data": base64.b64encode(content).decode('utf-8'),
        "extracted_text": extracted_text,
        "edited_text": extracted_text,  # Initially same as extracted
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.specifications.insert_one(doc)
    
    return {
        **{k: v for k, v in doc.items() if k not in ['_id', 'pdf_data']},
        "has_text": bool(extracted_text)
    }

@api_router.get("/specifications/{spec_id}/text")
async def get_specification_text(spec_id: str):
    """Get extracted/edited text from a specification"""
    spec = await db.specifications.find_one({"id": spec_id}, {"_id": 0, "pdf_data": 0})
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    return {
        "id": spec_id,
        "name": spec.get("name", ""),
        "filename": spec.get("filename", ""),
        "extracted_text": spec.get("extracted_text", ""),
        "edited_text": spec.get("edited_text", spec.get("extracted_text", "")),
        "has_original_pdf": bool(spec.get("pdf_data"))
    }

@api_router.put("/specifications/{spec_id}/text")
async def update_specification_text(spec_id: str, edited_text: str = Form(...)):
    """Update the edited text of a specification"""
    spec = await db.specifications.find_one({"id": spec_id}, {"_id": 0})
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    await db.specifications.update_one(
        {"id": spec_id},
        {"$set": {
            "edited_text": edited_text,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Text updated successfully", "id": spec_id}

@api_router.get("/specifications/{spec_id}/regenerate-pdf")
async def regenerate_specification_pdf(spec_id: str):
    """Generate a new PDF from the edited text"""
    spec = await db.specifications.find_one({"id": spec_id}, {"_id": 0})
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    edited_text = spec.get("edited_text", spec.get("extracted_text", ""))
    
    # Generate PDF from edited text using ReportLab
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Register DejaVu font for UTF-8 support
    try:
        pdfmetrics.registerFont(TTFont('DejaVu', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
        pdfmetrics.registerFont(TTFont('DejaVu-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
        font_name = 'DejaVu'
        font_bold = 'DejaVu-Bold'
    except:
        font_name = 'Helvetica'
        font_bold = 'Helvetica-Bold'
    
    y = height - 2*cm
    
    # Title
    c.setFont(font_bold, 14)
    c.drawString(2*cm, y, spec.get("name", "Specification"))
    y -= 1*cm
    
    # Content
    c.setFont(font_name, 10)
    lines = edited_text.split('\n')
    
    for line in lines:
        if line.strip() == "---PAGE BREAK---":
            c.showPage()
            y = height - 2*cm
            c.setFont(font_name, 10)
            continue
        
        # Word wrap long lines
        while len(line) > 90:
            c.drawString(2*cm, y, line[:90])
            line = line[90:]
            y -= 0.5*cm
            if y < 2*cm:
                c.showPage()
                y = height - 2*cm
                c.setFont(font_name, 10)
        
        c.drawString(2*cm, y, line)
        y -= 0.5*cm
        
        if y < 2*cm:
            c.showPage()
            y = height - 2*cm
            c.setFont(font_name, 10)
    
    # Footer
    c.setFont(font_name, 8)
    c.drawString(2*cm, 1*cm, f"Generated: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    
    c.save()
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={spec.get('name', 'specification')}_edited.pdf"
        }
    )

@api_router.get("/specifications/{spec_id}/download")
async def download_specification_pdf(spec_id: str):
    """Download uploaded PDF specification"""
    spec = await db.specifications.find_one({"id": spec_id}, {"_id": 0})
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    if spec.get('pdf_data'):
        # Return uploaded PDF with inline display for preview
        content = base64.b64decode(spec['pdf_data'])
        return Response(
            content=content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={spec.get('filename', 'specification.pdf')}",
                "Access-Control-Allow-Origin": "*"
            }
        )
    else:
        # Generate PDF if no upload
        settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
        pdf_content = generate_specification_pdf(spec, settings)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=specification_{spec_id[:8]}.pdf",
                "Access-Control-Allow-Origin": "*"
            }
        )

@api_router.post("/specifications/upload")
async def upload_specification_file(file: UploadFile = File(...)):
    """Upload a PDF file for specification attachment"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Read file content
    content = await file.read()
    file_id = str(uuid.uuid4())
    
    # Store in database as base64
    doc = {
        "id": file_id,
        "filename": file.filename,
        "content_type": "application/pdf",
        "size": len(content),
        "data": base64.b64encode(content).decode('utf-8'),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.specification_files.insert_one(doc)
    
    return {
        "id": file_id,
        "filename": file.filename,
        "url": f"{BACKEND_URL}/api/specifications/files/{file_id}"
    }

# Add BACKEND_URL constant near the top imports
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', '')

@api_router.get("/specifications/files/{file_id}")
async def get_specification_file(file_id: str):
    """Download a specification attachment"""
    doc = await db.specification_files.find_one({"id": file_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    content = base64.b64decode(doc['data'])
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={doc['filename']}"}
    )

@api_router.get("/specifications/{spec_id}/pdf")
async def get_specification_pdf(spec_id: str):
    spec = await db.specifications.find_one({"id": spec_id}, {"_id": 0})
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_specification_pdf(spec, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=specification_{spec_id[:8]}.pdf"}
    )

class SpecEmailRequest(BaseModel):
    lead_id: str
    subject: str
    body: str

@api_router.post("/specifications/{spec_id}/email")
async def email_specification(spec_id: str, request: SpecEmailRequest):
    spec = await db.specifications.find_one({"id": spec_id}, {"_id": 0})
    if not spec:
        raise HTTPException(status_code=404, detail="Specification not found")
    
    lead = await db.leads.find_one({"id": request.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    smtp_settings = await db.smtp_settings.find_one({}, {"_id": 0})
    if not smtp_settings:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_specification_pdf(spec, settings)
    
    try:
        msg = MIMEMultipart()
        msg['Subject'] = request.subject
        msg['From'] = f"{smtp_settings['from_name']} <{smtp_settings['from_email']}>"
        msg['To'] = lead['email']
        
        msg.attach(MIMEText(request.body, 'plain'))
        
        # Attach PDF
        pdf_attachment = MIMEBase('application', 'pdf')
        pdf_attachment.set_payload(pdf_content)
        encoders.encode_base64(pdf_attachment)
        pdf_attachment.add_header('Content-Disposition', f'attachment; filename="specification_{spec["product_code"]}.pdf"')
        msg.attach(pdf_attachment)
        
        if smtp_settings.get('use_tls', True):
            server = smtplib.SMTP(smtp_settings['host'], smtp_settings['port'])
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(smtp_settings['host'], smtp_settings['port'])
        
        server.login(smtp_settings['username'], smtp_settings['password'])
        server.sendmail(smtp_settings['from_email'], lead['email'], msg.as_string())
        server.quit()
        
        return {"success": True, "message": "Email sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ===================== PRODUCT ENDPOINTS =====================

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate):
    # Check if product code exists
    existing = await db.products.find_one({"code": product_data.code}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Product code already exists")
    
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    for p in products:
        deserialize_datetime(p, ['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    deserialize_datetime(product, ['created_at'])
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    deserialize_datetime(updated, ['created_at'])
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ===================== COMPANY SETTINGS ENDPOINTS =====================

@api_router.get("/settings/company")
async def get_company_settings():
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    if not settings:
        # Return default settings
        return CompanySettings().model_dump()
    deserialize_datetime(settings, ['updated_at'])
    return settings

@api_router.post("/settings/company")
async def save_company_settings(
    company_name: str = "SpiceCRM",
    logo_url: Optional[str] = None,
    address: Optional[str] = "",
    phone: Optional[str] = "",
    email: Optional[str] = "",
    website: Optional[str] = "",
    tax_number: Optional[str] = "",
    yearly_target: float = 0.0,
    currency: str = "EUR"
):
    settings = CompanySettings(
        company_name=company_name,
        logo_url=logo_url,
        address=address,
        phone=phone,
        email=email,
        website=website,
        tax_number=tax_number,
        yearly_target=yearly_target,
        currency=currency
    )
    doc = settings.model_dump()
    doc['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.company_settings.replace_one(
        {"id": "company_settings"},
        doc,
        upsert=True
    )
    return settings

# ===================== PDF GENERATION ENDPOINTS =====================

def generate_pdf_content(title: str, data: dict, company_settings: dict = None) -> bytes:
    """Generate a simple PDF using reportlab"""
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Company header
    y = height - 2*cm
    if company_settings:
        c.setFont("Helvetica-Bold", 16)
        c.drawString(2*cm, y, company_settings.get('company_name', 'SpiceCRM'))
        y -= 0.7*cm
        c.setFont("Helvetica", 10)
        if company_settings.get('address'):
            c.drawString(2*cm, y, company_settings['address'])
            y -= 0.5*cm
        if company_settings.get('phone'):
            c.drawString(2*cm, y, f"Tel: {company_settings['phone']}")
            y -= 0.5*cm
        if company_settings.get('email'):
            c.drawString(2*cm, y, f"Email: {company_settings['email']}")
            y -= 0.5*cm
    
    # Title
    y -= 1*cm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(2*cm, y, title)
    y -= 1*cm
    
    # Content
    c.setFont("Helvetica", 10)
    for key, value in data.items():
        if y < 3*cm:
            c.showPage()
            y = height - 2*cm
            c.setFont("Helvetica", 10)
        
        c.drawString(2*cm, y, f"{key}: {value}")
        y -= 0.5*cm
    
    # Footer
    c.setFont("Helvetica", 8)
    c.drawString(2*cm, 1*cm, f"Oluşturulma Tarihi: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

@api_router.get("/orders/{order_id}/pdf")
async def get_order_pdf(order_id: str, lang: str = 'tr'):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_order_pdf(order, settings, lang=lang)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=siparis_{order_id[:8]}.pdf"}
    )

@api_router.get("/leads/export/pdf")
async def export_leads_pdf():
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    y = height - 2*cm
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2*cm, y, "Müşteri Listesi")
    y -= 1*cm
    c.setFont("Helvetica", 8)
    c.drawString(2*cm, y, f"Toplam: {len(leads)} müşteri | Tarih: {datetime.now().strftime('%d.%m.%Y')}")
    y -= 1*cm
    
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2*cm, y, "Firma")
    c.drawString(7*cm, y, "Kişi")
    c.drawString(11*cm, y, "Şehir")
    c.drawString(14*cm, y, "Ülke")
    y -= 0.5*cm
    
    c.setFont("Helvetica", 9)
    for lead in leads:
        if y < 2*cm:
            c.showPage()
            y = height - 2*cm
            c.setFont("Helvetica", 9)
        
        c.drawString(2*cm, y, (lead.get('company_name', '')[:25]))
        c.drawString(7*cm, y, f"{lead.get('first_name', '')} {lead.get('last_name', '')}"[:20])
        c.drawString(11*cm, y, (lead.get('city', '') or '')[:15])
        c.drawString(14*cm, y, (lead.get('country', '') or '')[:15])
        y -= 0.4*cm
    
    c.save()
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=musteriler.pdf"}
    )

@api_router.get("/recipes/{recipe_id}/pdf")
async def get_recipe_pdf(recipe_id: str):
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_recipe_pdf(recipe, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=recete_{recipe_id[:8]}.pdf"}
    )

@api_router.post("/recipes/{recipe_id}/email")
async def email_recipe(recipe_id: str, to_email: str, background_tasks: BackgroundTasks):
    """Send recipe as PDF via email"""
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    smtp_settings = await db.smtp_settings.find_one({}, {"_id": 0})
    
    if not smtp_settings:
        raise HTTPException(status_code=400, detail="SMTP settings not configured")
    
    # Generate PDF using new function
    pdf_content = generate_recipe_pdf(recipe, settings)
    
    # Send email with attachment
    async def send_recipe_email():
        try:
            msg = MIMEMultipart()
            msg['Subject'] = f"Reçete: {recipe['name']}"
            msg['From'] = f"{smtp_settings['from_name']} <{smtp_settings['from_email']}>"
            msg['To'] = to_email
            
            body = f"Merhaba,\n\n{recipe['name']} reçetesi ekte yer almaktadır.\n\nSaygılarımızla"
            msg.attach(MIMEText(body, 'plain'))
            
            attachment = MIMEApplication(pdf_content, _subtype='pdf')
            attachment.add_header('Content-Disposition', 'attachment', filename=f"recete_{recipe['name']}.pdf")
            msg.attach(attachment)
            
            if smtp_settings.get('use_tls', True):
                server = smtplib.SMTP(smtp_settings['host'], smtp_settings['port'])
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(smtp_settings['host'], smtp_settings['port'])
            
            server.login(smtp_settings['username'], smtp_settings['password'])
            server.sendmail(smtp_settings['from_email'], to_email, msg.as_string())
            server.quit()
            logger.info(f"Recipe email sent to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send recipe email: {str(e)}")
    
    background_tasks.add_task(send_recipe_email)
    return {"message": "Recipe email queued for sending"}

# ===================== ORDER ENDPOINTS =====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Get lead info
    lead = await db.leads.find_one({"id": order_data.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Handle multi-product orders
    products_list = []
    total_price = 0.0
    
    if order_data.products and len(order_data.products) > 0:
        # Multi-product order
        for item in order_data.products:
            subtotal = item.pieces * item.amount * item.unit_price
            products_list.append(OrderProductItem(
                product_name=item.product_name,
                product_code=item.product_code,
                pieces=item.pieces,
                amount=item.amount,
                unit=item.unit,
                unit_price=item.unit_price,
                subtotal=subtotal
            ))
            total_price += subtotal
        
        # For display, use first product info
        first_product = order_data.products[0]
        product_name = first_product.product_name
        product_code = first_product.product_code
        pieces = first_product.pieces
        amount = first_product.amount
        unit = first_product.unit
        unit_price = first_product.unit_price
    else:
        # Legacy single-product order
        pieces = order_data.pieces or 1
        amount = order_data.amount or 1
        unit_price = order_data.unit_price or 0
        total_price = pieces * amount * unit_price
        
        product_name = order_data.product_name
        product_code = order_data.product_code
        unit = order_data.unit
        
        # Create single product entry for consistency
        products_list.append(OrderProductItem(
            product_name=product_name,
            product_code=product_code,
            pieces=pieces,
            amount=amount,
            unit=unit,
            unit_price=unit_price,
            subtotal=total_price
        ))
    
    order = Order(
        lead_id=order_data.lead_id,
        lead_name=f"{lead['first_name']} {lead['last_name']}",
        company_name=lead['company_name'],
        products=products_list,
        product_name=product_name,
        product_code=product_code,
        pieces=pieces,
        amount=amount,
        unit=unit,
        unit_price=unit_price,
        total_price=total_price,
        notes=order_data.notes
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    # Serialize products
    doc['products'] = [p.model_dump() if hasattr(p, 'model_dump') else p for p in doc['products']]
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
    
    # Handle multi-product updates
    if 'products' in update_data and update_data['products']:
        products = update_data['products']
        total_price = 0.0
        serialized_products = []
        for p in products:
            if hasattr(p, 'model_dump'):
                p_dict = p.model_dump()
            else:
                p_dict = p
            subtotal = p_dict.get('pieces', 1) * p_dict.get('amount', 1) * p_dict.get('unit_price', 0)
            p_dict['subtotal'] = subtotal
            serialized_products.append(p_dict)
            total_price += subtotal
        update_data['products'] = serialized_products
        update_data['total_price'] = total_price
        # Update legacy fields with first product
        if serialized_products:
            first = serialized_products[0]
            update_data['product_name'] = first.get('product_name')
            update_data['product_code'] = first.get('product_code')
            update_data['pieces'] = first.get('pieces')
            update_data['amount'] = first.get('amount')
            update_data['unit'] = first.get('unit')
            update_data['unit_price'] = first.get('unit_price')
    else:
        # Legacy single-product update - recalculate total
        pieces = update_data.get('pieces', existing.get('pieces', 1))
        amount = update_data.get('amount', existing.get('amount', existing.get('quantity', 1)))
        unit_price = update_data.get('unit_price', existing.get('unit_price', 0))
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

# ===================== RECIPE ENDPOINTS =====================

@api_router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe_data: RecipeCreate):
    # Get lead info
    lead = await db.leads.find_one({"id": recipe_data.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    recipe = Recipe(
        lead_id=recipe_data.lead_id,
        lead_name=f"{lead.get('first_name', '')} {lead.get('last_name', '')}",
        company_name=lead.get('company_name', ''),
        name=recipe_data.name,
        product_code=recipe_data.product_code,
        meat_amount=recipe_data.meat_amount,
        water_amount=recipe_data.water_amount,
        spice_amount=recipe_data.spice_amount,
        binding_amount=recipe_data.binding_amount,
        mixing_time=recipe_data.mixing_time,
        motor_speed=recipe_data.motor_speed,
        additional_ingredients=recipe_data.additional_ingredients or [],
        instructions=recipe_data.instructions,
        notes=recipe_data.notes
    )
    
    doc = recipe.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.recipes.insert_one(doc)
    return recipe

@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes():
    recipes = await db.recipes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for recipe in recipes:
        deserialize_datetime(recipe)
    return recipes

@api_router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    deserialize_datetime(recipe)
    return recipe

@api_router.get("/recipes/lead/{lead_id}", response_model=List[Recipe])
async def get_lead_recipes(lead_id: str):
    recipes = await db.recipes.find({"lead_id": lead_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for recipe in recipes:
        deserialize_datetime(recipe)
    return recipes

@api_router.put("/recipes/{recipe_id}", response_model=Recipe)
async def update_recipe(recipe_id: str, recipe_data: RecipeUpdate):
    existing = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    update_data = {k: v for k, v in recipe_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.recipes.update_one({"id": recipe_id}, {"$set": update_data})
    updated = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    deserialize_datetime(updated)
    return updated

@api_router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str):
    result = await db.recipes.delete_one({"id": recipe_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted successfully"}

@api_router.post("/recipes/{recipe_id}/duplicate")
async def duplicate_recipe(recipe_id: str, new_lead_id: str):
    """Bir reçeteyi başka bir müşteriye kopyala"""
    original = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Get new lead info
    new_lead = await db.leads.find_one({"id": new_lead_id}, {"_id": 0})
    if not new_lead:
        raise HTTPException(status_code=404, detail="Target lead not found")
    
    # Create new recipe
    new_recipe = {
        **original,
        "id": str(uuid.uuid4()),
        "lead_id": new_lead_id,
        "lead_name": f"{new_lead.get('first_name', '')} {new_lead.get('last_name', '')}",
        "company_name": new_lead.get('company_name', ''),
        "name": f"{original['name']} (Kopya)",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.recipes.insert_one(new_recipe)
    return {"message": "Recipe duplicated successfully", "new_recipe_id": new_recipe["id"]}

# ===================== LEAD FINDER ENDPOINTS =====================

@api_router.post("/leads/search")
async def search_for_leads(request: SearchLeadsRequest):
    """Search for potential leads using Gemini AI-powered search"""
    from lead_finder import LeadFinder
    
    finder = LeadFinder()
    
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
                "contact_person": lead.contact_person,
                "email": lead.email,
                "phone": lead.phone,
                "address": lead.address,
                "city": lead.city,
                "country": lead.country,
                "website": lead.website,
                "business_type": lead.business_type,
                "notes": lead.notes
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
    return [
        {"name": "Döner Fabrikaları", "keywords": ["döner", "kebab", "meat processing"], "category": "meat"},
        {"name": "Gyros Üreticileri", "keywords": ["gyros", "souvlaki", "greek food"], "category": "meat"},
        {"name": "Et İşleme", "keywords": ["meat processing", "food manufacturer"], "category": "meat"},
        {"name": "Baharat Tedarikçileri", "keywords": ["spice", "seasoning", "wholesale"], "category": "spice"}
    ]

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

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    admin_password = os.environ.get('ADMIN_PASSWORD', '190371')
    
    if request.username != admin_username or request.password != admin_password:
        raise HTTPException(status_code=401, detail="Geçersiz kullanıcı adı veya şifre")
    
    user_id = "admin-user-id"
    access_token = create_access_token(user_id, admin_username)
    
    # Set cookie
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        secure=False, 
        samesite="lax", 
        max_age=86400,
        path="/"
    )
    
    return {
        "id": user_id,
        "username": admin_username,
        "name": "Emre Dirlik",
        "role": "admin",
        "token": access_token
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    try:
        user = await get_current_user(request)
        return user
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")

@api_router.get("/auth/check")
async def check_auth(request: Request):
    """Check if user is authenticated"""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return {"authenticated": False}
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"authenticated": True, "user": {"username": payload.get("username"), "name": "Emre Dirlik"}}
    except:
        return {"authenticated": False}

# ===================== WHATSAPP ENDPOINTS =====================

@api_router.get("/orders/{order_id}/whatsapp")
async def get_order_whatsapp_link(order_id: str):
    """Generate WhatsApp share link for an order with PDF link"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get company settings
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    company_name = settings.get('company_name', 'Gewürzberg GmbH') if settings else 'Gewürzberg GmbH'
    
    # Get backend URL for PDF link
    backend_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://customer-agent-2.preview.emergentagent.com')
    pdf_url = f"{backend_url}/api/orders/{order_id}/pdf/public"
    
    # Format order details for WhatsApp with PDF link
    pieces = order.get('pieces', 1)
    amount = order.get('amount', order.get('quantity', 1))
    unit = order.get('unit', 'kg')
    
    message = f"""🧾 *SİPARİŞ - {company_name}*

📦 *Ürün:* {order['product_name']}
🏷️ *Kod:* {order['product_code']}
🏢 *Müşteri:* {order['company_name']}

📊 *Miktar:* {pieces} × {amount} {unit}
💰 *Fiyat:* €{order['unit_price']:.2f}/{unit}

📄 *PDF Sipariş Formu:*
{pdf_url}

---
_{company_name}_"""
    
    # URL encode the message
    encoded_message = quote(message)
    whatsapp_url = f"https://wa.me/?text={encoded_message}"
    
    return {"whatsapp_url": whatsapp_url, "message": message, "pdf_url": pdf_url}

@api_router.get("/orders/{order_id}/pdf/public")
async def get_public_order_pdf(order_id: str):
    """Public endpoint for order PDF (for WhatsApp sharing)"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_order_pdf(order, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=siparis_{order_id[:8]}.pdf"}
    )

# ===================== PROFESSIONAL PDF GENERATION =====================

def generate_professional_order_pdf(order: dict, company_settings: dict = None) -> bytes:
    """Generate a professionally styled order PDF"""
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm, mm
    from reportlab.lib.colors import HexColor, white, black
    from reportlab.lib import colors
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Colors matching the app design
    primary_color = HexColor('#1e293b')  # slate-800
    accent_color = HexColor('#f97316')   # orange-500
    bg_light = HexColor('#f8fafc')       # slate-50
    text_muted = HexColor('#64748b')     # slate-500
    success_color = HexColor('#22c55e')  # green-500
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Header background
    c.setFillColor(primary_color)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    # Company name
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(2*cm, height - 2.5*cm, company_name)
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, height - 3.2*cm, "Emre Dirlik")
    
    # Document title
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(width - 2*cm, height - 2.5*cm, "SİPARİŞ FORMU")
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 2*cm, height - 3.2*cm, f"#{order['id'][:8].upper()}")
    
    y = height - 5.5*cm
    
    # Customer info card
    c.setFillColor(bg_light)
    c.roundRect(1.5*cm, y - 3*cm, width - 3*cm, 3*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(text_muted)
    c.setFont("Helvetica", 9)
    c.drawString(2*cm, y - 0.7*cm, "MÜŞTERİ")
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(2*cm, y - 1.4*cm, order['company_name'])
    c.setFont("Helvetica", 10)
    c.setFillColor(text_muted)
    c.drawString(2*cm, y - 2.1*cm, order.get('lead_name', ''))
    
    c.setFillColor(text_muted)
    c.setFont("Helvetica", 9)
    c.drawString(10*cm, y - 0.7*cm, "TARİH")
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(10*cm, y - 1.4*cm, datetime.now().strftime('%d.%m.%Y'))
    
    y -= 4*cm
    
    # Product details header
    c.setFillColor(accent_color)
    c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, y - 0.7*cm, "ÜRÜN DETAYLARI")
    
    y -= 1.5*cm
    
    # Product info
    pieces = order.get('pieces', 1)
    amount = order.get('amount', order.get('quantity', 1))
    unit = order.get('unit', 'kg')
    
    items = [
        ("Ürün Adı", order['product_name']),
        ("Ürün Kodu", order['product_code']),
        ("Miktar", f"{pieces} × {amount} {unit}"),
        ("Birim Fiyat", f"€{order['unit_price']:.2f}/{unit}"),
    ]
    
    for label, value in items:
        c.setFillColor(text_muted)
        c.setFont("Helvetica", 9)
        c.drawString(2*cm, y, label)
        c.setFillColor(black)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(6*cm, y, str(value))
        y -= 0.8*cm
    
    y -= 0.5*cm
    
    # Total box
    c.setFillColor(success_color)
    c.roundRect(1.5*cm, y - 2*cm, width - 3*cm, 2*cm, 5, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont("Helvetica", 12)
    c.drawString(2*cm, y - 0.8*cm, "TOPLAM TUTAR")
    c.setFont("Helvetica-Bold", 24)
    c.drawRightString(width - 2*cm, y - 1.4*cm, f"€{order['total_price']:.2f}")
    
    y -= 3*cm
    
    # Status badge
    status_colors = {
        'pending': HexColor('#eab308'),
        'confirmed': HexColor('#3b82f6'),
        'shipped': HexColor('#8b5cf6'),
        'delivered': HexColor('#22c55e'),
        'cancelled': HexColor('#ef4444')
    }
    status_labels = {
        'pending': 'BEKLEMEDE',
        'confirmed': 'ONAYLANDI',
        'shipped': 'GÖNDERİLDİ',
        'delivered': 'TESLİM EDİLDİ',
        'cancelled': 'İPTAL'
    }
    
    status = order.get('status', 'pending')
    c.setFillColor(status_colors.get(status, text_muted))
    c.roundRect(2*cm, y - 1*cm, 4*cm, 1*cm, 3, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(4*cm, y - 0.7*cm, status_labels.get(status, status.upper()))
    
    # Notes
    if order.get('notes'):
        y -= 2*cm
        c.setFillColor(text_muted)
        c.setFont("Helvetica", 9)
        c.drawString(2*cm, y, "NOTLAR")
        c.setFillColor(black)
        c.setFont("Helvetica", 10)
        c.drawString(2*cm, y - 0.6*cm, order['notes'][:100])
    
    # Footer
    c.setFillColor(text_muted)
    c.setFont("Helvetica", 8)
    c.drawString(2*cm, 1.5*cm, f"Oluşturulma: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

def generate_professional_recipe_pdf(recipe: dict, company_settings: dict = None) -> bytes:
    """Generate a professionally styled recipe PDF matching the UI design"""
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    from reportlab.lib.colors import HexColor, white, black
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Colors
    primary_color = HexColor('#1e293b')
    accent_color = HexColor('#f97316')
    red_color = HexColor('#ef4444')
    blue_color = HexColor('#3b82f6')
    orange_color = HexColor('#f97316')
    purple_color = HexColor('#8b5cf6')
    green_color = HexColor('#22c55e')
    gray_color = HexColor('#6b7280')
    bg_light = HexColor('#f8fafc')
    text_muted = HexColor('#64748b')
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Header
    c.setFillColor(primary_color)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(2*cm, height - 2.5*cm, company_name)
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, height - 3.2*cm, "Üretim Reçetesi")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(width - 2*cm, height - 2.5*cm, recipe['product_code'])
    
    y = height - 5.5*cm
    
    # Recipe title card
    c.setFillColor(bg_light)
    c.roundRect(1.5*cm, y - 2.5*cm, width - 3*cm, 2.5*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(2*cm, y - 1*cm, recipe['name'])
    c.setFillColor(text_muted)
    c.setFont("Helvetica", 11)
    c.drawString(2*cm, y - 1.8*cm, f"Müşteri: {recipe['company_name']}")
    
    y -= 4*cm
    
    # Main ingredients header
    c.setFillColor(accent_color)
    c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, y - 0.7*cm, "ANA MALZEMELER")
    
    y -= 1.8*cm
    
    # Ingredient boxes (2x2 grid like in UI)
    box_width = (width - 4*cm) / 2
    box_height = 1.8*cm
    
    ingredients = [
        (red_color, "Et Miktarı", f"{recipe['meat_amount']} kg"),
        (blue_color, "Su Miktarı", f"{recipe['water_amount']} L"),
        (orange_color, "Baharat Miktarı", f"{recipe['spice_amount']} kg"),
        (purple_color, "Binding Miktarı", f"{recipe['binding_amount']} kg"),
    ]
    
    for i, (color, label, value) in enumerate(ingredients):
        col = i % 2
        row = i // 2
        x = 1.5*cm + col * (box_width + 0.5*cm)
        box_y = y - row * (box_height + 0.3*cm)
        
        # Light colored background
        c.setFillColor(HexColor('#fef2f2') if i == 0 else HexColor('#eff6ff') if i == 1 else HexColor('#fff7ed') if i == 2 else HexColor('#faf5ff'))
        c.roundRect(x, box_y - box_height, box_width - 0.3*cm, box_height, 5, fill=True, stroke=False)
        
        c.setFillColor(color)
        c.setFont("Helvetica", 9)
        c.drawString(x + 0.4*cm, box_y - 0.6*cm, label)
        c.setFillColor(black)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 0.4*cm, box_y - 1.3*cm, value)
    
    y -= 4.5*cm
    
    # Production parameters header
    c.setFillColor(green_color)
    c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, y - 0.7*cm, "ÜRETİM PARAMETRELERİ")
    
    y -= 1.8*cm
    
    params = [
        (green_color, "Karışım Süresi", f"{recipe['mixing_time']} dakika"),
        (gray_color, "Motor Hızı", f"{recipe['motor_speed']} rpm"),
    ]
    
    for i, (color, label, value) in enumerate(params):
        x = 1.5*cm + i * (box_width + 0.5*cm)
        
        c.setFillColor(HexColor('#f0fdf4') if i == 0 else HexColor('#f3f4f6'))
        c.roundRect(x, y - box_height, box_width - 0.3*cm, box_height, 5, fill=True, stroke=False)
        
        c.setFillColor(color)
        c.setFont("Helvetica", 9)
        c.drawString(x + 0.4*cm, y - 0.6*cm, label)
        c.setFillColor(black)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(x + 0.4*cm, y - 1.3*cm, value)
    
    y -= 3*cm
    
    # Additional ingredients
    if recipe.get('additional_ingredients'):
        c.setFillColor(text_muted)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(2*cm, y, "EK MALZEMELER")
        y -= 0.6*cm
        
        c.setFont("Helvetica", 10)
        for ing in recipe['additional_ingredients']:
            c.setFillColor(black)
            c.drawString(2*cm, y, f"• {ing['name']}: {ing['amount']} {ing['unit']}")
            y -= 0.5*cm
    
    y -= 0.5*cm
    
    # Instructions
    if recipe.get('instructions'):
        c.setFillColor(text_muted)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(2*cm, y, "ÜRETİM TALİMATLARI")
        y -= 0.6*cm
        
        c.setFillColor(bg_light)
        c.roundRect(1.5*cm, y - 2*cm, width - 3*cm, 2*cm, 5, fill=True, stroke=False)
        c.setFillColor(black)
        c.setFont("Helvetica", 9)
        # Word wrap instructions
        instructions = recipe['instructions'][:200]
        c.drawString(2*cm, y - 0.5*cm, instructions[:80])
        if len(instructions) > 80:
            c.drawString(2*cm, y - 1*cm, instructions[80:160])
    
    # Footer
    c.setFillColor(text_muted)
    c.setFont("Helvetica", 8)
    c.drawString(2*cm, 1.5*cm, f"Oluşturulma: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()

# Update PDF endpoints to use professional versions
@api_router.get("/orders/{order_id}/pdf/professional")
async def get_order_pdf_professional(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_professional_order_pdf(order, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=siparis_{order_id[:8]}.pdf"}
    )

@api_router.get("/recipes/{recipe_id}/pdf/professional")
async def get_recipe_pdf_professional(recipe_id: str):
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_professional_recipe_pdf(recipe, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=recete_{recipe_id[:8]}.pdf"}
    )

# ===================== AGENDA ENDPOINTS =====================

class AgendaTask(BaseModel):
    title: str
    due_date: Optional[str] = None
    completed: bool = False
    # Visit Planning fields
    event_type: Optional[str] = "task"  # task, visit, meeting, call, delivery
    lead_id: Optional[str] = None
    lead_name: Optional[str] = None
    company_name: Optional[str] = None
    time: Optional[str] = None  # HH:MM format
    notes: Optional[str] = None

class AgendaTaskUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None
    event_type: Optional[str] = None
    lead_id: Optional[str] = None
    lead_name: Optional[str] = None
    company_name: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None

@api_router.get("/agenda")
async def get_agenda():
    """Get all agenda tasks"""
    tasks = await db.agenda.find({}, {"_id": 0}).sort("due_date", 1).to_list(500)
    return tasks

@api_router.post("/agenda")
async def create_agenda_task(task: AgendaTask):
    """Create a new agenda task or visit"""
    # If lead_id provided, fetch lead details
    lead_name = task.lead_name
    company_name = task.company_name
    
    if task.lead_id and not task.lead_name:
        lead = await db.leads.find_one({"id": task.lead_id}, {"_id": 0})
        if lead:
            lead_name = f"{lead.get('first_name', '')} {lead.get('last_name', '')}"
            company_name = lead.get('company_name', '')
    
    doc = {
        "id": str(uuid.uuid4()),
        "title": task.title,
        "due_date": task.due_date,
        "completed": task.completed,
        "event_type": task.event_type or "task",
        "lead_id": task.lead_id,
        "lead_name": lead_name,
        "company_name": company_name,
        "time": task.time,
        "notes": task.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.agenda.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.put("/agenda/{task_id}")
async def update_agenda_task(task_id: str, task: AgendaTaskUpdate):
    """Update an agenda task"""
    existing = await db.agenda.find_one({"id": task_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task.model_dump().items() if v is not None}
    await db.agenda.update_one({"id": task_id}, {"$set": update_data})
    
    updated = await db.agenda.find_one({"id": task_id}, {"_id": 0})
    return updated

@api_router.delete("/agenda/{task_id}")
async def delete_agenda_task(task_id: str):
    """Delete an agenda task"""
    result = await db.agenda.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# ===================== DAILY REPORTS ENDPOINTS =====================

class DailyReportCreate(BaseModel):
    date: str  # YYYY-MM-DD format
    lead_id: str
    visit_type: str  # meeting, delivery, support, etc
    notes: str
    outcome: Optional[str] = None
    next_action: Optional[str] = None

class DailyReportUpdate(BaseModel):
    visit_type: Optional[str] = None
    notes: Optional[str] = None
    outcome: Optional[str] = None
    next_action: Optional[str] = None

@api_router.get("/daily-reports")
async def get_daily_reports(date: Optional[str] = None):
    """Get all daily reports, optionally filtered by date"""
    query = {}
    if date:
        query["date"] = date
    reports = await db.daily_reports.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return reports

@api_router.get("/daily-reports/by-date/{date}")
async def get_reports_by_date(date: str):
    """Get all reports for a specific date"""
    reports = await db.daily_reports.find({"date": date}, {"_id": 0}).to_list(100)
    return reports

@api_router.post("/daily-reports")
async def create_daily_report(report: DailyReportCreate):
    """Create a new daily report"""
    # Get lead info
    lead = await db.leads.find_one({"id": report.lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    doc = {
        "id": str(uuid.uuid4()),
        "date": report.date,
        "lead_id": report.lead_id,
        "company_name": lead.get("company_name", ""),
        "city": lead.get("city", ""),
        "visit_type": report.visit_type,
        "notes": report.notes,
        "outcome": report.outcome,
        "next_action": report.next_action,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.daily_reports.insert_one(doc)
    return {k: v for k, v in doc.items() if k != '_id'}

@api_router.put("/daily-reports/{report_id}")
async def update_daily_report(report_id: str, report: DailyReportUpdate):
    """Update a daily report"""
    existing = await db.daily_reports.find_one({"id": report_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")
    
    update_data = {k: v for k, v in report.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.daily_reports.update_one({"id": report_id}, {"$set": update_data})
    
    updated = await db.daily_reports.find_one({"id": report_id}, {"_id": 0})
    return updated

@api_router.delete("/daily-reports/{report_id}")
async def delete_daily_report(report_id: str):
    """Delete a daily report"""
    result = await db.daily_reports.delete_one({"id": report_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report deleted successfully"}

@api_router.get("/daily-reports/{report_id}/pdf")
async def get_daily_report_pdf(report_id: str):
    """Generate PDF for a daily report"""
    report = await db.daily_reports.find_one({"id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_daily_report_pdf(report, settings)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=daily_report_{report['date']}.pdf"}
    )

@api_router.get("/daily-reports/date/{date}/pdf")
async def get_daily_reports_by_date_pdf(date: str, lang: str = 'en'):
    """Generate combined PDF for all reports on a specific date"""
    reports = await db.daily_reports.find({"date": date}, {"_id": 0}).to_list(100)
    if not reports:
        raise HTTPException(status_code=404, detail="No reports found for this date")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_combined_daily_report_pdf(reports, date, settings, lang)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=daily_reports_{date}.pdf"}
    )

class DailyReportEmailRequest(BaseModel):
    to_email: str
    subject: Optional[str] = None
    message: Optional[str] = None

@api_router.post("/daily-reports/date/{date}/email")
async def email_daily_reports(date: str, request: DailyReportEmailRequest):
    """Send daily reports PDF via email"""
    reports = await db.daily_reports.find({"date": date}, {"_id": 0}).to_list(100)
    if not reports:
        raise HTTPException(status_code=404, detail="No reports found for this date")
    
    settings = await db.company_settings.find_one({"id": "company_settings"}, {"_id": 0})
    pdf_content = generate_combined_daily_report_pdf(reports, date, settings, 'en')
    
    # In production, integrate with email service (SendGrid, etc.)
    # For now, we'll log and return success
    logger.info(f"Email would be sent to {request.to_email} with {len(reports)} reports for {date}")
    
    # Store email record
    await db.email_log.insert_one({
        "id": str(uuid.uuid4()),
        "type": "daily_reports",
        "to_email": request.to_email,
        "subject": request.subject or f"Daily Reports - {date}",
        "date": date,
        "report_count": len(reports),
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "status": "logged"
    })
    
    return {"message": "Email logged successfully", "report_count": len(reports)}

# ===================== AI SALES FORECAST =====================

@api_router.get("/sales/forecast")
async def get_sales_forecast():
    """AI-powered sales forecast based on historical orders"""
    from datetime import timedelta
    from calendar import monthrange
    
    # Get historical orders
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    
    if not orders:
        return {
            "forecast": None,
            "message": "Not enough historical data for forecast",
            "historical_data": [],
            "next_month_prediction": 0
        }
    
    # Group orders by month
    monthly_data = {}
    for order in orders:
        created = order.get('created_at', '')
        if created:
            try:
                if isinstance(created, str):
                    dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                else:
                    dt = created
                month_key = dt.strftime('%Y-%m')
                
                if month_key not in monthly_data:
                    monthly_data[month_key] = {'revenue': 0, 'orders': 0}
                
                # Calculate order value
                amount = float(order.get('amount', 0) or 0)
                unit_price = float(order.get('unit_price', 0) or 0)
                order_value = amount * unit_price
                
                monthly_data[month_key]['revenue'] += order_value
                monthly_data[month_key]['orders'] += 1
            except Exception as e:
                logger.error(f"Error parsing order date: {e}")
                continue
    
    # Sort by month
    sorted_months = sorted(monthly_data.keys())
    historical = [
        {
            "month": m,
            "revenue": round(monthly_data[m]['revenue'], 2),
            "orders": monthly_data[m]['orders']
        }
        for m in sorted_months
    ]
    
    # Simple forecast: average of last 3 months with trend
    if len(historical) >= 2:
        recent = historical[-3:] if len(historical) >= 3 else historical
        avg_revenue = sum(h['revenue'] for h in recent) / len(recent)
        avg_orders = sum(h['orders'] for h in recent) / len(recent)
        
        # Calculate trend
        if len(recent) >= 2:
            trend = (recent[-1]['revenue'] - recent[0]['revenue']) / len(recent)
            predicted_revenue = avg_revenue + trend
        else:
            predicted_revenue = avg_revenue
        
        # Get next month
        now = datetime.now(timezone.utc)
        next_month = now.replace(day=1) + timedelta(days=32)
        next_month = next_month.replace(day=1)
        next_month_str = next_month.strftime('%Y-%m')
        next_month_name = next_month.strftime('%B %Y')
        
        # Confidence level based on data points
        confidence = min(95, 50 + len(historical) * 5)
        
        return {
            "forecast": {
                "next_month": next_month_str,
                "next_month_name": next_month_name,
                "predicted_revenue": round(max(0, predicted_revenue), 2),
                "predicted_orders": round(avg_orders),
                "confidence": confidence,
                "trend": "up" if trend > 0 else "down" if trend < 0 else "stable"
            },
            "historical_data": historical[-12:],  # Last 12 months
            "summary": {
                "total_revenue": round(sum(h['revenue'] for h in historical), 2),
                "total_orders": sum(h['orders'] for h in historical),
                "avg_monthly_revenue": round(sum(h['revenue'] for h in historical) / len(historical), 2),
                "avg_monthly_orders": round(sum(h['orders'] for h in historical) / len(historical))
            }
        }
    else:
        return {
            "forecast": None,
            "message": "Need at least 2 months of data for forecast",
            "historical_data": historical,
            "next_month_prediction": 0
        }

# Include the router in the main app

# ===================== AI SERVICES ENDPOINTS =====================

from ai_services import email_assistant, churn_predictor, recipe_optimizer, chatbot

class AIEmailRequest(BaseModel):
    email_type: str  # introduction, follow_up, quotation, thank_you, promotion, reminder
    customer_name: str
    company_name: str
    language: str = 'en'
    context: Optional[str] = ''
    product_info: Optional[str] = ''

@api_router.post("/ai/email/generate")
async def generate_ai_email(request: AIEmailRequest):
    """Generate a professional email using AI"""
    result = await email_assistant.generate_email(
        email_type=request.email_type,
        customer_name=request.customer_name,
        company_name=request.company_name,
        language=request.language,
        context=request.context or '',
        product_info=request.product_info or ''
    )
    return result

@api_router.get("/ai/churn/analyze/{lead_id}")
async def analyze_customer_churn(lead_id: str):
    """Analyze churn risk for a specific customer"""
    # Get customer data
    customer = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get customer orders
    orders = await db.orders.find({"lead_id": lead_id}, {"_id": 0}).to_list(100)
    
    result = await churn_predictor.analyze_customer(customer, orders)
    return {
        "customer_id": lead_id,
        "company_name": customer.get('company_name'),
        **result
    }

@api_router.get("/ai/churn/at-risk")
async def get_at_risk_customers():
    """Get all customers at risk of churning"""
    # Get all customers
    customers = await db.leads.find({}, {"_id": 0}).to_list(500)
    
    # Get all orders grouped by customer
    all_orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    orders_by_customer = {}
    for order in all_orders:
        lead_id = order.get('lead_id')
        if lead_id:
            if lead_id not in orders_by_customer:
                orders_by_customer[lead_id] = []
            orders_by_customer[lead_id].append(order)
    
    at_risk = await churn_predictor.get_at_risk_customers(customers, orders_by_customer)
    
    return {
        "total_customers": len(customers),
        "at_risk_count": len(at_risk),
        "at_risk_customers": at_risk[:20]  # Return top 20
    }

@api_router.post("/ai/recipe/optimize/{recipe_id}")
async def optimize_recipe(recipe_id: str, target: str = 'cost'):
    """Optimize a recipe using AI"""
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    result = await recipe_optimizer.optimize_recipe(recipe, target)
    return result

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: str = 'en'
    context: Optional[dict] = None

@api_router.post("/ai/chat")
async def ai_chat(request: ChatRequest):
    """Chat with AI assistant"""
    session_id = request.session_id or str(uuid.uuid4())
    
    result = await chatbot.chat(
        session_id=session_id,
        message=request.message,
        language=request.language,
        context=request.context
    )
    
    # Store chat message in database
    await db.chat_history.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_message": request.message,
        "ai_response": result.get('response', ''),
        "language": request.language,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return result

@api_router.get("/ai/chat/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = await db.chat_history.find(
        {"session_id": session_id}, 
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    return {"session_id": session_id, "messages": messages}
app.include_router(api_router)

# Get frontend URL for CORS
frontend_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://customer-agent-2.preview.emergentagent.com')

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*", frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Create admin user if not exists
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    existing = await db.users.find_one({"username": admin_username}, {"_id": 0})
    if not existing:
        await db.users.insert_one({
            "id": "admin-user-id",
            "username": admin_username,
            "name": "Emre Dirlik",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_username}")
    
    # Write test credentials
    creds_path = Path('/app/memory/test_credentials.md')
    creds_path.parent.mkdir(parents=True, exist_ok=True)
    creds_path.write_text(f"""# Test Credentials

## Admin User
- Username: {admin_username}
- Password: {os.environ.get('ADMIN_PASSWORD', '190371')}
- Role: admin

## Auth Endpoints
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/auth/check
""")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
