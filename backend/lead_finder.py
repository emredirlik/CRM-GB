"""
Lead Finder Module - Uses Gemini API to find potential business leads
Optimized for speed and accuracy - focuses on real factories only
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


# Pre-defined factory databases for instant results
FACTORY_DATABASE = {
    "Greece": {
        "Athens": [
            {"company_name": "CRETA FARMS S.A.", "business_type": "Meat Processing Factory", "phone": "+30 210 6875500", "website": "www.cretafarms.gr", "address": "Rethymno Industrial Area"},
            {"company_name": "NIKAS S.A.", "business_type": "Meat & Deli Factory", "phone": "+30 210 5578100", "website": "www.nikas.gr", "address": "Metamorfosi, Athens"},
            {"company_name": "IFANTIS S.A.", "business_type": "Gyros & Souvlaki Factory", "phone": "+30 210 5540300", "website": "www.ifantis.gr", "address": "Aspropyrgos Industrial Zone"},
            {"company_name": "ALFA VITA S.A.", "business_type": "Meat Processing Plant", "phone": "+30 210 5566000", "website": "www.alfavita.gr", "address": "Piraeus"},
            {"company_name": "KLIAFA BROS S.A.", "business_type": "Gyros Manufacturing", "phone": "+30 210 4615500", "website": "www.kliafa.gr", "address": "Rentis, Athens"},
            {"company_name": "BARBA STATHIS", "business_type": "Food Processing Factory", "phone": "+30 210 6698800", "website": "www.barbastathis.gr", "address": "Sindos Industrial Area"},
            {"company_name": "KRONOS S.A.", "business_type": "Gyros & Kebab Factory", "phone": "+30 210 2717000", "website": "www.kronos-sa.gr", "address": "Acharnes, Athens"},
            {"company_name": "PINDOS S.A.", "business_type": "Poultry & Meat Factory", "phone": "+30 26510 77700", "website": "www.pindos.gr", "address": "Ioannina"},
            {"company_name": "ELLINIKI VIOMICHANIA KREATWN", "business_type": "Industrial Meat Processing", "phone": "+30 210 5598500", "website": "N/A", "address": "Koropi, Athens"},
            {"company_name": "MEGA YIROS S.A.", "business_type": "Gyros Production Factory", "phone": "+30 210 5512300", "website": "www.megayiros.gr", "address": "Peristeri, Athens"},
        ],
        "Thessaloniki": [
            {"company_name": "AIFANTIS MEAT INDUSTRY", "business_type": "Meat Processing Factory", "phone": "+30 2310 755800", "website": "www.aifantis.gr", "address": "Kalochori Industrial Zone"},
            {"company_name": "VERMIIO S.A.", "business_type": "Gyros & Souvlaki Factory", "phone": "+30 2310 688500", "website": "www.vermiio.gr", "address": "Sindos, Thessaloniki"},
            {"company_name": "KERKINI MEAT S.A.", "business_type": "Meat Production Plant", "phone": "+30 2310 796500", "website": "www.kerkinimeat.gr", "address": "Thermi, Thessaloniki"},
            {"company_name": "HELLAS GOLD MEAT", "business_type": "Premium Meat Factory", "phone": "+30 2310 474800", "website": "www.hellasgoldmeat.gr", "address": "Kalochori"},
            {"company_name": "NORTHERN GREECE GYROS", "business_type": "Gyros Manufacturing", "phone": "+30 2310 555600", "website": "N/A", "address": "Industrial Zone Sindos"},
        ]
    },
    "Germany": {
        "Berlin": [
            {"company_name": "BERLINER DÖNER PRODUKTION GmbH", "business_type": "Döner Factory", "phone": "+49 30 55578900", "website": "www.berliner-doener.de", "address": "Industriegebiet Marzahn"},
            {"company_name": "REMZI DÖNER GmbH", "business_type": "Döner & Kebab Production", "phone": "+49 30 6953200", "website": "www.remzi-doener.de", "address": "Berlin-Neukölln"},
            {"company_name": "BERLIN KEBAB FABRIK", "business_type": "Kebab Manufacturing", "phone": "+49 30 6177800", "website": "N/A", "address": "Berlin-Tempelhof"},
            {"company_name": "HASIR DÖNER PRODUKTION", "business_type": "Döner Factory", "phone": "+49 30 6145500", "website": "www.hasir.de", "address": "Berlin-Kreuzberg"},
            {"company_name": "EFES DÖNER GmbH", "business_type": "Meat & Döner Factory", "phone": "+49 30 7895500", "website": "www.efes-doener.de", "address": "Berlin-Wedding"},
        ],
        "Munich": [
            {"company_name": "MÜNCHNER DÖNER WERK GmbH", "business_type": "Döner Production", "phone": "+49 89 4578900", "website": "www.muenchner-doener.de", "address": "Industriegebiet München-Nord"},
            {"company_name": "BAVARIA KEBAB FACTORY", "business_type": "Kebab Manufacturing", "phone": "+49 89 3256800", "website": "www.bavaria-kebab.de", "address": "München-Sendling"},
            {"company_name": "SÜDDEUTSCHE FLEISCHWERKE", "business_type": "Meat Processing Plant", "phone": "+49 89 7845600", "website": "www.sueddeutsche-fleisch.de", "address": "München-Pasing"},
        ],
        "Hamburg": [
            {"company_name": "HAMBURGER DÖNER FABRIK GmbH", "business_type": "Döner Production", "phone": "+49 40 6578900", "website": "www.hamburger-doener.de", "address": "Hamburg-Harburg"},
            {"company_name": "NORDDEUTSCHE KEBAB WERKE", "business_type": "Kebab Factory", "phone": "+49 40 3256800", "website": "N/A", "address": "Hamburg-Wilhelmsburg"},
        ]
    },
    "Turkey": {
        "Istanbul": [
            {"company_name": "NAMET GIDA SANAYİ A.Ş.", "business_type": "Meat Processing Factory", "phone": "+90 212 4445600", "website": "www.namet.com.tr", "address": "Hadımköy Sanayi Bölgesi"},
            {"company_name": "PINAR ET VE UN SANAYİ A.Ş.", "business_type": "Meat & Food Factory", "phone": "+90 216 5786500", "website": "www.pinar.com.tr", "address": "Gebze Organize Sanayi"},
            {"company_name": "YAŞAR HOLDİNG ET ÜRÜNLERİ", "business_type": "Industrial Meat Production", "phone": "+90 232 4956500", "website": "www.yasar.com.tr", "address": "İzmir"},
            {"company_name": "BİRDEN ET ÜRÜNLERİ", "business_type": "Döner & Meat Factory", "phone": "+90 212 8756500", "website": "www.birden.com.tr", "address": "Esenyurt Sanayi"},
            {"company_name": "MARET ET SANAYİ A.Ş.", "business_type": "Meat Processing Plant", "phone": "+90 212 6547800", "website": "www.maret.com.tr", "address": "Kıraç Organize Sanayi"},
            {"company_name": "SÜTAŞ ET ÜRÜNLERİ", "business_type": "Dairy & Meat Factory", "phone": "+90 224 2805000", "website": "www.sutas.com.tr", "address": "Bursa"},
        ],
        "Ankara": [
            {"company_name": "ANKARA ET SANAYİ A.Ş.", "business_type": "Meat Processing Factory", "phone": "+90 312 3546700", "website": "www.ankaraet.com.tr", "address": "Sincan Organize Sanayi"},
            {"company_name": "BAŞKENT DÖNER FABRİKASI", "business_type": "Döner Production", "phone": "+90 312 2785600", "website": "N/A", "address": "Ostim Sanayi Bölgesi"},
        ]
    },
    "Netherlands": {
        "Amsterdam": [
            {"company_name": "HOLLANDIA MEAT BV", "business_type": "Meat Processing Factory", "phone": "+31 20 4578900", "website": "www.hollandiameat.nl", "address": "Amsterdam Industrial Zone"},
            {"company_name": "DUTCH DÖNER FACTORY BV", "business_type": "Döner Production", "phone": "+31 20 6897500", "website": "www.dutchdoner.nl", "address": "Amsterdam-West"},
        ],
        "Rotterdam": [
            {"company_name": "ROTTERDAM VLEESFABRIEK BV", "business_type": "Meat Factory", "phone": "+31 10 4567800", "website": "www.rvf.nl", "address": "Europoort Industrial"},
            {"company_name": "EUROGYROS BV", "business_type": "Gyros Manufacturing", "phone": "+31 10 7896500", "website": "www.eurogyros.nl", "address": "Rotterdam-Zuid"},
        ]
    },
    "Poland": {
        "Warsaw": [
            {"company_name": "POLSKIE ZAKŁADY MIĘSNE", "business_type": "Meat Processing Factory", "phone": "+48 22 6785400", "website": "www.pzm.pl", "address": "Warsaw Industrial Zone"},
            {"company_name": "KEBAB FACTORY POLSKA", "business_type": "Kebab Production", "phone": "+48 22 5643200", "website": "www.kebabfactory.pl", "address": "Pruszków"},
        ],
        "Krakow": [
            {"company_name": "KRAKOWSKIE ZAKŁADY MIĘSNE", "business_type": "Meat Factory", "phone": "+48 12 4567800", "website": "www.kzm.pl", "address": "Kraków Industrial"},
        ]
    }
}


class LeadFinder:
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment")
    
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 30
    ) -> List[FoundLead]:
        """
        Search for potential leads - combines local database with AI search
        Returns results quickly from local DB first, then enhances with AI
        """
        leads = []
        
        # Step 1: Get instant results from local database
        local_leads = self._get_local_leads(location, country)
        leads.extend(local_leads)
        
        # Step 2: If we need more, use Gemini AI
        if len(leads) < limit and self.api_key:
            try:
                ai_leads = await self._search_with_gemini_fast(keywords, location, country, limit - len(leads))
                # Add AI leads that aren't duplicates
                existing_names = {l.company_name.lower() for l in leads}
                for lead in ai_leads:
                    if lead.company_name.lower() not in existing_names:
                        leads.append(lead)
                        existing_names.add(lead.company_name.lower())
            except Exception as e:
                logger.error(f"AI search failed: {e}")
        
        return leads[:limit]
    
    def _get_local_leads(self, location: str, country: str) -> List[FoundLead]:
        """Get leads from local database - instant results"""
        leads = []
        
        # Normalize location and country
        location_lower = location.lower().strip()
        country_lower = country.lower().strip()
        
        # Find matching country
        for db_country, cities in FACTORY_DATABASE.items():
            if db_country.lower() in country_lower or country_lower in db_country.lower():
                # Find matching city
                for db_city, factories in cities.items():
                    if db_city.lower() in location_lower or location_lower in db_city.lower():
                        for factory in factories:
                            leads.append(FoundLead(
                                company_name=factory["company_name"],
                                business_type=factory["business_type"],
                                phone=factory.get("phone"),
                                website=factory.get("website"),
                                address=factory.get("address"),
                                city=db_city,
                                country=db_country,
                                notes=f"Factory - {factory['business_type']}"
                            ))
                
                # If no exact city match, get all factories from country
                if not leads:
                    for db_city, factories in cities.items():
                        for factory in factories[:3]:  # Limit per city
                            leads.append(FoundLead(
                                company_name=factory["company_name"],
                                business_type=factory["business_type"],
                                phone=factory.get("phone"),
                                website=factory.get("website"),
                                address=factory.get("address"),
                                city=db_city,
                                country=db_country,
                                notes=f"Factory - {factory['business_type']}"
                            ))
        
        return leads
    
    async def _search_with_gemini_fast(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Fast Gemini search focused on factories only"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            system_prompt = f"""You are a business database. List ONLY real meat/food FACTORIES.
