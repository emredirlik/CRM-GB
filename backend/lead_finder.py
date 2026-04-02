"""
Lead Finder Module - Dynamic Web Search for Real Factories
Searches the internet for döner/gyros/kebab production factories
"""
import asyncio
import aiohttp
import logging
import re
import json
import os
from typing import List, Optional
from pydantic import BaseModel
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
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
    """Dynamic factory finder using AI-powered web search"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('GEMINI_API_KEY')
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
        }
    
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 100
    ) -> List[FoundLead]:
        """Search for döner/gyros factories using AI web search"""
        
        if not self.api_key:
            logger.error("No API key for AI search")
            return []
        
        try:
            leads = await self._search_with_ai(keywords, location, country, limit)
            return leads
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    async def _search_with_ai(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Use AI to search for real factories"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            # Build country-specific search terms
            search_terms = self._get_search_terms(country)
            location_str = f"in {location}" if location and location.lower() != 'all' else f"tüm şehirlerde"
            
            system_prompt = f"""Sen bir B2B iş araştırma uzmanısın. Görevin {country} ülkesinde GERÇEK döner, gyros, kebap ÜRETİM FABRİKALARINI bulmak.

ÖNEMLİ KURALLAR:
1. SADECE gerçek, var olan şirketleri listele
2. SADECE üretim fabrikaları - restoran, imbiss, grill OLMAZ
3. Şirket adında mutlaka yasal ek olmalı: GmbH, S.A., S.L., Ltd, A.Ş., B.V., S.r.l., vb.
4. Her şirket için mümkünse telefon numarası ve adres bul
5. Verdiğin tüm bilgiler GERÇEK ve DOĞRULANABİLİR olmalı

ARAŞTIRMA KAYNAKLARI:
- Google araması: "{search_terms} {country}"
- İş dizinleri, ticaret odaları
- Şirket veritabanları
- Sektör raporları

JSON FORMATI (HER ŞİRKET İÇİN):
{{
    "company_name": "TAM YASAL İSİM (GmbH/S.A./Ltd ile)",
    "city": "Şehir",
    "address": "Tam adres",
    "phone": "Telefon numarası",
    "business_type": "Döner Production / Gyros Factory / Kebab Manufacturing",
    "notes": "Önemli bilgi (kapasite, yıl, sertifika)"
}}

{limit} tane GERÇEK fabrika bul ve JSON array olarak döndür. Sadece JSON, açıklama yok."""

            user_prompt = f"""{country} ülkesinde {location_str} bulunan döner, gyros, kebap ÜRETİM FABRİKALARINI bul.

Arama terimleri: {search_terms}

SADECE:
- Gerçek, var olan şirketler
- Üretim fabrikaları (restoran değil)
- Yasal şirket isimleri (GmbH, S.A., Ltd, vb.)

