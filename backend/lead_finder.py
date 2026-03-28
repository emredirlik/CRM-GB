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
            
            # Build keyword string for search
            keyword_str = ', '.join(keywords) if keywords else 'gyros, döner, kebab, meat processing'
            
            # Handle "All" cities
            location_str = f"in {location}" if location and location.lower() != 'all' else f"across all major cities in"
            
            system_prompt = f"""You are a business intelligence expert. Your task is to find REAL manufacturing facilities and factories.

CRITICAL RULES:
1. Return ONLY actual factories, production plants, and manufacturing facilities
2. Do NOT include restaurants, shops, fast food chains, or retail stores
3. Do NOT include takeaway/delivery businesses
4. Focus on: meat processing plants, food production factories, industrial manufacturers
5. Include realistic contact details when available
6. Return companies that would BUY spices, binders, and seasonings in bulk

Search for: {keyword_str}
Location: {location_str} {country}

Return a JSON array with this exact format:
[
  {{
    "company_name": "ACTUAL COMPANY NAME",
    "business_type": "Type of Factory (e.g., Meat Processing Factory, Döner Production Plant, Food Manufacturing)",
    "phone": "+XX XXX XXXX (realistic local format)",
    "address": "Full industrial address",
    "city": "City name",
    "country": "{country}",
    "website": "www.company.com or N/A"
  }}
]

IMPORTANT:
- Return 15-25 factories
- Only REAL manufacturing businesses
- Include industrial addresses (not shop addresses)
- Use realistic local phone formats
- business_type MUST contain: factory, plant, production, manufacturing, industrial, or processing"""

            user_prompt = f"""Find {keyword_str} FACTORIES (manufacturing plants) {location_str} {country}.

Remember: ONLY manufacturing facilities that would buy industrial quantities of spices and ingredients.
NO restaurants, NO shops, NO retail. ONLY factories and production plants.

Return JSON array only, no explanation."""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"factory-search-{country}-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.0-flash")
            
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
            ).with_model("gemini", "gemini-2.0-flash")
            
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
                        
                        # Exclude restaurants and retail
                        excluded_terms = ['restaurant', 'eatery', 'diner', 'cafe', 'bistro', 'takeaway', 
                                         'delivery', 'fast food', 'shop', 'store', 'market', 'retail',
                                         'grill', 'kitchen', 'pizzeria', 'taverna', 'kebab house']
                        
                        is_excluded = any(term in btype or term in company_name for term in excluded_terms)
                        
                        # Must be a factory/plant
                        factory_terms = ['factory', 'plant', 'manufacturing', 'production', 'industrial', 
                                        'processing', 'fabrik', 'üretim', 'sanayi', 'werk', 'fabryka',
                                        's.a.', 'a.s.', 'gmbh', 'ag', 'ltd', 'bv', 'sa']
                        
                        is_factory = any(term in btype or term in company_name for term in factory_terms)
                        
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
