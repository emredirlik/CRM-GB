"""
Lead Finder Module - Real Business Data via SerpAPI (Google Maps)
Uses Google Maps Local Results to find REAL factories
"""
import asyncio
import logging
import json
import os
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
    """Factory finder using SerpAPI Google Maps for REAL business data"""
    
    def __init__(self):
        self.serpapi_key = os.environ.get('SERPAPI_KEY')
        self.gemini_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('GEMINI_API_KEY')
    
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 100
    ) -> List[FoundLead]:
        """Search for factories using SerpAPI Google Maps"""
        
        # First try SerpAPI for real data
        if self.serpapi_key:
            results = await self._search_with_serpapi(keywords, location, country, limit)
            if results:
                return results
        
        # Fallback to AI if SerpAPI fails
        if self.gemini_key:
            return await self._search_with_ai(keywords, location, country, limit)
        
        return []
    
    async def _search_with_serpapi(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Use SerpAPI Google Maps to find REAL factories"""
        try:
            from serpapi import GoogleSearch
            
            leads = []
            
            # Build search query
            keyword_str = " ".join(keywords[:3])  # Use first 3 keywords
            
            # Location string for Google Maps
            if location and location.lower() != 'all':
                search_location = f"{location}, {country}"
            else:
                search_location = country
            
            # Search queries to try
            search_queries = [
                f"{keyword_str} production {search_location}",
                f"{keyword_str} factory {search_location}",
                f"{keyword_str} manufacturer {search_location}",
            ]
            
            seen_names = set()
            
            for query in search_queries:
                if len(leads) >= limit:
                    break
                    
                try:
                    # Google Maps Local Results
                    params = {
                        "engine": "google_maps",
                        "q": query,
                        "type": "search",
                        "api_key": self.serpapi_key,
                        "hl": "en",
                    }
                    
                    search = GoogleSearch(params)
                    results = search.get_dict()
                    
                    local_results = results.get("local_results", [])
                    
                    for item in local_results:
                        if len(leads) >= limit:
                            break
                        
                        name = item.get("title", "")
                        
                        # Skip duplicates
                        if name.lower() in seen_names:
                            continue
                        seen_names.add(name.lower())
                        
                        # Skip restaurants
                        name_lower = name.lower()
                        if self._is_restaurant(name_lower, item):
                            logger.info(f"Filtered out (restaurant): {name}")
                            continue
                        
                        # Extract data
                        address = item.get("address", "")
                        phone = item.get("phone", "")
                        website = item.get("website", "")
                        
                        # Get city from address
                        city_name = location if location and location.lower() != 'all' else ""
                        if not city_name and address:
                            # Try to extract city from address
                            parts = address.split(",")
                            if len(parts) >= 2:
                                city_name = parts[-2].strip()
                        
                        # Determine business type
                        types = item.get("type", "") or item.get("types", [])
                        if isinstance(types, list):
                            types = ", ".join(types)
                        
                        business_type = self._determine_business_type(name, types, keywords)
                        
                        # Rating and reviews for notes
                        rating = item.get("rating", "")
                        reviews = item.get("reviews", "")
                        notes = ""
                        if rating:
                            notes = f"Rating: {rating}"
                            if reviews:
                                notes += f" ({reviews} reviews)"
                        
                        lead = FoundLead(
                            company_name=name,
                            city=city_name,
                            country=country,
                            address=address,
                            phone=phone,
                            website=website,
                            business_type=business_type,
                            notes=notes or "Google Maps verified"
                        )
                        leads.append(lead)
                        
                except Exception as e:
                    logger.error(f"SerpAPI search error for query '{query}': {e}")
                    continue
            
            # If Google Maps didn't return enough, try Google Search
            if len(leads) < 5:
                google_leads = await self._search_google_organic(keywords, location, country, limit - len(leads))
                for lead in google_leads:
                    if lead.company_name.lower() not in seen_names:
                        leads.append(lead)
                        seen_names.add(lead.company_name.lower())
            
            return leads
            
        except Exception as e:
            logger.error(f"SerpAPI error: {e}")
            return []
    
    async def _search_google_organic(
        self,
        keywords: List[str],
        location: str,
        country: str,
        limit: int
    ) -> List[FoundLead]:
        """Search Google organic results for factory websites"""
        try:
            from serpapi import GoogleSearch
            
            leads = []
            keyword_str = " ".join(keywords[:3])
            
            if location and location.lower() != 'all':
                query = f"{keyword_str} fabrika {location} {country}"
            else:
                query = f"{keyword_str} fabrika {country}"
            
            params = {
                "engine": "google",
                "q": query,
                "api_key": self.serpapi_key,
                "num": min(limit, 20),
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            organic_results = results.get("organic_results", [])
            
            for item in organic_results:
                if len(leads) >= limit:
                    break
                
                title = item.get("title", "")
                link = item.get("link", "")
                snippet = item.get("snippet", "")
                
                # Skip if looks like restaurant
                if self._is_restaurant(title.lower(), {"snippet": snippet}):
                    continue
                
                # Extract company name from title
                company_name = title.split(" - ")[0].split(" | ")[0].strip()
                
                if len(company_name) < 3:
                    continue
                
                lead = FoundLead(
                    company_name=company_name,
                    city=location if location and location.lower() != 'all' else "",
                    country=country,
                    website=link,
                    business_type=self._determine_business_type(company_name, snippet, keywords),
                    notes="Google Search result"
                )
                leads.append(lead)
            
            return leads
            
        except Exception as e:
            logger.error(f"Google organic search error: {e}")
            return []
    
    def _is_restaurant(self, name_lower: str, item: dict) -> bool:
        """Check if business is a restaurant (should be filtered out)"""
        restaurant_indicators = [
            'restaurant', 'imbiss', 'grill', 'bistro', 'takeaway', 'kiosk',
            'fast food', 'dükkan', 'lokanta', 'evi', 'house', 'kitchen',
            'cafe', 'bar', 'pub', 'tavern', 'diner', 'eatery', 'pizzeria',
            'restoran', 'lokal', 'snack', 'express', 'takeout', 'delivery',
            'kebab haus', 'döner haus', 'gyros haus', 'food truck'
        ]
        
        # Check name
        if any(indicator in name_lower for indicator in restaurant_indicators):
            return True
        
        # Check type/category if available
        item_type = str(item.get("type", "")).lower()
        item_types = item.get("types", [])
        if isinstance(item_types, list):
            item_types = " ".join(item_types).lower()
        else:
            item_types = str(item_types).lower()
        
        restaurant_types = ['restaurant', 'food', 'meal', 'takeout', 'delivery', 'cafe']
        if any(rt in item_type or rt in item_types for rt in restaurant_types):
            return True
        
        # Check snippet if available
        snippet = str(item.get("snippet", "")).lower()
        if any(indicator in snippet for indicator in ['menu', 'order online', 'delivery', 'dine in']):
            return True
        
        return False
    
    def _determine_business_type(self, name: str, types: str, keywords: List[str]) -> str:
        """Determine the business type based on name and category"""
        name_lower = name.lower()
        types_lower = types.lower() if types else ""
        keywords_lower = [k.lower() for k in keywords]
        
        if 'döner' in name_lower or 'doner' in name_lower or 'döner' in keywords_lower:
            return "Döner Üretimi"
        elif 'gyros' in name_lower or 'gyros' in keywords_lower:
            return "Gyros Üretimi"
        elif 'kebab' in name_lower or 'kebap' in name_lower or 'kebab' in keywords_lower or 'kebap' in keywords_lower:
            return "Kebap Üretimi"
        elif 'meat' in name_lower or 'fleisch' in name_lower or 'et ' in name_lower:
            return "Et İşleme"
        elif 'food' in name_lower:
            return "Gıda Üretimi"
        elif 'production' in types_lower or 'factory' in types_lower or 'manufacturer' in types_lower:
            return "Üretim Tesisi"
        else:
            return "Fabrika"
    
    async def _search_with_ai(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Fallback: Use AI to search for factories (less reliable)"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            location_str = f"{location} şehrinde" if location and location.lower() != 'all' else "tüm şehirlerde"
            keywords_str = ", ".join(keywords)
            
            system_prompt = f"""Sen bir B2B endüstriyel araştırma uzmanısın. SADECE GERÇEK, VAR OLAN fabrikaları bulacaksın.

## KESİN KURALLAR:

1. **SADECE ÜRETİM TESİSLERİ** - Restoran, imbiss, fast food KESİNLİKLE YASAK
2. **GERÇEK ŞİRKETLER** - İnternette aranabilir, var olan şirketler
3. **YASAL EK GEREKLİ**: GmbH, S.A., S.L., S.R.L., Ltd, A.Ş., vb.

## ÇIKTI FORMATI (JSON Array):
[
  {{"company_name": "Şirket Adı", "city": "Şehir", "phone": "Telefon", "business_type": "Üretim Tipi", "notes": "Bilgi"}}
]

SADECE JSON döndür."""

            user_prompt = f"""{country} ülkesinde {location_str} şu anahtar kelimelere uygun ÜRETİM FABRİKALARI bul:
{keywords_str}

SADECE üretim tesisleri - restoran YASAK. JSON array döndür:"""

            chat = LlmChat(
                api_key=self.gemini_key,
                session_id=f"factory-{country}-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.0-flash")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=90.0
            )
            
            return self._parse_ai_response(response, country, location, limit)
            
        except Exception as e:
            logger.error(f"AI search error: {e}")
            return []
    
    def _parse_ai_response(self, response: str, country: str, location: str, limit: int) -> List[FoundLead]:
        """Parse AI response"""
        leads = []
        
        try:
            text = response.strip()
            
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            if text.endswith("```"):
                text = text[:-3]
            
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                data = json.loads(text[start_idx:end_idx])
                
                for item in data:
                    if not isinstance(item, dict) or not item.get('company_name'):
                        continue
                    
                    if len(leads) >= limit:
                        break
                    
                    lead = FoundLead(
                        company_name=item.get('company_name', ''),
                        city=item.get('city', location if location != 'all' else ''),
                        country=country,
                        address=item.get('address', ''),
                        phone=item.get('phone', ''),
                        business_type=item.get('business_type', 'Fabrika'),
                        notes=item.get('notes', 'AI önerisi - doğrulama gerekir')
                    )
                    leads.append(lead)
                        
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
