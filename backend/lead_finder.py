"""
Lead Finder Module - Uses Gemini AI for real-time factory search
Specialized for finding REAL Döner/Gyros/Kebab production factories
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


# Known REAL German Döner factories database
KNOWN_GERMAN_FACTORIES = [
    {"company_name": "Polat Dönerproduktion GmbH", "city": "Mönchengladbach", "business_type": "Döner Production Factory", "notes": "Since 1996, first EC certified in NRW"},
    {"company_name": "ÖZTAS Fleischhandel & Dönerproduktion e.K.", "city": "Moers", "business_type": "Döner & Meat Processing", "notes": "40+ tons daily, since 1994"},
    {"company_name": "AVRASYA DönerProduktion & Fleischgrosshandels GmbH", "city": "Düsseldorf", "business_type": "Döner Production Factory"},
    {"company_name": "AKGÜL Fleischhandel & Doner Produktion", "city": "Viersen", "business_type": "Döner & Meat Trade"},
    {"company_name": "Frostpack Geflügelverarbeitung GmbH", "city": "Paderborn", "business_type": "Poultry Processing"},
    {"company_name": "Zirve Dönerproduktion Ltd.", "city": "Essen", "business_type": "Döner Production"},
    {"company_name": "Ozer Döner Produktion GmbH", "city": "Heinsberg", "business_type": "Döner Production Factory"},
    {"company_name": "Atik Döner GmbH", "city": "Ruhr", "business_type": "Döner Production", "notes": "Leading German producer"},
    {"company_name": "BEY GmbH Dönerproduktion", "city": "Krefeld", "business_type": "Döner Production Factory"},
    {"company_name": "NEFIS Dönerproduktion & Fleischhandels GmbH", "city": "Duisburg", "business_type": "Döner & Meat Trade"},
    {"company_name": "Ercan Donerproduktion GmbH", "city": "NRW", "business_type": "Döner Production Factory"},
    {"company_name": "Kismet Fleisch Döner Produktion", "city": "Köln", "business_type": "Döner & Meat Production", "notes": "Since 2001, 20-49 employees"},
    {"company_name": "Düzgün Food GmbH", "city": "Köln", "business_type": "Döner Production Factory", "notes": "320 employees, 3 plants, 40-60 tons daily"},
    {"company_name": "Tuna Food", "city": "Köln", "business_type": "Food Production"},
    {"company_name": "AC Gastro GmbH", "city": "Köln", "business_type": "Gastro Production", "notes": "5-9 employees"},
    {"company_name": "Öztürk Döner Produktion GmbH & Co.KG", "city": "Waldburg", "business_type": "Döner Production Factory", "notes": "Since 1995, family business"},
    {"company_name": "Birtat / Meat World SE", "city": "Ludwigsburg", "business_type": "Döner & Meat Production", "notes": "35-40 tons daily, 30+ years"},
    {"company_name": "CarnEt Fleisch GmbH", "city": "Stuttgart", "business_type": "Halal Meat Processing", "notes": "Halal certified"},
    {"company_name": "BDK - Berlin Döner Kebab", "city": "Berlin", "business_type": "Döner Production Factory", "notes": "Since 1978, 3 factories, exports to 30 countries"},
    {"company_name": "Kap-lan Dönerproduktion", "city": "Berlin", "business_type": "Döner Production"},
    {"company_name": "Carnivora GmbH", "city": "Berlin", "business_type": "Meat Processing", "notes": "100-199 employees"},
    {"company_name": "Farmers Food", "city": "Germany", "business_type": "Döner Industry Supplier"},
    {"company_name": "Finalta Döner", "city": "Germany", "business_type": "Döner Production"},
    {"company_name": "Narin Döner", "city": "Germany", "business_type": "Döner Production"},
    {"company_name": "Tek Döner", "city": "Berlin", "business_type": "Döner Production", "notes": "Max-Urich-Str. 1-9, 13355 Berlin"},
    {"company_name": "MY FOOD MS GMBH", "city": "Pulheim-Brauweiler", "business_type": "Food Production", "notes": "Since 2009"},
    {"company_name": "Efsane / Kaya Dönerproduktion GmbH", "city": "Wittstock", "business_type": "Döner Production", "notes": "Northwest Berlin, since 2009"},
    {"company_name": "ÖzDöner", "city": "Germany", "business_type": "Döner Production", "notes": "Production in Turkey and Germany"},
    {"company_name": "NUR Helal Döner Produktion GmbH", "city": "Germany", "business_type": "Halal Döner Production", "notes": "30+ years, Halal certified"},
    {"company_name": "Namm Helal Döner und Fleischhandel", "city": "Germany", "business_type": "Halal Döner & Meat Trade"},
    {"company_name": "Tadim Döner GmbH", "city": "Velten", "business_type": "Döner Production Factory"},
    {"company_name": "Kama Dönerproduktion", "city": "Barenthin", "business_type": "Döner Production"},
    {"company_name": "Yeni Istikbal Kebab GmbH", "city": "Treuen", "business_type": "Kebab Production Factory"},
    {"company_name": "ADIM Dönerproduktion GmbH", "city": "Großröhrsdorf", "business_type": "Döner Production Factory"},
    {"company_name": "Dündar Dönerproduktion", "city": "Neunkirchen", "business_type": "Döner Production"},
    {"company_name": "Tekdemir GmbH Kebab-Produktion", "city": "Saarbrücken", "business_type": "Kebab Production Factory"},
    {"company_name": "Euro Döner GmbH & Co. KG", "city": "Eisenach", "business_type": "Döner Production Factory"},
    {"company_name": "Dostlar Group", "city": "Germany", "business_type": "Döner Production", "notes": "2 plants, since 1999"},
    {"company_name": "Öztek Döner Vertriebs GmbH", "city": "Germany", "business_type": "Döner Distribution", "notes": "Since 2010, Halal"},
    {"company_name": "Eroğlu Döner GmbH & Co. KG", "city": "Germany", "business_type": "Döner Production", "notes": "19+ years"},
    {"company_name": "ADA Food", "city": "Germany", "business_type": "Food Production"},
    {"company_name": "Mamado Ready Doner", "city": "Germany", "business_type": "Ready Döner Production"},
    {"company_name": "Avrupa Kebap", "city": "Köthen", "business_type": "Kebab Production"},
    {"company_name": "YOLDAS Dönerproduktion GmbH", "city": "Germany", "business_type": "Döner Production Factory"},
    {"company_name": "TEKDEMIR Dönerproduktion GmbH", "city": "Germany", "business_type": "Döner Production Factory"},
    {"company_name": "ÖZ Ustam GmbH", "city": "Germany", "business_type": "Döner Production"},
    {"company_name": "First Orient-Food GmbH", "city": "Germany", "business_type": "Oriental Food Production"},
    {"company_name": "Doner&Fleisch Großhandel Ozgun Deniz Cam", "city": "Germany", "business_type": "Döner & Meat Wholesale"},
]


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
        """Search for potential leads - combines known factories with AI search"""
        leads = []
        
        # For Germany, first add known REAL factories
        if country.lower() == "germany":
            leads = self._get_known_factories(location, country, limit)
        
        # Then enhance with AI search for more results
        if self.api_key and len(leads) < limit:
            try:
                ai_leads = await self._search_with_gemini(keywords, location, country, limit - len(leads))
                leads.extend(ai_leads)
            except Exception as e:
                logger.error(f"AI search failed: {e}")
        
        return leads[:limit]
    
    def _get_known_factories(self, location: str, country: str, limit: int) -> List[FoundLead]:
        """Get factories from known database"""
        leads = []
        location_lower = location.lower() if location else ""
        
        for factory in KNOWN_GERMAN_FACTORIES:
            # Filter by location if specified
            if location_lower and location_lower != "all":
                factory_city = (factory.get("city", "") or "").lower()
                if location_lower not in factory_city and factory_city not in location_lower:
                    # Also check region matches (e.g., "NRW" contains multiple cities)
                    nrw_cities = ["köln", "düsseldorf", "duisburg", "essen", "dortmund", "moers", "krefeld", "mönchengladbach", "viersen"]
                    if location_lower == "nrw" or factory_city == "nrw":
                        if location_lower not in nrw_cities and factory_city not in nrw_cities:
                            continue
                    else:
                        continue
            
            lead = FoundLead(
                company_name=factory["company_name"],
                city=factory.get("city", ""),
                country="Germany",
                business_type=factory.get("business_type", "Döner Production"),
                notes=factory.get("notes", "Verified Factory")
            )
            leads.append(lead)
            
            if len(leads) >= limit:
                break
        
        return leads
    
    async def _search_with_gemini(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """AI search for additional factories not in database"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            country_lower = country.lower()
            
            # Country-specific search terms
            if country_lower in ['greece', 'cyprus']:
                search_focus = "gyros production, souvlaki manufacturing, κρεατοσκευάσματα"
                factory_examples = "Gyros Manufacturing S.A., Souvlaki Production Ltd."
            elif country_lower in ['turkey']:
                search_focus = "döner fabrikası, et işleme tesisi, kebap üretim"
                factory_examples = "XYZ Döner Üretim A.Ş., ABC Et Sanayi Ltd."
            elif country_lower in ['netherlands', 'belgium']:
                search_focus = "döner productie, vleesverwerking, kebab fabriek"
                factory_examples = "Döner Production B.V., Kebab Manufacturing N.V."
            else:
                search_focus = "Döner Produktion, Fleischverarbeitung, Kebab Herstellung"
                factory_examples = "XYZ Dönerproduktion GmbH, ABC Fleischwerk AG"
            
            location_str = f"in {location}" if location and location.lower() != 'all' else f"across"
            
            system_prompt = f"""You are a B2B research expert specialized in the European döner/kebab/gyros MANUFACTURING industry.

CRITICAL: You must ONLY return actual PRODUCTION FACTORIES - companies that MANUFACTURE döner/gyros/kebab meat products in industrial quantities.

STRICT RULES:
1. ONLY include companies with legal suffixes: GmbH, GmbH & Co. KG, AG, e.K., Ltd., S.A., A.Ş., B.V., N.V.
2. Company name MUST contain production-related words: Produktion, Production, Fleisch, Meat, Food, Manufacturing, Verarbeitung, Processing
3. NEVER include: restaurants, imbiss, grill, bistro, takeaway, delivery, fast food, retail shops
4. These are B2B wholesale manufacturers selling to restaurants - NOT restaurants themselves
5. Look for companies in industrial areas, not shopping districts

SEARCH: {search_focus}
LOCATION: {location_str} {country}
EXAMPLE NAMES: {factory_examples}

Return JSON array ONLY:
[
  {{"company_name": "FULL LEGAL NAME with GmbH/Ltd/etc", "city": "City", "country": "{country}", "business_type": "Döner Production Factory / Meat Processing Plant / etc", "phone": "local format or empty"}}
]

Return 10-20 REAL manufacturing companies. NO explanation needed."""

            user_prompt = f"""Find döner/gyros/kebab PRODUCTION FACTORIES {location_str} {country}.

These are INDUSTRIAL MEAT PROCESSING plants that manufacture döner/gyros for wholesale.
They buy TONS of spices and ingredients - not retail customers.

ONLY companies with: GmbH, AG, Ltd, S.A., A.Ş., e.K., B.V. in name
ONLY factories/plants - NO restaurants, NO shops

JSON array only:"""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"factory-search-{country}-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-flash-lite")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=30.0
            )
            
            return self._parse_response(response, country, location)
            
        except asyncio.TimeoutError:
            logger.warning("Gemini API timeout")
            return []
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
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
                        company_name = item.get('company_name', '').strip()
                        btype = (item.get('business_type', '') or '').lower()
                        combined = f"{company_name.lower()} {btype}"
                        
                        # STRICT exclusion of restaurants
                        excluded = ['restaurant', 'eatery', 'diner', 'cafe', 'bistro', 'takeaway', 
                                   'delivery', 'fast food', 'shop', 'store', 'market', 'retail',
                                   'grill', 'kitchen', 'pizzeria', 'taverna', 'kebab house',
                                   'imbiss', 'snack', 'bar', 'lokanta', 'ocakbaşı', 'express',
                                   'döner haus', 'gyros haus', 'kebab haus', 'house of']
                        
                        if any(term in combined for term in excluded):
                            continue
                        
                        # MUST have legal suffix
                        legal_suffixes = ['gmbh', 'ag', 'e.k.', 'ltd', 's.a.', 'a.ş.', 'a.s.', 
                                         'b.v.', 'n.v.', 'sp.', 'co. kg', '& co', 'se', 'ohg', 'kg']
                        
                        has_legal = any(suffix in company_name.lower() for suffix in legal_suffixes)
                        
                        # MUST have factory/production indicator
                        factory_terms = ['produktion', 'production', 'fleisch', 'meat', 'food',
                                        'manufacturing', 'verarbeitung', 'processing', 'fabrik',
                                        'factory', 'werk', 'üretim', 'sanayi', 'döner', 'gyros', 'kebab']
                        
                        has_factory = any(term in combined for term in factory_terms)
                        
                        if has_legal and has_factory:
                            city = item.get('city', '')
                            if not city or city.lower() == 'all':
                                city = location if location and location.lower() != 'all' else ''
                            
                            lead = FoundLead(
                                company_name=company_name,
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
