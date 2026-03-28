"""
PDF Generation Utilities with Turkish Character Support
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# Register DejaVu fonts for Turkish character support
try:
    pdfmetrics.registerFont(TTFont('DejaVu', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    pdfmetrics.registerFont(TTFont('DejaVu-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    FONT_REGULAR = 'DejaVu'
    FONT_BOLD = 'DejaVu-Bold'
except:
    FONT_REGULAR = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'

# Colors matching the app design
PRIMARY_COLOR = HexColor('#1e293b')    # slate-800
ACCENT_COLOR = HexColor('#f97316')     # orange-500
BG_LIGHT = HexColor('#f8fafc')         # slate-50
TEXT_MUTED = HexColor('#64748b')       # slate-500
SUCCESS_COLOR = HexColor('#22c55e')    # green-500
RED_COLOR = HexColor('#ef4444')
BLUE_COLOR = HexColor('#3b82f6')
PURPLE_COLOR = HexColor('#8b5cf6')
GREEN_COLOR = HexColor('#22c55e')
GRAY_COLOR = HexColor('#6b7280')


def wrap_text(text: str, max_width: int, font_name: str, font_size: int, canvas_obj) -> list:
    """
    Wrap text to fit within a given width.
    Returns a list of lines.
    """
    if not text:
        return []
    
    words = text.split()
    lines = []
    current_line = ""
    
    for word in words:
        test_line = f"{current_line} {word}".strip() if current_line else word
        text_width = canvas_obj.stringWidth(test_line, font_name, font_size)
        
        if text_width <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    
    if current_line:
        lines.append(current_line)
    
    return lines


def draw_wrapped_text(c, text: str, x: float, y: float, max_width: float, 
                      font_name: str, font_size: int, line_height: float = None,
                      color=None) -> float:
    """
    Draw wrapped text on canvas and return the new Y position.
    """
    if not text:
        return y
    
    if color:
        c.setFillColor(color)
    c.setFont(font_name, font_size)
    
    if line_height is None:
        line_height = font_size * 1.3
    
    lines = wrap_text(text, max_width, font_name, font_size, c)
    
    for line in lines:
        c.drawString(x, y, line)
        y -= line_height
    
    return y


def generate_order_pdf(order: dict, company_settings: dict = None, lang: str = 'tr') -> bytes:
    """Generate a professionally styled order PDF with multi-product support and multilingual support"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Multilingual labels
    labels = {
        'tr': {
            'order_form': 'Sipariş Formu',
            'customer': 'MÜŞTERİ',
            'date': 'TARİH',
            'product_details': 'ÜRÜN DETAYLARI',
            'product_name': 'ÜRÜN ADI',
            'code': 'KOD',
            'quantity': 'MİKTAR',
            'unit_price': 'BİRİM FİYAT',
            'subtotal': 'ARA TOPLAM',
            'total_price': 'TOPLAM FİYAT',
            'notes': 'NOTLAR',
            'created': 'Oluşturulma',
            'status': {
                'pending': 'BEKLEMEDE',
                'confirmed': 'ONAYLANDI',
                'shipped': 'GÖNDERİLDİ',
                'delivered': 'TESLİM EDİLDİ',
                'cancelled': 'İPTAL'
            }
        },
        'de': {
            'order_form': 'Bestellformular',
            'customer': 'KUNDE',
            'date': 'DATUM',
            'product_details': 'PRODUKTDETAILS',
            'product_name': 'PRODUKTNAME',
            'code': 'CODE',
            'quantity': 'MENGE',
            'unit_price': 'STÜCKPREIS',
            'subtotal': 'ZWISCHENSUMME',
            'total_price': 'GESAMTPREIS',
            'notes': 'NOTIZEN',
            'created': 'Erstellt',
            'status': {
                'pending': 'AUSSTEHEND',
                'confirmed': 'BESTÄTIGT',
                'shipped': 'VERSENDET',
                'delivered': 'GELIEFERT',
                'cancelled': 'STORNIERT'
            }
        },
        'en': {
            'order_form': 'Order Form',
            'customer': 'CUSTOMER',
            'date': 'DATE',
            'product_details': 'PRODUCT DETAILS',
            'product_name': 'PRODUCT NAME',
            'code': 'CODE',
            'quantity': 'QUANTITY',
            'unit_price': 'UNIT PRICE',
            'subtotal': 'SUBTOTAL',
            'total_price': 'TOTAL PRICE',
            'notes': 'NOTES',
            'created': 'Created',
            'status': {
                'pending': 'PENDING',
                'confirmed': 'CONFIRMED',
                'shipped': 'SHIPPED',
                'delivered': 'DELIVERED',
                'cancelled': 'CANCELLED'
            }
        },
        'pl': {
            'order_form': 'Formularz Zamówienia',
            'customer': 'KLIENT',
            'date': 'DATA',
            'product_details': 'SZCZEGÓŁY PRODUKTU',
            'product_name': 'NAZWA PRODUKTU',
            'code': 'KOD',
            'quantity': 'ILOŚĆ',
            'unit_price': 'CENA JEDN.',
            'subtotal': 'SUMA CZĘŚCIOWA',
            'total_price': 'CENA CAŁKOWITA',
            'notes': 'UWAGI',
            'created': 'Utworzono',
            'status': {
                'pending': 'OCZEKUJĄCE',
                'confirmed': 'POTWIERDZONE',
                'shipped': 'WYSŁANE',
                'delivered': 'DOSTARCZONE',
                'cancelled': 'ANULOWANE'
            }
        }
    }
    
    L = labels.get(lang, labels['en'])
    
    # Header background
    c.setFillColor(PRIMARY_COLOR)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    # Company name
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 24)
    c.drawString(2*cm, height - 2.5*cm, company_name)
    c.setFont(FONT_REGULAR, 10)
    c.drawString(2*cm, height - 3.2*cm, L['order_form'])
    
    # Document ID
    c.setFont(FONT_BOLD, 12)
    c.drawRightString(width - 2*cm, height - 2.5*cm, f"#{order['id'][:8].upper()}")
    c.setFont(FONT_REGULAR, 10)
    c.drawRightString(width - 2*cm, height - 3.2*cm, datetime.now().strftime('%d.%m.%Y'))
    
    y = height - 5.5*cm
    
    # Customer info card
    c.setFillColor(BG_LIGHT)
    c.roundRect(1.5*cm, y - 3*cm, width - 3*cm, 3*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 9)
    c.drawString(2*cm, y - 0.7*cm, L['customer'])
    c.setFillColor(black)
    c.setFont(FONT_BOLD, 14)
    c.drawString(2*cm, y - 1.4*cm, order.get('company_name', ''))
    c.setFont(FONT_REGULAR, 10)
    c.setFillColor(TEXT_MUTED)
    c.drawString(2*cm, y - 2.1*cm, order.get('lead_name', ''))
    
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 9)
    c.drawString(10*cm, y - 0.7*cm, L['date'])
    c.setFillColor(black)
    c.setFont(FONT_BOLD, 11)
    c.drawString(10*cm, y - 1.4*cm, datetime.now().strftime('%d.%m.%Y'))
    
    y -= 4*cm
    
    # Product details header
    c.setFillColor(ACCENT_COLOR)
    c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 10)
    c.drawString(2*cm, y - 0.7*cm, L['product_details'])
    
    y -= 1.5*cm
    
    # Get products list
    products = order.get('products', [])
    total_price = order.get('total_price', 0)
    
    if products and len(products) > 0:
        # Multi-product table header
        c.setFillColor(BG_LIGHT)
        c.rect(1.5*cm, y - 0.7*cm, width - 3*cm, 0.7*cm, fill=True, stroke=False)
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 8)
        c.drawString(2*cm, y - 0.5*cm, L['product_name'])
        c.drawString(7*cm, y - 0.5*cm, L['code'])
        c.drawString(10*cm, y - 0.5*cm, L['quantity'])
        c.drawString(13*cm, y - 0.5*cm, L['unit_price'])
        c.drawRightString(width - 2*cm, y - 0.5*cm, L['subtotal'])
        
        y -= 0.9*cm
        
        # Product rows
        for i, product in enumerate(products):
            pieces = product.get('pieces', 1)
            amount = product.get('amount', 1)
            unit = product.get('unit', 'kg')
            unit_price = product.get('unit_price', 0)
            subtotal = product.get('subtotal', pieces * amount * unit_price)
            
            # Alternate row background
            if i % 2 == 0:
                c.setFillColor(HexColor('#fafafa'))
                c.rect(1.5*cm, y - 0.6*cm, width - 3*cm, 0.6*cm, fill=True, stroke=False)
            
            c.setFillColor(black)
            c.setFont(FONT_REGULAR, 9)
            
            # Product name (truncate if too long)
            pname = product.get('product_name', '')[:25]
            c.drawString(2*cm, y - 0.4*cm, pname)
            
            # Product code
            c.setFillColor(TEXT_MUTED)
            c.setFont(FONT_REGULAR, 8)
            c.drawString(7*cm, y - 0.4*cm, product.get('product_code', ''))
            
            # Quantity
            c.setFillColor(black)
            c.setFont(FONT_REGULAR, 9)
            qty_str = f"{pieces} × {amount} {unit}" if pieces > 1 else f"{amount} {unit}"
            c.drawString(10*cm, y - 0.4*cm, qty_str)
            
            # Unit price
            c.drawString(13*cm, y - 0.4*cm, f"€{unit_price:.2f}/{unit}")
            
            # Subtotal
            c.setFont(FONT_BOLD, 9)
            c.drawRightString(width - 2*cm, y - 0.4*cm, f"€{subtotal:.2f}")
            
            y -= 0.7*cm
            
            if y < 6*cm:
                break
        
        y -= 0.3*cm
    else:
        # Legacy single product display
        pieces = order.get('pieces', 1)
        amount = order.get('amount', order.get('quantity', 1))
        unit = order.get('unit', 'kg')
        
        items = [
            (L['product_name'], order.get('product_name', '')),
            (L['code'], order.get('product_code', '')),
            (L['quantity'], f"{pieces} × {amount} {unit}"),
            (L['unit_price'], f"€{order.get('unit_price', 0):.2f}/{unit}"),
        ]
        
        for label, value in items:
            c.setFillColor(TEXT_MUTED)
            c.setFont(FONT_REGULAR, 9)
            c.drawString(2*cm, y, label)
            c.setFillColor(black)
            c.setFont(FONT_BOLD, 11)
            c.drawString(6*cm, y, str(value))
            y -= 0.8*cm
    
    y -= 0.5*cm
    
    # Total Price box
    c.setFillColor(SUCCESS_COLOR)
    c.roundRect(1.5*cm, y - 2*cm, width - 3*cm, 2*cm, 5, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont(FONT_REGULAR, 12)
    c.drawString(2*cm, y - 0.8*cm, L['total_price'])
    c.setFont(FONT_BOLD, 24)
    c.drawRightString(width - 2*cm, y - 1.4*cm, f"€{total_price:.2f}")
    
    y -= 3*cm
    
    # Status badge
    status_colors = {
        'pending': HexColor('#eab308'),
        'confirmed': HexColor('#3b82f6'),
        'shipped': HexColor('#8b5cf6'),
        'delivered': HexColor('#22c55e'),
        'cancelled': HexColor('#ef4444')
    }
    status_labels = L['status']
    
    status = order.get('status', 'pending')
    c.setFillColor(status_colors.get(status, TEXT_MUTED))
    c.roundRect(2*cm, y - 1*cm, 4*cm, 1*cm, 3, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 10)
    c.drawCentredString(4*cm, y - 0.7*cm, status_labels.get(status, status.upper()))
    
    # Notes
    if order.get('notes'):
        y -= 2*cm
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_REGULAR, 9)
        c.drawString(2*cm, y, L['notes'])
        c.setFillColor(black)
        c.setFont(FONT_REGULAR, 10)
        c.drawString(2*cm, y - 0.6*cm, order['notes'][:100])
    
    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 8)
    c.drawString(2*cm, 1.5*cm, f"{L['created']}: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def generate_recipe_pdf(recipe: dict, company_settings: dict = None) -> bytes:
    """Generate a professionally styled recipe PDF matching the UI design"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Header
    c.setFillColor(PRIMARY_COLOR)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 24)
    c.drawString(2*cm, height - 2.5*cm, company_name)
    c.setFont(FONT_REGULAR, 10)
    c.drawString(2*cm, height - 3.2*cm, "Üretim Reçetesi")
    
    c.setFont(FONT_BOLD, 12)
    c.drawRightString(width - 2*cm, height - 2.5*cm, recipe.get('product_code', ''))
    
    y = height - 5.5*cm
    
    # Recipe title card
    c.setFillColor(BG_LIGHT)
    c.roundRect(1.5*cm, y - 2.5*cm, width - 3*cm, 2.5*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(black)
    c.setFont(FONT_BOLD, 18)
    c.drawString(2*cm, y - 1*cm, recipe.get('name', ''))
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 11)
    c.drawString(2*cm, y - 1.8*cm, f"Müşteri: {recipe.get('company_name', '')}")
    
    y -= 4*cm
    
    # Main ingredients header
    c.setFillColor(ACCENT_COLOR)
    c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 10)
    c.drawString(2*cm, y - 0.7*cm, "ANA MALZEMELER")
    
    y -= 1.8*cm
    
    # Ingredient boxes (2x2 grid like in UI)
    box_width = (width - 4*cm) / 2
    box_height = 1.8*cm
    
    ingredients = [
        (RED_COLOR, HexColor('#fef2f2'), "Et Miktarı", f"{recipe.get('meat_amount', 0)} kg"),
        (BLUE_COLOR, HexColor('#eff6ff'), "Su Miktarı", f"{recipe.get('water_amount', 0)} L"),
        (ACCENT_COLOR, HexColor('#fff7ed'), "Baharat Miktarı", f"{recipe.get('spice_amount', 0)} kg"),
        (PURPLE_COLOR, HexColor('#faf5ff'), "Binding Miktarı", f"{recipe.get('binding_amount', 0)} kg"),
    ]
    
    for i, (text_color, bg_color, label, value) in enumerate(ingredients):
        col = i % 2
        row = i // 2
        x = 1.5*cm + col * (box_width + 0.5*cm)
        box_y = y - row * (box_height + 0.3*cm)
        
        # Light colored background
        c.setFillColor(bg_color)
        c.roundRect(x, box_y - box_height, box_width - 0.3*cm, box_height, 5, fill=True, stroke=False)
        
        c.setFillColor(text_color)
        c.setFont(FONT_REGULAR, 9)
        c.drawString(x + 0.4*cm, box_y - 0.6*cm, label)
        c.setFillColor(black)
        c.setFont(FONT_BOLD, 16)
        c.drawString(x + 0.4*cm, box_y - 1.3*cm, value)
    
    y -= 4.5*cm
    
    # Production parameters header
    c.setFillColor(GREEN_COLOR)
    c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 10)
    c.drawString(2*cm, y - 0.7*cm, "ÜRETİM PARAMETRELERİ")
    
    y -= 1.8*cm
    
    params = [
        (GREEN_COLOR, HexColor('#f0fdf4'), "Karışım Süresi", f"{recipe.get('mixing_time', 0)} dakika"),
        (GRAY_COLOR, HexColor('#f3f4f6'), "Motor Hızı", f"{recipe.get('motor_speed', 0)} rpm"),
    ]
    
    for i, (text_color, bg_color, label, value) in enumerate(params):
        x = 1.5*cm + i * (box_width + 0.5*cm)
        
        c.setFillColor(bg_color)
        c.roundRect(x, y - box_height, box_width - 0.3*cm, box_height, 5, fill=True, stroke=False)
        
        c.setFillColor(text_color)
        c.setFont(FONT_REGULAR, 9)
        c.drawString(x + 0.4*cm, y - 0.6*cm, label)
        c.setFillColor(black)
        c.setFont(FONT_BOLD, 16)
        c.drawString(x + 0.4*cm, y - 1.3*cm, value)
    
    y -= 3*cm
    
    # Additional ingredients
    if recipe.get('additional_ingredients'):
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y, "EK MALZEMELER")
        y -= 0.6*cm
        
        c.setFont(FONT_REGULAR, 10)
        for ing in recipe['additional_ingredients'][:5]:
            c.setFillColor(black)
            c.drawString(2*cm, y, f"• {ing.get('name', '')}: {ing.get('amount', '')} {ing.get('unit', '')}")
            y -= 0.5*cm
    
    y -= 0.5*cm
    
    # Instructions
    if recipe.get('instructions'):
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y, "ÜRETİM TALİMATLARI")
        y -= 0.6*cm
        
        c.setFillColor(BG_LIGHT)
        c.roundRect(1.5*cm, y - 2*cm, width - 3*cm, 2*cm, 5, fill=True, stroke=False)
        c.setFillColor(black)
        c.setFont(FONT_REGULAR, 9)
        instructions = recipe['instructions'][:200]
        c.drawString(2*cm, y - 0.5*cm, instructions[:80])
        if len(instructions) > 80:
            c.drawString(2*cm, y - 1*cm, instructions[80:160])
    
    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 8)
    c.drawString(2*cm, 1.5*cm, f"Oluşturulma: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def generate_lead_pdf(lead: dict, orders: list = None, recipes: list = None, company_settings: dict = None) -> bytes:
    """Generate a professionally styled lead/customer PDF"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Header
    c.setFillColor(PRIMARY_COLOR)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 24)
    c.drawString(2*cm, height - 2.5*cm, company_name)
    c.setFont(FONT_REGULAR, 10)
    c.drawString(2*cm, height - 3.2*cm, "Müşteri Bilgileri")
    
    c.setFont(FONT_BOLD, 12)
    c.drawRightString(width - 2*cm, height - 2.5*cm, datetime.now().strftime('%d.%m.%Y'))
    
    y = height - 5.5*cm
    
    # Company info card
    c.setFillColor(BG_LIGHT)
    c.roundRect(1.5*cm, y - 4*cm, width - 3*cm, 4*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(ACCENT_COLOR)
    c.setFont(FONT_BOLD, 20)
    c.drawString(2*cm, y - 1*cm, lead.get('company_name', ''))
    
    c.setFillColor(black)
    c.setFont(FONT_BOLD, 14)
    c.drawString(2*cm, y - 1.8*cm, f"{lead.get('first_name', '')} {lead.get('last_name', '')}")
    
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 11)
    contact_info = []
    if lead.get('email'):
        contact_info.append(f"📧 {lead['email']}")
    if lead.get('phone'):
        contact_info.append(f"📱 {lead['phone']}")
    if lead.get('city') and lead.get('country'):
        contact_info.append(f"📍 {lead['city']}, {lead['country']}")
    
    for i, info in enumerate(contact_info[:3]):
        c.drawString(2*cm, y - 2.5*cm - (i * 0.5*cm), info)
    
    y -= 5.5*cm
    
    # Address section
    if lead.get('address'):
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y, "ADRES")
        c.setFillColor(black)
        c.setFont(FONT_REGULAR, 10)
        c.drawString(2*cm, y - 0.6*cm, lead['address'][:80])
        y -= 1.5*cm
    
    # Tax info
    if lead.get('tax_number'):
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y, "VERGİ NUMARASI")
        c.setFillColor(black)
        c.setFont(FONT_REGULAR, 10)
        c.drawString(2*cm, y - 0.6*cm, lead['tax_number'])
        y -= 1.5*cm
    
    # Orders section
    if orders and len(orders) > 0:
        c.setFillColor(BLUE_COLOR)
        c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y - 0.7*cm, f"SİPARİŞLER ({len(orders)})")
        
        y -= 1.5*cm
        
        for order in orders[:5]:
            c.setFillColor(black)
            c.setFont(FONT_REGULAR, 9)
            status_emoji = {'delivered': '✅', 'shipped': '📦', 'confirmed': '✓', 'pending': '⏳', 'cancelled': '❌'}
            emoji = status_emoji.get(order.get('status', ''), '•')
            c.drawString(2*cm, y, f"{emoji} {order.get('product_name', '')} - €{order.get('total_price', 0):.2f}")
            y -= 0.5*cm
        
        y -= 0.5*cm
    
    # Recipes section
    if recipes and len(recipes) > 0:
        c.setFillColor(PURPLE_COLOR)
        c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y - 0.7*cm, f"REÇETELER ({len(recipes)})")
        
        y -= 1.5*cm
        
        for recipe in recipes[:5]:
            c.setFillColor(black)
            c.setFont(FONT_REGULAR, 9)
            c.drawString(2*cm, y, f"• {recipe.get('name', '')} ({recipe.get('product_code', '')})")
            y -= 0.5*cm
    
    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 8)
    c.drawString(2*cm, 1.5*cm, f"Oluşturulma: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


def generate_route_pdf(route_data: dict, company_settings: dict = None) -> bytes:
    """Generate a route plan PDF"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Header
    c.setFillColor(PRIMARY_COLOR)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 24)
    c.drawString(2*cm, height - 2.5*cm, company_name)
    c.setFont(FONT_REGULAR, 10)
    c.drawString(2*cm, height - 3.2*cm, "Rota Planı")
    
    c.setFont(FONT_BOLD, 12)
    c.drawRightString(width - 2*cm, height - 2.5*cm, datetime.now().strftime('%d.%m.%Y'))
    
    y = height - 5.5*cm
    
    # Route summary card
    c.setFillColor(BG_LIGHT)
    c.roundRect(1.5*cm, y - 2.5*cm, width - 3*cm, 2.5*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(ACCENT_COLOR)
    c.setFont(FONT_BOLD, 16)
    c.drawString(2*cm, y - 1*cm, f"Toplam: {route_data.get('total_distance', 0):.1f} km")
    
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 12)
    hours = route_data.get('total_duration', 0) / 60
    c.drawString(2*cm, y - 1.8*cm, f"Tahmini Süre: {hours:.1f} saat ({route_data.get('total_duration', 0):.0f} dakika)")
    
    y -= 4*cm
    
    # Start point
    start = route_data.get('start_point', {})
    c.setFillColor(GREEN_COLOR)
    c.roundRect(1.5*cm, y - 1.2*cm, width - 3*cm, 1.2*cm, 5, fill=True, stroke=False)
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 10)
    c.drawString(2*cm, y - 0.8*cm, f"BAŞLANGIÇ: {start.get('address', 'Berlin')}")
    
    y -= 2*cm
    
    # Route stops
    stops = route_data.get('stops', [])
    for i, stop in enumerate(stops):
        c.setFillColor(ACCENT_COLOR)
        c.circle(2*cm, y - 0.3*cm, 0.3*cm, fill=True, stroke=False)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 8)
        c.drawCentredString(2*cm, y - 0.45*cm, str(i + 1))
        
        c.setFillColor(black)
        c.setFont(FONT_BOLD, 11)
        c.drawString(3*cm, y - 0.3*cm, stop.get('company_name', ''))
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_REGULAR, 9)
        c.drawString(3*cm, y - 0.9*cm, f"{stop.get('city', '')}, {stop.get('country', '')}")
        
        if stop.get('distance'):
            c.setFillColor(BLUE_COLOR)
            c.setFont(FONT_REGULAR, 9)
            c.drawRightString(width - 2*cm, y - 0.3*cm, f"{stop.get('distance', 0):.1f} km")
        
        y -= 1.5*cm
        
        if y < 3*cm:
            break
    
    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 8)
    c.drawString(2*cm, 1.5*cm, f"Oluşturulma: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()



def generate_specification_pdf(spec: dict, company_settings: dict = None) -> bytes:
    """Generate a professionally styled product specification PDF"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Header
    c.setFillColor(PRIMARY_COLOR)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 24)
    c.drawString(2*cm, height - 2.5*cm, company_name)
    c.setFont(FONT_REGULAR, 10)
    c.drawString(2*cm, height - 3.2*cm, "Product Specification")
    
    c.setFont(FONT_BOLD, 12)
    c.drawRightString(width - 2*cm, height - 2.5*cm, spec.get('product_code', ''))
    c.setFont(FONT_REGULAR, 10)
    c.drawRightString(width - 2*cm, height - 3.2*cm, datetime.now().strftime('%d.%m.%Y'))
    
    y = height - 5.5*cm
    
    # Product title card
    c.setFillColor(BG_LIGHT)
    c.roundRect(1.5*cm, y - 2.5*cm, width - 3*cm, 2.5*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(ACCENT_COLOR)
    c.setFont(FONT_BOLD, 20)
    c.drawString(2*cm, y - 1*cm, spec.get('name', ''))
    
    if spec.get('category'):
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_REGULAR, 11)
        c.drawString(2*cm, y - 1.8*cm, f"Category: {spec['category']}")
    
    y -= 4*cm
    
    # Description
    if spec.get('description'):
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y, "DESCRIPTION")
        y -= 0.6*cm
        c.setFillColor(black)
        c.setFont(FONT_REGULAR, 10)
        desc = spec['description'][:200]
        c.drawString(2*cm, y, desc[:80])
        if len(desc) > 80:
            y -= 0.5*cm
            c.drawString(2*cm, y, desc[80:160])
        y -= 1*cm
    
    # Ingredients
    ingredients = spec.get('ingredients', [])
    if ingredients:
        c.setFillColor(ACCENT_COLOR)
        c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y - 0.7*cm, f"INGREDIENTS ({len(ingredients)})")
        
        y -= 1.5*cm
        
        # Table header
        c.setFillColor(BG_LIGHT)
        c.rect(1.5*cm, y - 0.6*cm, width - 3*cm, 0.6*cm, fill=True, stroke=False)
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 9)
        c.drawString(2*cm, y - 0.4*cm, "Ingredient")
        c.drawString(8*cm, y - 0.4*cm, "%")
        c.drawString(10*cm, y - 0.4*cm, "Description")
        
        y -= 0.8*cm
        
        for ing in ingredients[:10]:
            c.setFillColor(black)
            c.setFont(FONT_REGULAR, 9)
            c.drawString(2*cm, y, str(ing.get('name', ''))[:30])
            c.drawString(8*cm, y, str(ing.get('percentage', '-')))
            c.setFillColor(TEXT_MUTED)
            c.drawString(10*cm, y, str(ing.get('description', ''))[:35])
            y -= 0.5*cm
            
            if y < 6*cm:
                break
        
        y -= 0.5*cm
    
    # Additional info grid
    info_items = []
    if spec.get('allergens'):
        info_items.append(("Allergens", spec['allergens']))
    if spec.get('shelf_life'):
        info_items.append(("Shelf Life", spec['shelf_life']))
    if spec.get('storage_instructions'):
        info_items.append(("Storage", spec['storage_instructions']))
    if spec.get('certifications'):
        info_items.append(("Certifications", spec['certifications']))
    
    if info_items:
        c.setFillColor(GREEN_COLOR)
        c.rect(1.5*cm, y - 1*cm, width - 3*cm, 1*cm, fill=True, stroke=False)
        c.setFillColor(white)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y - 0.7*cm, "ADDITIONAL INFORMATION")
        
        y -= 1.5*cm
        
        for label, value in info_items:
            c.setFillColor(TEXT_MUTED)
            c.setFont(FONT_BOLD, 9)
            c.drawString(2*cm, y, label)
            c.setFillColor(black)
            c.setFont(FONT_REGULAR, 9)
            c.drawString(5*cm, y, str(value)[:60])
            y -= 0.6*cm
            
            if y < 3*cm:
                break
    
    # Nutritional info
    if spec.get('nutritional_info') and y > 4*cm:
        y -= 0.5*cm
        c.setFillColor(TEXT_MUTED)
        c.setFont(FONT_BOLD, 10)
        c.drawString(2*cm, y, "NUTRITIONAL INFORMATION")
        y -= 0.6*cm
        
        c.setFillColor(BG_LIGHT)
        c.roundRect(1.5*cm, y - 1.5*cm, width - 3*cm, 1.5*cm, 5, fill=True, stroke=False)
        c.setFillColor(black)
        c.setFont(FONT_REGULAR, 9)
        nutri = spec['nutritional_info'][:150]
        c.drawString(2*cm, y - 0.5*cm, nutri[:70])
        if len(nutri) > 70:
            c.drawString(2*cm, y - 1*cm, nutri[70:140])
    
    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 8)
    c.drawString(2*cm, 1.5*cm, f"Generated: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()



def generate_daily_report_pdf(report: dict, company_settings: dict = None) -> bytes:
    """Generate a PDF for daily visit report"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    company_name = company_settings.get('company_name', 'Gewürzberg GmbH') if company_settings else 'Gewürzberg GmbH'
    
    # Header background
    c.setFillColor(PRIMARY_COLOR)
    c.rect(0, height - 4*cm, width, 4*cm, fill=True, stroke=False)
    
    # Company name
    c.setFillColor(white)
    c.setFont(FONT_BOLD, 24)
    c.drawString(2*cm, height - 2*cm, company_name)
    
    # Document title
    c.setFont(FONT_REGULAR, 12)
    c.drawString(2*cm, height - 2.8*cm, "GÜNLÜK ZİYARET RAPORU")
    
    # Date badge
    c.setFillColor(ACCENT_COLOR)
    date_text = report.get('date', '')
    c.drawRightString(width - 2*cm, height - 2*cm, f"Tarih: {date_text}")
    
    y = height - 5.5*cm
    
    # Customer info box
    c.setFillColor(BG_LIGHT)
    c.roundRect(1.5*cm, y - 3*cm, width - 3*cm, 3*cm, 5, fill=True, stroke=False)
    
    c.setFillColor(black)
    c.setFont(FONT_BOLD, 14)
    c.drawString(2*cm, y - 0.8*cm, report.get('company_name', 'Müşteri'))
    
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 10)
    c.drawString(2*cm, y - 1.5*cm, f"Şehir: {report.get('city', 'N/A')}")
    c.drawString(2*cm, y - 2.2*cm, f"Ziyaret Türü: {report.get('visit_type', 'N/A')}")
    
    y -= 4*cm
    
    # Notes section
    c.setFillColor(PRIMARY_COLOR)
    c.setFont(FONT_BOLD, 12)
    c.drawString(2*cm, y, "NOTLAR")
    y -= 0.8*cm
    
    c.setFillColor(black)
    c.setFont(FONT_REGULAR, 10)
    notes = report.get('notes', '')
    lines = []
    words = notes.split()
    current_line = ""
    for word in words:
        if len(current_line + " " + word) < 80:
            current_line = (current_line + " " + word).strip()
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    
    for line in lines[:10]:
        c.drawString(2*cm, y, line)
        y -= 0.5*cm
    
    y -= 0.5*cm
    
    # Outcome section
    if report.get('outcome'):
        c.setFillColor(PRIMARY_COLOR)
        c.setFont(FONT_BOLD, 12)
        c.drawString(2*cm, y, "SONUÇ")
        y -= 0.8*cm
        
        c.setFillColor(SUCCESS_COLOR)
        c.setFont(FONT_REGULAR, 10)
        c.drawString(2*cm, y, report.get('outcome', ''))
        y -= 1*cm
    
    # Next action section
    if report.get('next_action'):
        c.setFillColor(PRIMARY_COLOR)
        c.setFont(FONT_BOLD, 12)
        c.drawString(2*cm, y, "BİR SONRAKİ ADIM")
        y -= 0.8*cm
        
        c.setFillColor(ACCENT_COLOR)
        c.setFont(FONT_REGULAR, 10)
        c.drawString(2*cm, y, report.get('next_action', ''))
    
    # Footer
    c.setFillColor(TEXT_MUTED)
    c.setFont(FONT_REGULAR, 8)
    c.drawString(2*cm, 1.5*cm, f"Oluşturulma: {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    c.drawRightString(width - 2*cm, 1.5*cm, company_name)
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()



def generate_combined_daily_report_pdf(reports: list, date: str, company_settings: dict = None, lang: str = 'en') -> bytes:
    """Generate a combined PDF for all daily reports on a specific date - Clean Minimal Design"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Language-specific labels
    labels = {
        'en': {
            'title': 'Daily Activity Report',
            'total_visits': 'Total Visits',
            'meeting': 'Meeting', 'delivery': 'Delivery', 'support': 'Support',
            'sales': 'Sales', 'follow_up': 'Follow-up', 'other': 'Other',
            'customer': 'Customer', 'city': 'City', 'notes': 'Notes',
            'outcome': 'Outcome', 'next_step': 'Next Step', 'page': 'Page'
        },
        'tr': {
            'title': 'Günlük Aktivite Raporu',
            'total_visits': 'Toplam Ziyaret',
            'meeting': 'Toplantı', 'delivery': 'Teslimat', 'support': 'Destek',
            'sales': 'Satış', 'follow_up': 'Takip', 'other': 'Diğer',
            'customer': 'Müşteri', 'city': 'Şehir', 'notes': 'Notlar',
            'outcome': 'Sonuç', 'next_step': 'Sonraki Adım', 'page': 'Sayfa'
        },
        'de': {
            'title': 'Tagesaktivitätsbericht',
            'total_visits': 'Gesamtbesuche',
            'meeting': 'Besprechung', 'delivery': 'Lieferung', 'support': 'Support',
            'sales': 'Verkauf', 'follow_up': 'Nachverfolgung', 'other': 'Sonstige',
            'customer': 'Kunde', 'city': 'Stadt', 'notes': 'Notizen',
            'outcome': 'Ergebnis', 'next_step': 'Nächster Schritt', 'page': 'Seite'
        },
        'pl': {
            'title': 'Raport dzienny',
            'total_visits': 'Łączne wizyty',
            'meeting': 'Spotkanie', 'delivery': 'Dostawa', 'support': 'Wsparcie',
            'sales': 'Sprzedaż', 'follow_up': 'Kontynuacja', 'other': 'Inne',
            'customer': 'Klient', 'city': 'Miasto', 'notes': 'Notatki',
            'outcome': 'Wynik', 'next_step': 'Następny krok', 'page': 'Strona'
        }
    }
    L = labels.get(lang, labels['en'])
    
    # Clean minimal header
    c.setFillColor(HexColor('#374151'))
    c.setFont(FONT_BOLD, 22)
    c.drawString(2*cm, height - 2*cm, L['title'])
    
    # Date
    c.setFillColor(HexColor('#6b7280'))
    c.setFont(FONT_REGULAR, 12)
    c.drawString(2*cm, height - 2.8*cm, date)
    
    # Horizontal line
    c.setStrokeColor(HexColor('#e5e7eb'))
    c.setLineWidth(1)
    c.line(2*cm, height - 3.2*cm, width - 2*cm, height - 3.2*cm)
    
    # Summary stats in a simple row
    c.setFillColor(HexColor('#374151'))
    c.setFont(FONT_BOLD, 11)
    c.drawString(2*cm, height - 4*cm, f"{L['total_visits']}: {len(reports)}")
    
    # Count by type
    visit_counts = {}
    for r in reports:
        vtype = r.get('visit_type', 'other')
        visit_counts[vtype] = visit_counts.get(vtype, 0) + 1
    
    x_pos = 7*cm
    for vtype, count in visit_counts.items():
        label = L.get(vtype, vtype)
        c.setFillColor(HexColor('#6b7280'))
        c.setFont(FONT_REGULAR, 10)
        c.drawString(x_pos, height - 4*cm, f"{label}: {count}")
        x_pos += 3.5*cm
    
    y = height - 5.5*cm
    page_num = 1
    max_text_width = width - 6*cm  # Available width for text
    
    # Reports
    for i, report in enumerate(reports):
        # Calculate dynamic card height based on notes length
        notes = report.get('notes', '')
        notes_lines = wrap_text(notes, max_text_width, FONT_REGULAR, 9, c) if notes else []
        extra_height = max(0, (len(notes_lines) - 2) * 0.4*cm)
        card_height = 3*cm + extra_height
        
        if y < 4*cm + card_height:
            # Footer with page number
            c.setFillColor(HexColor('#9ca3af'))
            c.setFont(FONT_REGULAR, 9)
            c.drawCentredString(width / 2, 1.5*cm, f"{L['page']} {page_num}")
            
            c.showPage()
            page_num += 1
            # Simple header on new pages
            c.setFillColor(HexColor('#374151'))
            c.setFont(FONT_BOLD, 14)
            c.drawString(2*cm, height - 1.5*cm, f"{L['title']} - {date}")
            c.setStrokeColor(HexColor('#e5e7eb'))
            c.line(2*cm, height - 2*cm, width - 2*cm, height - 2*cm)
            y = height - 3.5*cm
        
        # Report card - clean minimal style
        # Light background
        c.setFillColor(HexColor('#f9fafb'))
        c.roundRect(2*cm, y - card_height, width - 4*cm, card_height, 3, fill=True, stroke=False)
        
        # Left accent bar based on visit type
        type_colors = {
            'meeting': HexColor('#3b82f6'),
            'delivery': HexColor('#22c55e'),
            'support': HexColor('#f97316'),
            'sales': HexColor('#a855f7'),
            'follow_up': HexColor('#eab308'),
            'other': HexColor('#6b7280')
        }
        c.setFillColor(type_colors.get(report.get('visit_type', 'other'), HexColor('#6b7280')))
        c.rect(2*cm, y - card_height, 0.2*cm, card_height, fill=True, stroke=False)
        
        # Card number
        c.setFillColor(HexColor('#374151'))
        c.setFont(FONT_BOLD, 12)
        c.drawString(2.5*cm, y - 0.8*cm, f"#{i+1}")
        
        # Company name
        c.setFillColor(HexColor('#111827'))
        c.setFont(FONT_BOLD, 11)
        company = report.get('company_name', L['customer'])
        if len(company) > 40:
            company = company[:37] + '...'
        c.drawString(3.3*cm, y - 0.8*cm, company)
        
        # Visit type badge
        vtype = report.get('visit_type', 'other')
        c.setFillColor(type_colors.get(vtype, HexColor('#6b7280')))
        badge_text = L.get(vtype, vtype)
        c.roundRect(width - 5.5*cm, y - 1.1*cm, 3*cm, 0.7*cm, 3, fill=True, stroke=False)
        c.setFillColor(white)
        c.setFont(FONT_REGULAR, 8)
        c.drawCentredString(width - 4*cm, y - 0.8*cm, badge_text)
        
        # City
        c.setFillColor(HexColor('#6b7280'))
        c.setFont(FONT_REGULAR, 9)
        c.drawString(3.3*cm, y - 1.5*cm, f"{report.get('city', 'N/A')}")
        
        # Notes - properly wrapped
        notes_y = y - 2.2*cm
        if notes_lines:
            c.setFillColor(HexColor('#374151'))
            c.setFont(FONT_REGULAR, 9)
            for line in notes_lines[:5]:  # Max 5 lines
                c.drawString(2.5*cm, notes_y, line)
                notes_y -= 0.4*cm
            if len(notes_lines) > 5:
                c.drawString(2.5*cm, notes_y, "...")
                notes_y -= 0.4*cm
        
        # Outcome if exists
        if report.get('outcome'):
            c.setFillColor(HexColor('#059669'))
            c.setFont(FONT_REGULAR, 8)
            outcome_text = report.get('outcome', '')
            if len(outcome_text) > 60:
                outcome_text = outcome_text[:57] + '...'
            c.drawString(2.5*cm, notes_y - 0.2*cm, f"✓ {outcome_text}")
        
        y -= (card_height + 0.4*cm)
    
    # Footer - clean
    c.setFillColor(HexColor('#9ca3af'))
    c.setFont(FONT_REGULAR, 8)
    c.drawCentredString(width/2, 1.5*cm, f"{L['page']} {page_num}")
    
    c.save()
    buffer.seek(0)
    return buffer.getvalue()
