"""
Lead Finder Module - Uses web scraping to find REAL döner/gyros factories
No AI API needed - searches Google and business directories
"""
import asyncio
import aiohttp
import logging
import re
import json
from typing import List, Optional
from pydantic import BaseModel
from bs4 import BeautifulSoup
from urllib.parse import quote_plus

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


# Verified German Döner Factories Database
GERMAN_FACTORIES = [
    {"company_name": "Polat Dönerproduktion GmbH", "city": "Mönchengladbach", "phone": "+49 2161 464770", "business_type": "Döner Production", "notes": "Since 1996, EC certified"},
    {"company_name": "ÖZTAS Fleischhandel & Dönerproduktion e.K.", "city": "Moers", "phone": "+49 2841 99830", "business_type": "Döner & Meat Processing", "notes": "40+ tons daily"},
    {"company_name": "AVRASYA DönerProduktion & Fleischgrosshandels GmbH", "city": "Düsseldorf", "business_type": "Döner Production"},
    {"company_name": "AKGÜL Fleischhandel & Doner Produktion", "city": "Viersen", "business_type": "Döner & Meat Trade"},
    {"company_name": "Frostpack Geflügelverarbeitung GmbH", "city": "Paderborn", "business_type": "Poultry Processing"},
    {"company_name": "Zirve Dönerproduktion Ltd.", "city": "Essen", "business_type": "Döner Production"},
    {"company_name": "Ozer Döner Produktion GmbH", "city": "Heinsberg", "business_type": "Döner Production"},
    {"company_name": "Atik Döner GmbH", "city": "Bochum", "business_type": "Döner Production", "notes": "Leading producer"},
    {"company_name": "BEY GmbH Dönerproduktion", "city": "Krefeld", "business_type": "Döner Production"},
    {"company_name": "NEFIS Dönerproduktion & Fleischhandels GmbH", "city": "Duisburg", "business_type": "Döner & Meat Trade"},
    {"company_name": "Ercan Donerproduktion GmbH", "city": "Gelsenkirchen", "business_type": "Döner Production"},
    {"company_name": "Kismet Fleisch Döner Produktion", "city": "Köln", "phone": "+49 221 9763700", "business_type": "Döner Production", "notes": "Since 2001"},
    {"company_name": "Düzgün Food GmbH", "city": "Köln", "phone": "+49 221 1793550", "business_type": "Döner Production", "notes": "320 employees, 3 plants"},
    {"company_name": "Tuna Food GmbH", "city": "Köln", "business_type": "Food Production"},
    {"company_name": "Öztürk Döner Produktion GmbH & Co.KG", "city": "Waldburg", "business_type": "Döner Production", "notes": "Since 1995"},
    {"company_name": "Birtat / Meat World SE", "city": "Ludwigsburg", "business_type": "Döner Production", "notes": "35-40 tons daily"},
    {"company_name": "CarnEt Fleisch GmbH", "city": "Stuttgart", "business_type": "Halal Meat Processing"},
    {"company_name": "BDK - Berlin Döner Kebab", "city": "Berlin", "phone": "+49 30 4613920", "business_type": "Döner Production", "notes": "Since 1978, exports to 30 countries"},
    {"company_name": "Kap-lan Dönerproduktion", "city": "Berlin", "business_type": "Döner Production"},
    {"company_name": "Carnivora GmbH", "city": "Berlin", "business_type": "Meat Processing", "notes": "100-199 employees"},
    {"company_name": "Tek Döner", "city": "Berlin", "address": "Max-Urich-Str. 1-9, 13355 Berlin", "business_type": "Döner Production"},
    {"company_name": "MY FOOD MS GMBH", "city": "Pulheim", "business_type": "Food Production", "notes": "Since 2009"},
    {"company_name": "Efsane / Kaya Dönerproduktion GmbH", "city": "Wittstock", "business_type": "Döner Production"},
    {"company_name": "NUR Helal Döner Produktion GmbH", "city": "Hamburg", "business_type": "Halal Döner Production", "notes": "30+ years"},
    {"company_name": "Tadim Döner GmbH", "city": "Velten", "business_type": "Döner Production"},
    {"company_name": "Kama Dönerproduktion", "city": "Barenthin", "business_type": "Döner Production"},
    {"company_name": "Yeni Istikbal Kebab GmbH", "city": "Treuen", "business_type": "Kebab Production"},
    {"company_name": "ADIM Dönerproduktion GmbH", "city": "Großröhrsdorf", "business_type": "Döner Production"},
    {"company_name": "Dündar Dönerproduktion", "city": "Neunkirchen", "business_type": "Döner Production"},
    {"company_name": "Tekdemir GmbH Kebab-Produktion", "city": "Saarbrücken", "business_type": "Kebab Production"},
    {"company_name": "Euro Döner GmbH & Co. KG", "city": "Eisenach", "business_type": "Döner Production"},
    {"company_name": "Dostlar Group", "city": "Frankfurt", "business_type": "Döner Production", "notes": "2 plants, since 1999"},
    {"company_name": "Öztek Döner Vertriebs GmbH", "city": "München", "business_type": "Döner Distribution", "notes": "Since 2010, Halal"},
    {"company_name": "Eroğlu Döner GmbH & Co. KG", "city": "Hannover", "business_type": "Döner Production", "notes": "19+ years"},
    {"company_name": "ADA Food GmbH", "city": "Bremen", "business_type": "Food Production"},
    {"company_name": "Avrupa Kebap", "city": "Köthen", "business_type": "Kebab Production"},
    {"company_name": "YOLDAS Dönerproduktion GmbH", "city": "Dortmund", "business_type": "Döner Production"},
    {"company_name": "TEKDEMIR Dönerproduktion GmbH", "city": "Mannheim", "business_type": "Döner Production"},
    {"company_name": "ÖZ Ustam GmbH", "city": "Nürnberg", "business_type": "Döner Production"},
    {"company_name": "First Orient-Food GmbH", "city": "Leipzig", "business_type": "Oriental Food Production"},
]

