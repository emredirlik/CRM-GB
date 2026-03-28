"""
AI Services Module - Gemini-powered AI features for CRM
Features: Email Assistant, Churn Prediction, Recipe Optimization, Chatbot
"""
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Get API key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')


class AIEmailAssistant:
    """AI-powered email writing assistant"""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def generate_email(
        self, 
        email_type: str, 
        customer_name: str, 
        company_name: str,
        language: str = 'en',
        context: str = '',
        product_info: str = ''
    ) -> Dict:
        """Generate a professional email based on type and context"""
        
        email_templates = {
            'introduction': {
                'en': f"Write a professional introduction email to {customer_name} from {company_name}. We are a spice and binder manufacturer. Keep it concise and professional.",
                'tr': f"{company_name} şirketinden {customer_name} kişisine profesyonel bir tanışma maili yaz. Biz bir baharat ve bağlayıcı üreticisiyiz. Kısa ve profesyonel tut.",
                'de': f"Schreiben Sie eine professionelle Einführungs-E-Mail an {customer_name} von {company_name}. Wir sind ein Gewürz- und Binderhersteller. Halten Sie es kurz und professionell."
            },
            'follow_up': {
                'en': f"Write a follow-up email to {customer_name} from {company_name}. Reference our previous meeting/call. Ask about their decision and offer assistance.",
                'tr': f"{company_name}'den {customer_name}'e takip maili yaz. Önceki görüşmemize referans ver. Kararlarını sor ve yardım teklif et.",
                'de': f"Schreiben Sie eine Follow-up-E-Mail an {customer_name} von {company_name}. Beziehen Sie sich auf unser vorheriges Gespräch."
            },
            'quotation': {
                'en': f"Write a quotation/offer email to {customer_name} from {company_name}. {product_info}. Professional tone, include call-to-action.",
                'tr': f"{company_name}'den {customer_name}'e teklif maili yaz. {product_info}. Profesyonel ton, eylem çağrısı ekle.",
                'de': f"Schreiben Sie eine Angebots-E-Mail an {customer_name} von {company_name}. {product_info}."
            },
            'thank_you': {
                'en': f"Write a thank you email to {customer_name} from {company_name} after a successful order/meeting. Express gratitude and mention future collaboration.",
                'tr': f"Başarılı sipariş/görüşme sonrası {company_name}'den {customer_name}'e teşekkür maili yaz. Minnettarlık ifade et ve gelecek işbirliğinden bahset.",
                'de': f"Schreiben Sie eine Dankes-E-Mail an {customer_name} von {company_name} nach einer erfolgreichen Bestellung/Besprechung."
            },
            'promotion': {
                'en': f"Write a promotional email to {customer_name} from {company_name}. Highlight our special offer: {context}. Create urgency.",
                'tr': f"{company_name}'den {customer_name}'e promosyon maili yaz. Özel teklifimizi vurgula: {context}. Aciliyet oluştur.",
                'de': f"Schreiben Sie eine Werbe-E-Mail an {customer_name} von {company_name}. Heben Sie unser Sonderangebot hervor: {context}."
            },
            'reminder': {
                'en': f"Write a gentle reminder email to {customer_name} from {company_name}. {context}. Keep it friendly but professional.",
                'tr': f"{company_name}'den {customer_name}'e nazik bir hatırlatma maili yaz. {context}. Samimi ama profesyonel tut.",
                'de': f"Schreiben Sie eine freundliche Erinnerungs-E-Mail an {customer_name} von {company_name}. {context}."
            }
        }
        
        lang = language if language in ['en', 'tr', 'de'] else 'en'
        prompt_template = email_templates.get(email_type, email_templates['introduction'])
        prompt = prompt_template.get(lang, prompt_template['en'])
        
        if context and email_type not in ['promotion', 'reminder']:
            prompt += f"\n\nAdditional context: {context}"
        
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            system_message = {
                'en': "You are a professional business email writer for a B2B spice manufacturing company. Write concise, professional emails. Include subject line at the start. Format: SUBJECT: [subject]\n\n[email body]\n\nBest regards,\n[Company]",
                'tr': "Sen bir B2B baharat üretim şirketi için profesyonel iş e-postası yazarısın. Kısa ve profesyonel mailler yaz. Başta konu satırı ekle. Format: KONU: [konu]\n\n[mail içeriği]\n\nSaygılarımla,\n[Şirket]",
                'de': "Sie sind ein professioneller Geschäfts-E-Mail-Autor für ein B2B-Gewürzherstellungsunternehmen. Schreiben Sie kurze, professionelle E-Mails. Fügen Sie die Betreffzeile am Anfang hinzu."
            }
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"email-{datetime.now().timestamp()}",
                system_message=system_message.get(lang, system_message['en'])
            ).with_model("gemini", "gemini-2.5-flash")
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            
            # Parse subject and body
            lines = response.strip().split('\n')
            subject = ""
            body_start = 0
            
            for i, line in enumerate(lines):
                if line.upper().startswith('SUBJECT:') or line.upper().startswith('KONU:') or line.upper().startswith('BETREFF:'):
                    subject = line.split(':', 1)[1].strip()
                    body_start = i + 1
                    break
            
            body = '\n'.join(lines[body_start:]).strip()
            
            return {
                "success": True,
                "subject": subject or f"Message from {company_name}",
                "body": body or response,
                "language": lang,
                "email_type": email_type
            }
            
        except Exception as e:
            logger.error(f"AI Email generation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "subject": "",
                "body": ""
            }