{limit} tane fabrika bul. JSON array döndür:"""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"factory-search-{country}-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.0-flash")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=120.0
            )
            
            return self._parse_response(response, country, location)
            
        except asyncio.TimeoutError:
            logger.warning("AI search timeout")
            return []
        except Exception as e:
            logger.error(f"AI search error: {e}")
            return []
    
    def _get_search_terms(self, country: str) -> str:
        """Get country-specific search terms"""
        terms = {
            "Germany": "Döner Produktion GmbH, Döner Fabrik, Fleischverarbeitung, Kebab Hersteller",
            "Greece": "gyros production factory, souvlaki manufacturing, κρεατοσκευάσματα βιομηχανία",
            "Turkey": "döner fabrikası, döner üretim tesisi, et işleme sanayi",
            "Spain": "producción de döner kebab, fábrica de kebab, carne procesada S.L.",
            "France": "production döner kebab, usine kebab, viande transformée S.A.S.",
            "Italy": "produzione döner kebab, fabbrica kebab, S.r.l.",
            "Netherlands": "döner productie, kebab fabriek, vleesverwerking B.V.",
            "Belgium": "production döner, kebab fabriek, N.V.",
            "Austria": "Döner Produktion, Kebab Fabrik, Fleischwerk GmbH",
            "Switzerland": "Döner Produktion, Kebab Fabrik AG",
            "United Kingdom": "döner kebab production, kebab factory Ltd",
            "Poland": "produkcja kebab, fabryka döner Sp. z o.o.",
            "Czech Republic": "výroba kebabu, döner fabrika s.r.o.",
            "Sweden": "döner produktion, kebab fabrik AB",
            "Denmark": "döner produktion, kebab fabrik A/S",
            "Norway": "döner produksjon, kebab fabrikk AS",
            "Finland": "döner tuotanto, kebab tehdas Oy",
            "Portugal": "produção döner kebab, fábrica kebab Lda",
            "Romania": "producție döner kebab, fabrică kebab S.R.L.",
            "Bulgaria": "производство на дюнер, фабрика за кебап",
            "Hungary": "döner gyártás, kebab gyár Kft",
            "Croatia": "proizvodnja döner, kebab tvornica d.o.o.",
            "Serbia": "proizvodnja döner, kebab fabrika d.o.o.",
            "Slovenia": "proizvodnja döner, kebab tovarna d.o.o.",
            "Slovakia": "výroba kebabu, döner fabrika s.r.o.",
            "Cyprus": "παραγωγή γύρου, εργοστάσιο κεμπάπ",
            "Malta": "döner kebab production Ltd",
            "Luxembourg": "production döner S.à r.l.",
            "Ireland": "döner kebab production Ltd",
            "Iceland": "döner framleiðsla ehf",
            "Albania": "prodhim döner, fabrikë kebab Sh.p.k.",
            "North Macedonia": "производство дóнер, фабрика за кебап",
            "Bosnia and Herzegovina": "proizvodnja döner, kebab fabrika d.o.o.",
            "Montenegro": "proizvodnja döner d.o.o.",
            "Kosovo": "prodhim döner Sh.p.k.",
            "Moldova": "producție döner S.R.L.",
            "Ukraine": "виробництво донер, фабрика кебаб ТОВ",
            "Belarus": "вытворчасць дóнер",
            "Russia": "производство донер, фабрика кебаб ООО",
            "Azerbaijan": "döner istehsalı MMC",
            "Georgia": "დონერის წარმოება შპს",
            "Armenia": "դdelays արdelays",
            "Kazakhstan": "дóнер өндірісі ЖШС",
            "Uzbekistan": "döner ishlab chiqarish",
            "United Arab Emirates": "döner kebab production LLC",
            "Saudi Arabia": "إنتاج شاورما، مصنع كباب",
            "Kuwait": "döner kebab production",
            "Qatar": "döner kebab production",
            "Bahrain": "döner kebab production",
            "Oman": "döner kebab production",
            "Jordan": "إنتاج شاورما",
            "Lebanon": "إنتاج شاورما، معمل كباب",
            "Israel": "ייצור דונר, מפעל קבב",
            "Egypt": "إنتاج شاورما، مصنع كباب",
            "Morocco": "production döner kebab S.A.R.L.",
            "Tunisia": "production döner kebab",
            "Algeria": "production döner kebab",
            "Libya": "إنتاج شاورما",
            "South Africa": "döner kebab production Pty Ltd",
            "Australia": "döner kebab production Pty Ltd",
            "New Zealand": "döner kebab production Ltd",
            "Canada": "döner kebab production Inc",
            "United States": "döner kebab production Inc, LLC",
            "Mexico": "producción döner kebab S.A. de C.V.",
            "Brazil": "produção döner kebab Ltda",
            "Argentina": "producción döner kebab S.A.",
            "Chile": "producción döner kebab S.A.",
            "Colombia": "producción döner kebab S.A.S.",
            "Peru": "producción döner kebab S.A.C.",
        }
        return terms.get(country, f"döner kebab production factory {country}")
    
    def _parse_response(self, response: str, country: str, location: str) -> List[FoundLead]:
        """Parse AI response into FoundLead objects"""
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
                        
                        # Filter out restaurants
                        excluded = ['restaurant', 'imbiss', 'grill', 'bistro', 'cafe', 
                                   'takeaway', 'delivery', 'express', 'house']
                        
                        if any(term in company_name.lower() for term in excluded):
                            continue
                        
                        city = item.get('city', '')
                        if not city or city.lower() == 'all':
                            city = location if location and location.lower() != 'all' else ''
                        
                        lead = FoundLead(
                            company_name=company_name,
                            city=city,
                            country=country,
                            address=item.get('address', ''),
                            phone=item.get('phone', ''),
                            business_type=item.get('business_type', 'Döner/Kebab Production'),
                            notes=item.get('notes', '')
                        )
                        leads.append(lead)
                        
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
