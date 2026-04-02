"""
Lead Finder Module - Uses Gemini AI for real-time factory search
NO cached database - only AI-powered real-time search
Finds ONLY manufacturing factories, not restaurants
"""
import os
import json
import logging
import asyncio
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class FoundLead(BaseModel):
    company_name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    business_type: Optional[str] = None
    notes: Optional[str] = None


class LeadFinder:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            logger.warning("No API key found for AI search")
    
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 50,
        ai_only: bool = True
    ) -> List[FoundLead]:
        """
        Search for potential leads using AI only
        No cached database - real-time AI search
        """
        if not self.api_key:
            logger.error("No API key available for search")
            return []
        
        try:
            leads = await self._search_with_gemini(keywords, location, country, limit)
            return leads[:limit]
        except Exception as e:
            logger.error(f"AI search failed: {e}")
            return []
    
    async def _search_with_gemini(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Detailed Gemini search focused on real factories only"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            # Build country-specific search keywords
            country_lower = country.lower()
            
            # Determine search terms based on country
            if country_lower in ['greece', 'cyprus']:
                # Greek-speaking countries: gyros, souvlaki
                search_terms = "gyros üretim fabrikası, souvlaki production factory, meat processing plant, κρεατοσκευάσματα εργοστάσιο"
                product_focus = "gyros, souvlaki, meat products"
            elif country_lower in ['turkey']:
                # Turkey: döner
                search_terms = "döner fabrikası, döner üretim tesisi, et işleme fabrikası, kebap üretim"
                product_focus = "döner, kebab, köfte"
            elif country_lower in ['germany', 'austria', 'switzerland', 'netherlands', 'belgium']:
                # German-speaking/Central Europe: döner produktion
                search_terms = "Döner Produktion, Döner Fabrik, Fleischverarbeitung, Dönerfleisch Hersteller, Gyros Produktion"
                product_focus = "döner, gyros, kebab meat production"
            else:
                # Other countries: mix of terms
                search_terms = "döner production factory, gyros manufacturing plant, kebab meat processing, meat production facility"
                product_focus = "döner, gyros, kebab"
            
            # Handle "All" cities
            location_str = f"in {location}" if location and location.lower() != 'all' else f"across all major cities in"
            
            system_prompt = f"""You are a B2B business intelligence expert for the food industry. Your ONLY task is to find REAL manufacturing facilities that produce döner, gyros, kebab, or processed meat products.

ABSOLUTE RULES - NO EXCEPTIONS:
1. Return ONLY actual FACTORIES, PRODUCTION PLANTS, and MANUFACTURING FACILITIES
2. NEVER include: restaurants, shops, fast food chains, retail stores, takeaway, delivery services, food trucks, grills, bistros, imbiss, snack bars
3. The company MUST be a manufacturer/producer that MAKES döner/gyros/kebab meat products
4. These are B2B wholesale buyers of spices and binders - they produce hundreds or thousands of kg of meat products daily
5. Look for industrial/manufacturing business names with: Produktion, Fabrik, GmbH, A.Ş., S.A., Factory, Manufacturing, Processing, Üretim, Sanayi

SEARCH FOCUS for {country}:
- Search terms: {search_terms}
- Product focus: {product_focus}

VALID EXAMPLES:
- "Döner Produktion Berlin GmbH" ✓ (has Produktion, GmbH)
- "Eurogyros Manufacturing S.A." ✓ (has Manufacturing, S.A.)
- "Istanbul Et Sanayi A.Ş." ✓ (has Sanayi, A.Ş.)

INVALID EXAMPLES - NEVER RETURN THESE:
- "Kebab House Berlin" ✗ (restaurant)
- "Gyros Grill Athens" ✗ (restaurant)
- "Ali's Döner Imbiss" ✗ (fast food)
- "Best Gyros Restaurant" ✗ (restaurant)

Return a JSON array:
[
  {{
    "company_name": "FACTORY NAME (must include GmbH/S.A./A.Ş./Ltd etc)",
    "business_type": "Döner Production Factory / Gyros Manufacturing Plant / Meat Processing",
    "phone": "local format phone",
    "address": "Industrial zone/area address",
    "city": "City",
    "country": "{country}",
    "website": "www.company.com or N/A"
  }}
]

Return 15-25 REAL manufacturing facilities ONLY. No restaurants. No explanation needed."""

            user_prompt = f"""Find döner/gyros/kebab PRODUCTION FACTORIES {location_str} {country}.

These are MANUFACTURING PLANTS that produce processed meat products for the food industry.
They buy industrial quantities (tons) of spices, binders, and seasonings.

ONLY return actual production facilities with legal company names (GmbH, S.A., A.Ş., Ltd, etc.)
ABSOLUTELY NO restaurants, grills, or retail businesses.

Return JSON array only."""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"factory-search-{country}-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-flash-lite")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=30.0  # 30 second timeout for thorough search
            )
            
            return self._parse_response(response, country, location)
            
        except asyncio.TimeoutError:
            logger.warning("Gemini API timeout - trying shorter query")
            return await self._quick_search(keywords, location, country)
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return []
    
    async def _quick_search(
        self, 
        keywords: List[str],
        location: str, 
        country: str
    ) -> List[FoundLead]:
        """Fallback quick search if main search times out"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            keyword_str = ', '.join(keywords[:3]) if keywords else 'meat factory'
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"quick-search-{country}",
                system_message="Return JSON array of 10 meat/food FACTORIES only. No restaurants."
            ).with_model("gemini", "gemini-2.5-flash-lite")
            
            loc = location if location and location.lower() != 'all' else 'major cities'
            message = UserMessage(text=f"List 10 {keyword_str} factories in {loc}, {country}. JSON format: [{{'company_name':'X','business_type':'Y Factory','city':'{location}','country':'{country}'}}]")
            
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=15.0
            )
            
            return self._parse_response(response, country, location)
        except Exception as e:
            logger.error(f"Quick search failed: {e}")
            return []
    
    def _parse_response(self, response: str, country: str, location: str) -> List[FoundLead]:
        """Parse Gemini response into FoundLead objects"""
        leads = []
        try:
            text = response.strip()
            
            # Remove markdown code blocks
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            if text.endswith("```"):
                text = text[:-3]
            
            # Find JSON array
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                data = json.loads(json_str)
                
                for item in data:
                    if isinstance(item, dict) and item.get('company_name'):
                        # Filter out non-factory results
                        btype = (item.get('business_type', '') or '').lower()
                        company_name = (item.get('company_name', '') or '').lower()
                        combined = f"{btype} {company_name}"
                        
                        # STRICT: Exclude restaurants and retail - expanded list
                        excluded_terms = [
                            'restaurant', 'eatery', 'diner', 'cafe', 'bistro', 'takeaway', 
                            'delivery', 'fast food', 'shop', 'store', 'market', 'retail',
                            'grill', 'kitchen', 'pizzeria', 'taverna', 'kebab house', 'kebap house',
                            'imbiss', 'snack', 'bar', 'lokanta', 'lokal', 'ocakbaşı', 'ocakbasi',
                            'mangal', 'steakhouse', 'steak house', 'food truck', 'catering only',
                            'express', 'quick', 'corner', 'point', 'spot', 'place', 'house of',
                            'döner haus', 'doner haus', 'gyros haus', 'kebab haus',
                            'εστιατόριο', 'ταβέρνα', 'ψησταριά', 'σουβλατζίδικο',  # Greek restaurant terms
                            'restoran', 'lokantası', 'büfe', 'kokoreç'  # Turkish restaurant terms
                        ]
                        
                        is_excluded = any(term in combined for term in excluded_terms)
                        
                        # STRICT: Must have factory/manufacturing indicators
                        factory_terms = [
                            'factory', 'plant', 'manufacturing', 'production', 'industrial', 
                            'processing', 'fabrik', 'üretim', 'sanayi', 'werk', 'fabryka',
                            'produktion', 'hersteller', 'verarbeitung', 'fleischwerk',
                            's.a.', 'a.s.', 'a.ş.', 'gmbh', 'ag', 'ltd', 'bv', 'sa', 'sp.',
                            'anonim', 'şirketi', 'εργοστάσιο', 'βιομηχανία',  # Greek: factory, industry
                            'imalat', 'tesisi', 'işletmesi', 'holding'
                        ]
                        
                        is_factory = any(term in combined for term in factory_terms)
                        
                        # Only include if it's clearly a factory and NOT excluded
                        if is_factory and not is_excluded:
                            city = item.get('city', '')
                            if not city or city.lower() == 'all':
                                city = location if location and location.lower() != 'all' else ''
                            
                            lead = FoundLead(
                                company_name=item.get('company_name', ''),
                                contact_person=item.get('contact_person'),
                                email=item.get('email'),
                                phone=item.get('phone'),
                                address=item.get('address'),
                                city=city,
                                country=item.get('country', country),
                                website=item.get('website'),
                                business_type=item.get('business_type'),
                                notes="AI-found Factory"
                            )
                            leads.append(lead)
                        
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