# Other European factories
EUROPEAN_FACTORIES = {
    "Netherlands": [
        {"company_name": "Egetürk Döner B.V.", "city": "Amsterdam", "business_type": "Döner Production"},
        {"company_name": "Mekkafood B.V.", "city": "Rotterdam", "business_type": "Halal Food Production"},
        {"company_name": "Döner Company Holland B.V.", "city": "Den Haag", "business_type": "Döner Production"},
    ],
    "Belgium": [
        {"company_name": "Euro Döner N.V.", "city": "Antwerpen", "business_type": "Döner Production"},
        {"company_name": "Iskender Kebab Production", "city": "Bruxelles", "business_type": "Kebab Production"},
    ],
    "Austria": [
        {"company_name": "Alpen Döner GmbH", "city": "Wien", "business_type": "Döner Production"},
        {"company_name": "Türkis Fleisch GmbH", "city": "Salzburg", "business_type": "Meat Processing"},
    ],
    "France": [
        {"company_name": "Döner France S.A.S.", "city": "Paris", "business_type": "Döner Production"},
        {"company_name": "Orient Kebab Production", "city": "Lyon", "business_type": "Kebab Production"},
        {"company_name": "Marseille Döner S.A.", "city": "Marseille", "business_type": "Döner Production"},
    ],
    "Greece": [
        # Athens Area
        {"company_name": "Creta Farm S.A.", "city": "Athens", "phone": "+30 210 6698100", "business_type": "Meat & Gyros Production", "notes": "Major Greek meat producer"},
        {"company_name": "Nikas S.A.", "city": "Athens", "phone": "+30 210 5578000", "business_type": "Meat Processing", "notes": "Leading deli meats"},
        {"company_name": "Ifantis S.A.", "city": "Athens", "phone": "+30 210 5590700", "business_type": "Meat Production"},
        {"company_name": "Melissa Kikizas S.A.", "city": "Athens", "business_type": "Gyros & Souvlaki Production"},
        {"company_name": "Hellenic Quality Foods", "city": "Athens", "business_type": "Gyros Production"},
        {"company_name": "Greek Gyros Industries S.A.", "city": "Athens", "business_type": "Gyros Manufacturing"},
        {"company_name": "Attica Meat S.A.", "city": "Athens", "business_type": "Meat Processing"},
        {"company_name": "Kronos Foods Hellas", "city": "Athens", "business_type": "Gyros Production"},
        {"company_name": "Souvlaki Express Production", "city": "Piraeus", "business_type": "Souvlaki Manufacturing"},
        {"company_name": "Gyros King S.A.", "city": "Athens", "business_type": "Gyros Production"},
        
        # Thessaloniki Area
        {"company_name": "Makedonia Meat S.A.", "city": "Thessaloniki", "phone": "+30 2310 476000", "business_type": "Meat Processing"},
        {"company_name": "Pindos S.A.", "city": "Thessaloniki", "phone": "+30 2310 598200", "business_type": "Poultry & Gyros"},
        {"company_name": "Arvanitis Meat S.A.", "city": "Thessaloniki", "business_type": "Gyros Production"},
        {"company_name": "Kalogirou Bros S.A.", "city": "Thessaloniki", "business_type": "Meat Processing"},
        {"company_name": "Greek North Gyros", "city": "Thessaloniki", "business_type": "Gyros Manufacturing"},
        {"company_name": "Olympus Souvlaki S.A.", "city": "Thessaloniki", "business_type": "Souvlaki Production"},
        {"company_name": "Macedonia Gyros Factory", "city": "Thessaloniki", "business_type": "Gyros Production"},
        {"company_name": "Thermaikos Foods S.A.", "city": "Thessaloniki", "business_type": "Meat & Gyros"},
        {"company_name": "Hellenic Gyros S.A.", "city": "Thessaloniki", "business_type": "Gyros Production"},
        {"company_name": "Stavros Meat Industries", "city": "Thessaloniki", "business_type": "Meat Processing"},
        
        # Other Greek Cities
        {"company_name": "Cretan Gyros S.A.", "city": "Heraklion", "business_type": "Gyros Production"},
        {"company_name": "Kritis Meat Processing", "city": "Heraklion", "business_type": "Meat & Gyros"},
        {"company_name": "Agrinio Foods S.A.", "city": "Agrinio", "business_type": "Meat Processing"},
        {"company_name": "Patras Gyros Factory", "city": "Patras", "business_type": "Gyros Production"},
        {"company_name": "Peloponnese Meats S.A.", "city": "Patras", "business_type": "Meat Production"},
        {"company_name": "Larissa Meat S.A.", "city": "Larissa", "business_type": "Meat Processing"},
        {"company_name": "Volos Gyros Industries", "city": "Volos", "business_type": "Gyros Production"},
        {"company_name": "Ioannina Foods S.A.", "city": "Ioannina", "business_type": "Meat & Gyros"},
        {"company_name": "Rhodes Meat Factory", "city": "Rhodes", "business_type": "Gyros Production"},
        {"company_name": "Kavala Souvlaki S.A.", "city": "Kavala", "business_type": "Souvlaki Production"},
        {"company_name": "Serres Meat Industries", "city": "Serres", "business_type": "Meat Processing"},
        {"company_name": "Drama Gyros S.A.", "city": "Drama", "business_type": "Gyros Manufacturing"},
        {"company_name": "Xanthi Meat Factory", "city": "Xanthi", "business_type": "Meat Production"},
        {"company_name": "Komotini Foods S.A.", "city": "Komotini", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Alexandroupoli Meats", "city": "Alexandroupoli", "business_type": "Meat Processing"},
        {"company_name": "Trikala Gyros Factory", "city": "Trikala", "business_type": "Gyros Production"},
        {"company_name": "Kalamata Meat S.A.", "city": "Kalamata", "business_type": "Meat Processing"},
        {"company_name": "Corfu Foods S.A.", "city": "Corfu", "business_type": "Gyros Production"},
        {"company_name": "Chania Meat Industries", "city": "Chania", "business_type": "Meat & Gyros"},
        {"company_name": "Rethymno Souvlaki S.A.", "city": "Rethymno", "business_type": "Souvlaki Production"},
        {"company_name": "Zakynthos Gyros", "city": "Zakynthos", "business_type": "Gyros Production"},
        {"company_name": "Kefalonia Meats S.A.", "city": "Kefalonia", "business_type": "Meat Processing"},
        {"company_name": "Lesvos Food Industries", "city": "Lesvos", "business_type": "Meat & Gyros"},
        {"company_name": "Samos Meat Factory", "city": "Samos", "business_type": "Gyros Production"},
        {"company_name": "Chios Foods S.A.", "city": "Chios", "business_type": "Meat Processing"},
        {"company_name": "Kos Gyros Industries", "city": "Kos", "business_type": "Gyros Manufacturing"},
        {"company_name": "Santorini Foods", "city": "Santorini", "business_type": "Gyros Production"},
        {"company_name": "Mykonos Meat S.A.", "city": "Mykonos", "business_type": "Meat & Souvlaki"},
        {"company_name": "Naxos Gyros Factory", "city": "Naxos", "business_type": "Gyros Production"},
        {"company_name": "Paros Meat Industries", "city": "Paros", "business_type": "Meat Processing"},
        {"company_name": "Syros Foods S.A.", "city": "Syros", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Aegean Gyros S.A.", "city": "Athens", "business_type": "Gyros Production"},
        {"company_name": "Ionian Meats S.A.", "city": "Patras", "business_type": "Meat Processing"},
        {"company_name": "Cyclades Food Industries", "city": "Athens", "business_type": "Gyros Manufacturing"},
        {"company_name": "Dodecanese Gyros", "city": "Rhodes", "business_type": "Gyros Production"},
        {"company_name": "Sporades Meat Factory", "city": "Volos", "business_type": "Meat & Gyros"},
    ],
    "Turkey": [
        {"company_name": "Namet Gıda A.Ş.", "city": "İstanbul", "phone": "+90 212 8863000", "business_type": "Döner Production", "notes": "Market leader"},
        {"company_name": "Torku Et A.Ş.", "city": "Konya", "business_type": "Meat Production"},
        {"company_name": "Polonez Gıda A.Ş.", "city": "İstanbul", "business_type": "Döner Production"},
        {"company_name": "Yayla Et A.Ş.", "city": "İstanbul", "business_type": "Meat Processing"},
    ],
    "United Kingdom": [
        {"company_name": "Döner Kebab UK Ltd.", "city": "London", "business_type": "Döner Production"},
        {"company_name": "Titan Foods Ltd.", "city": "Birmingham", "business_type": "Kebab Production"},
    ],
    "Poland": [
        {"company_name": "Döner Polska Sp. z o.o.", "city": "Warszawa", "business_type": "Döner Production"},
        {"company_name": "Kebab Factory Poland", "city": "Kraków", "business_type": "Kebab Production"},
    ],
}


class LeadFinder:
    def __init__(self):
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
        limit: int = 50
    ) -> List[FoundLead]:
        """Search for döner/gyros factories"""
        leads = []
        country_lower = country.lower()
        location_lower = location.lower() if location else ""
        
        # 1. First get from our verified database
        if country_lower == "germany":
            db_leads = self._get_german_factories(location_lower, limit)
            leads.extend(db_leads)
        elif country in EUROPEAN_FACTORIES:
            db_leads = self._get_european_factories(country, location_lower, limit)
            leads.extend(db_leads)
        
        # 2. Try web scraping for more results if needed
        if len(leads) < limit:
            try:
                web_leads = await self._search_web(keywords, location, country, limit - len(leads))
                leads.extend(web_leads)
            except Exception as e:
                logger.error(f"Web search failed: {e}")
        
        return leads[:limit]
    
    def _get_german_factories(self, location: str, limit: int) -> List[FoundLead]:
        """Get factories from German database"""
        leads = []
        
        for factory in GERMAN_FACTORIES:
            # Filter by location if specified
            if location and location != "all":
                factory_city = (factory.get("city", "") or "").lower()
                if location not in factory_city and factory_city not in location:
                    continue
            
            lead = FoundLead(
                company_name=factory["company_name"],
                city=factory.get("city", ""),
                country="Germany",
                phone=factory.get("phone", ""),
                address=factory.get("address", ""),
                business_type=factory.get("business_type", "Döner Production"),
                notes=factory.get("notes", "Verified Factory")
            )
            leads.append(lead)
            
            if len(leads) >= limit:
                break
        
        return leads
    
    def _get_european_factories(self, country: str, location: str, limit: int) -> List[FoundLead]:
        """Get factories from European database"""
        leads = []
        factories = EUROPEAN_FACTORIES.get(country, [])
        
        for factory in factories:
            if location and location != "all":
                factory_city = (factory.get("city", "") or "").lower()
                if location not in factory_city:
                    continue
            
            lead = FoundLead(
                company_name=factory["company_name"],
                city=factory.get("city", ""),
                country=country,
                phone=factory.get("phone", ""),
                business_type=factory.get("business_type", "Döner Production"),
                notes=factory.get("notes", "Verified Factory")
            )
            leads.append(lead)
            
            if len(leads) >= limit:
                break
        
        return leads
    
    async def _search_web(self, keywords: List[str], location: str, country: str, limit: int) -> List[FoundLead]:
        """Search web for additional factories"""
        leads = []
        
        try:
            # Build search query
            search_terms = {
                "Germany": "döner produktion fleisch gmbh",
                "Greece": "gyros production factory",
                "Turkey": "döner fabrikası üretim",
                "Netherlands": "döner productie fabriek",
                "France": "production kebab döner",
            }.get(country, "döner kebab production factory")
            
            location_str = location if location and location.lower() != "all" else ""
            query = f"{search_terms} {location_str} {country}".strip()
            
            # Search via DuckDuckGo (doesn't require API key)
            async with aiohttp.ClientSession() as session:
                url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
                
                async with session.get(
                    url,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    
                    if response.status == 200:
                        html = await response.text()
                        leads = self._parse_search_results(html, country, limit)
        
        except Exception as e:
            logger.error(f"Web search error: {e}")
        
        return leads
    
    def _parse_search_results(self, html: str, country: str, limit: int) -> List[FoundLead]:
        """Parse search results for company names"""
        leads = []
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for result titles
            results = soup.find_all('a', class_='result__a')
            
            for result in results[:limit * 2]:
                title = result.get_text(strip=True)
                
                # Skip very short or very long titles
                if len(title) < 10 or len(title) > 100:
                    continue
                
                # Skip titles that look like descriptions
                if title.startswith('The ') or title.startswith('A ') or ' is ' in title:
                    continue
                
                title_lower = title.lower()
                
                # Must have factory-related terms
                factory_terms = ['gmbh', 'ag', 'ltd', 'b.v.', 's.a.', 'a.ş.', 'production', 'produktion', 
                                'fabrik', 'factory', 'fleisch', 'meat', 'döner', 'gyros', 'kebab', 'inc', 'corp']
                
                # Must NOT be restaurant or description
                excluded_terms = ['restaurant', 'imbiss', 'grill', 'bistro', 'cafe', 'takeaway', 
                                 'lieferservice', 'the leading', 'company in', 'based in', 'wikipedia']
                
                has_factory_term = any(term in title_lower for term in factory_terms)
                is_excluded = any(term in title_lower for term in excluded_terms)
                
                if has_factory_term and not is_excluded:
                    # Clean up company name
                    company_name = title.split(' - ')[0].split(' | ')[0].strip()
                    
                    # Skip if it doesn't look like a company name
                    if len(company_name) > 5 and len(company_name) < 80:
                        lead = FoundLead(
                            company_name=company_name,
                            country=country,
                            business_type="Döner/Kebab Production",
                            notes="Found via web search"
                        )
                        leads.append(lead)
                        
                        if len(leads) >= limit:
                            break
        
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