class AIChurnPredictor:
    """AI-powered customer churn prediction"""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def analyze_customer(self, customer_data: Dict, orders: List[Dict]) -> Dict:
        """Analyze customer data and predict churn risk"""
        
        # Calculate basic metrics
        if not orders:
            return {
                "risk_level": "unknown",
                "risk_score": 0,
                "reason": "No order history",
                "recommendation": "New customer - establish relationship",
                "days_since_last_order": None
            }
        
        # Sort orders by date
        sorted_orders = sorted(orders, key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Calculate days since last order
        last_order_date = sorted_orders[0].get('created_at', '')
        if last_order_date:
            try:
                if isinstance(last_order_date, str):
                    last_date = datetime.fromisoformat(last_order_date.replace('Z', '+00:00'))
                else:
                    last_date = last_order_date
                days_since = (datetime.now(timezone.utc) - last_date).days
            except:
                days_since = 0
        else:
            days_since = 0
        
        # Calculate order frequency and total value
        total_value = sum(
            float(o.get('amount', 0) or 0) * float(o.get('unit_price', 0) or 0) 
            for o in orders
        )
        order_count = len(orders)
        avg_order_value = total_value / order_count if order_count > 0 else 0
        
        # Simple rule-based churn scoring
        risk_score = 0
        reasons = []
        
        if days_since > 90:
            risk_score += 40
            reasons.append(f"{days_since} days since last order")
        elif days_since > 60:
            risk_score += 25
            reasons.append(f"{days_since} days since last order")
        elif days_since > 30:
            risk_score += 10
            reasons.append(f"{days_since} days since last order")
        
        if order_count < 3:
            risk_score += 20
            reasons.append("Low order frequency")
        
        if avg_order_value < 1000:
            risk_score += 15
            reasons.append("Low average order value")
        
        # Determine risk level
        if risk_score >= 50:
            risk_level = "high"
            recommendation = "Immediate action required - Call customer today"
        elif risk_score >= 30:
            risk_level = "medium"
            recommendation = "Schedule follow-up call this week"
        else:
            risk_level = "low"
            recommendation = "Customer is engaged - Maintain regular contact"
        
        # Use AI for detailed analysis if high risk
        ai_analysis = None
        if risk_score >= 30 and self.api_key:
            try:
                from emergentintegrations.llm.chat import LlmChat, UserMessage
                
                chat = LlmChat(
                    api_key=self.api_key,
                    session_id=f"churn-{customer_data.get('id', 'unknown')}",
                    system_message="You are a sales analyst. Provide brief, actionable advice for customer retention. Maximum 2-3 sentences."
                ).with_model("gemini", "gemini-2.5-flash")
                
                prompt = f"""Customer: {customer_data.get('company_name')}
Last order: {days_since} days ago
Total orders: {order_count}
Total value: €{total_value:.2f}
Risk factors: {', '.join(reasons)}

What specific action should sales team take?"""
                
                message = UserMessage(text=prompt)
                ai_analysis = await chat.send_message(message)
                
            except Exception as e:
                logger.error(f"AI analysis error: {e}")
        
        return {
            "risk_level": risk_level,
            "risk_score": min(100, risk_score),
            "reasons": reasons,
            "recommendation": recommendation,
            "ai_analysis": ai_analysis,
            "days_since_last_order": days_since,
            "total_orders": order_count,
            "total_value": round(total_value, 2),
            "avg_order_value": round(avg_order_value, 2)
        }
    
    async def get_at_risk_customers(self, customers: List[Dict], orders_by_customer: Dict) -> List[Dict]:
        """Get list of customers at risk of churning"""
        at_risk = []
        
        for customer in customers:
            customer_orders = orders_by_customer.get(customer.get('id'), [])
            analysis = await self.analyze_customer(customer, customer_orders)
            
            if analysis['risk_level'] in ['high', 'medium']:
                at_risk.append({
                    **customer,
                    'churn_analysis': analysis
                })
        
        # Sort by risk score descending
        at_risk.sort(key=lambda x: x['churn_analysis']['risk_score'], reverse=True)
        return at_risk


class AIRecipeOptimizer:
    """AI-powered recipe optimization for cost reduction"""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def optimize_recipe(self, recipe: Dict, target: str = 'cost') -> Dict:
        """Optimize a recipe for cost, taste, or production efficiency"""
        
        if not self.api_key:
            return {
                "success": False,
                "error": "AI service not available"
            }
        
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            system_message = """You are a food industry recipe optimization expert specializing in meat products (döner, gyros, kebab).
Provide practical suggestions for recipe improvements. Be specific with percentages and alternatives.
Format your response as:
SUGGESTION 1: [title]
- Details...

SUGGESTION 2: [title]
- Details...

ESTIMATED SAVINGS: [percentage or amount]"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"recipe-{recipe.get('id', 'unknown')}",
                system_message=system_message
            ).with_model("gemini", "gemini-2.5-flash")
            
            recipe_info = f"""Recipe: {recipe.get('name', 'Unknown')}
Meat: {recipe.get('meat_kg', 0)} kg
Water: {recipe.get('water_l', 0)} L
Spice Mix: {recipe.get('spice_kg', 0)} kg
Binding Agent: {recipe.get('binding_kg', 0)} kg
Mixing Time: {recipe.get('mixing_time_min', 0)} minutes
Motor Speed: {recipe.get('motor_speed_rpm', 0)} RPM

Optimization target: {target}
Suggest improvements to reduce costs while maintaining quality."""
            
            message = UserMessage(text=recipe_info)
            response = await chat.send_message(message)
            
            return {
                "success": True,
                "original_recipe": recipe.get('name'),
                "optimization_target": target,
                "suggestions": response,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Recipe optimization error: {e}")
            return {
                "success": False,
                "error": str(e)
            }


class AIChatbot:
    """AI-powered chatbot for B2B factory-to-factory business assistant"""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
        self.chat_sessions = {}
    
    async def chat(
        self, 
        session_id: str, 
        message: str, 
        language: str = 'en',
        context: Dict = None
    ) -> Dict:
        """Process a chat message and return AI response"""
        
        if not self.api_key:
            return {
                "success": False,
                "response": "AI service not available",
                "session_id": session_id
            }
        
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            system_messages = {
                'en': """You are an AI business assistant for Gewürzberg GmbH, a B2B spice and binder MANUFACTURER based in Berlin.

IMPORTANT CONTEXT:
- We are a FACTORY that manufactures spices, binders, and seasonings
- Our customers are OTHER FACTORIES: meat processing plants, döner/gyros factories, food manufacturers
- We sell in bulk/wholesale quantities to other businesses, NOT to consumers
- We provide technical support for industrial recipes

You can help with:
- Product information (industrial spices, binders, döner/gyros/kebab seasonings)
- Recipe development and optimization for factories
- Technical questions about meat processing, binding agents, seasoning ratios
- Market research and competitor analysis
- Finding new factory customers
- General business questions and ANY topic the user asks about
- Web research when asked (simulate research capabilities)

You are a knowledgeable B2B sales and technical assistant. Be helpful, professional, and thorough.
When asked to research something, provide detailed, useful information.
Answer in the user's language.""",

                'tr': """Sen Berlin merkezli bir B2B baharat ve bağlayıcı ÜRETİCİSİ olan Gewürzberg GmbH için bir AI iş asistanısın.

ÖNEMLİ BAĞLAM:
- Biz baharat, bağlayıcı ve çeşni ÜRETEN bir FABRİKAYIZ
- Müşterilerimiz DİĞER FABRİKALAR: et işleme tesisleri, döner/gyros fabrikaları, gıda üreticileri
- Toptan/büyük miktarlarda diğer işletmelere satış yapıyoruz, tüketicilere DEĞİL
- Endüstriyel reçeteler için teknik destek sağlıyoruz

Yardımcı olabileceğin konular:
- Ürün bilgisi (endüstriyel baharatlar, bağlayıcılar, döner/gyros/kebap çeşnileri)
- Fabrikalar için reçete geliştirme ve optimizasyon
- Et işleme, bağlayıcı maddeler, çeşni oranları hakkında teknik sorular
- Pazar araştırması ve rakip analizi
- Yeni fabrika müşterileri bulma
- Genel iş soruları ve kullanıcının sorduğu HER KONUDA yardım
- İstendiğinde web araştırması (araştırma yeteneklerini simüle et)

Sen bilgili bir B2B satış ve teknik asistanısın. Yardımcı, profesyonel ve kapsamlı ol.
Araştırma yapman istendiğinde, detaylı ve faydalı bilgi ver.
Kullanıcının dilinde cevap ver.""",

                'de': """Sie sind ein KI-Geschäftsassistent für Gewürzberg GmbH, einen B2B-Gewürz- und Binder-HERSTELLER mit Sitz in Berlin.

WICHTIGER KONTEXT:
- Wir sind eine FABRIK, die Gewürze, Binder und Würzmittel herstellt
- Unsere Kunden sind ANDERE FABRIKEN: Fleischverarbeitungsbetriebe, Döner/Gyros-Fabriken, Lebensmittelhersteller
- Wir verkaufen in Großmengen an andere Unternehmen, NICHT an Verbraucher
- Wir bieten technischen Support für industrielle Rezepturen

Sie können helfen bei:
- Produktinformationen (industrielle Gewürze, Binder, Döner/Gyros/Kebab-Würzmittel)
- Rezeptentwicklung und -optimierung für Fabriken
- Technische Fragen zur Fleischverarbeitung, Bindemittel, Würzverhältnisse
- Marktforschung und Wettbewerbsanalyse
- Neue Fabrikkunden finden
- Allgemeine Geschäftsfragen und JEDES Thema, das der Benutzer fragt
- Web-Recherche auf Anfrage

Sie sind ein kompetenter B2B-Vertriebs- und Technikassistent. Seien Sie hilfreich, professionell und gründlich.
Antworten Sie in der Sprache des Benutzers.""",

                'pl': """Jesteś asystentem biznesowym AI dla Gewürzberg GmbH, B2B PRODUCENTA przypraw i wiązek z siedzibą w Berlinie.

WAŻNY KONTEKST:
- Jesteśmy FABRYKĄ produkującą przyprawy, wiązki i przyprawy
- Nasi klienci to INNE FABRYKI: zakłady przetwórstwa mięsa, fabryki döner/gyros, producenci żywności
- Sprzedajemy hurtowo innym firmom, NIE konsumentom
- Zapewniamy wsparcie techniczne dla receptur przemysłowych

Możesz pomóc w:
- Informacje o produktach (przemysłowe przyprawy, wiązki, przyprawy döner/gyros/kebab)
- Rozwój i optymalizacja receptur dla fabryk
- Pytania techniczne o przetwórstwo mięsa, środki wiążące, proporcje przypraw
- Badania rynku i analiza konkurencji
- Znajdowanie nowych klientów-fabryk
- Ogólne pytania biznesowe i KAŻDY temat, o który pyta użytkownik
- Badania internetowe na żądanie

Jesteś kompetentnym asystentem sprzedaży B2B i technicznym. Bądź pomocny, profesjonalny i dokładny.
Odpowiadaj w języku użytkownika."""
            }
            
            lang = language if language in system_messages else 'en'
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=system_messages[lang]
            ).with_model("gemini", "gemini-2.0-flash")
            
            # Add context if provided
            full_message = message
            if context:
                context_str = f"\n\nContext: {context}"
                full_message = message + context_str
            
            user_message = UserMessage(text=full_message)
            response = await chat.send_message(user_message)
            
            return {
                "success": True,
                "response": response,
                "session_id": session_id,
                "language": lang
            }
            
        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            return {
                "success": False,
                "response": f"Error: {str(e)}",
                "session_id": session_id
            }


# Initialize services
email_assistant = AIEmailAssistant()
churn_predictor = AIChurnPredictor()
recipe_optimizer = AIRecipeOptimizer()
chatbot = AIChatbot()