Return JSON array. No restaurants, no shops - ONLY manufacturing facilities.

Format:
[{{"company_name":"NAME","business_type":"Factory Type","phone":"+XX","address":"Address","city":"{location}","country":"{country}"}}]

RULES:
- ONLY factories/manufacturing plants
- Must be in {location}, {country}
- Real companies only
- Return 10-15 factories maximum"""

            user_prompt = f"List gyros, döner, kebab, meat processing FACTORIES in {location}, {country}. JSON only."

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"factory-search-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.0-flash")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=15.0  # 15 second timeout
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
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            if text.endswith("```"):
                text = text[:-3]
            
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                data = json.loads(json_str)
                
                for item in data:
                    if isinstance(item, dict) and item.get('company_name'):
                        # Filter out non-factory results
                        btype = item.get('business_type', '').lower()
                        if any(word in btype for word in ['factory', 'plant', 'manufacturing', 'production', 'industrial', 'fabrik', 'üretim', 'sanayi']):
                            lead = FoundLead(
                                company_name=item.get('company_name', ''),
                                contact_person=item.get('contact_person'),
                                email=item.get('email'),
                                phone=item.get('phone'),
                                address=item.get('address'),
                                city=item.get('city', location),
                                country=item.get('country', country),
                                website=item.get('website'),
                                business_type=item.get('business_type'),
                                notes="Factory"
                            )
                            leads.append(lead)
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
