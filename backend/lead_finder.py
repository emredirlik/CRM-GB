"""
Lead Finder Module - Real Business Data via SerpAPI + Verified Greek Factories
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


# ============================================
# VERIFIED GREEK GYROS/KEBAB FACTORIES (60)
# ============================================
GREEK_FACTORIES = [
    {"company_name": "Megas Yeeros A.E.", "address": "Leoforos Nato 100, Aspropyrgos 193 00", "phone": "+30 210 558 4098", "city": "Aspropyrgos", "business_type": "Gyros Üretimi", "notes": "Günlük 35 ton - Dünyanın en büyüğü"},
    {"company_name": "Elvida Foods S.A.", "address": "Stylianou Gonata 40, Peristeri 121 33", "phone": "+30 210 578 5051", "city": "Peristeri", "business_type": "Gyros Üretimi", "notes": "Günlük 20 ton, 20+ ülkeye ihracat"},
    {"company_name": "Nostimost", "address": "Stylianou Gonata 40, Peristeri 121 33", "phone": "+30 210 578 5051", "city": "Peristeri", "business_type": "Gyros Üretimi", "notes": "ISO, BRC, IFS, Helal sertifikalı"},
    {"company_name": "Creta Farms A.E.", "address": "23o km Athinon-Lamias, Kryoneri", "phone": "+30 210 626 0000", "city": "Athens", "business_type": "Gyros Üretimi", "notes": "%100 Yunan eti"},
    {"company_name": "Aifantis Grubu", "address": "Acheloos Bridge, Agrinio 301 00", "phone": "+30 26410 91990", "city": "Agrinio", "business_type": "Gyros Üretimi", "notes": "4.500 m² tesis"},
    {"company_name": "Nanos A.E.B.E.", "address": "Thesi Tzaverdela, Aspropyrgos 193 00", "phone": "+30 210 559 0994", "city": "Aspropyrgos", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "PFS Foods", "address": "10o km EO Larisa-Ampelona, Ampelonas 404 00", "phone": "+30 2410 942 069", "city": "Larisa", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Kasidis S.A.", "address": "1o km EO Tyrnavou-Larisas, Tyrnavos 401 00", "phone": "+30 2410 831 520", "city": "Tyrnavos", "business_type": "Gyros Üretimi", "notes": "1885'ten beri"},
    {"company_name": "King's Gyros S.A.", "address": "Dimitratou Aristeidi 26, Agios Ioannis Rentis 182 33", "phone": "+30 210 481 0009", "city": "Agios Ioannis Rentis", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "DHQ", "address": "Neos Zois, Aspropyrgos 193 00", "phone": "+30 210 559 5515", "city": "Aspropyrgos", "business_type": "Gyros Üretimi", "notes": "4.000 m² tesis"},
    {"company_name": "Pindos A.E.B.E.", "address": "Ioannina, Epir", "phone": "+30 26510 25100", "city": "Ioannina", "business_type": "Tavuk Gyros", "notes": "374 milyon € ciro"},
    {"company_name": "Vikrea A.E.B.E.", "address": "7o km Kavala-Eleftheroupolis, 641 00", "phone": "+30 2510 327011", "city": "Kavala", "business_type": "Gyros Üretimi", "notes": "40+ yıllık"},
    {"company_name": "Kreka A.E.", "address": "Perni, Chrysoupoli 642 00, Kavala", "phone": "+30 25910 42100", "city": "Kavala", "business_type": "Gyros Üretimi", "notes": "1971'den beri, halka açık"},
    {"company_name": "TWM A.E.B.E.", "address": "Frixou 13, Acharnes 136 73", "phone": "+30 210 247 8620", "city": "Acharnes", "business_type": "Gyros Üretimi", "notes": "Modern fabrika"},
    {"company_name": "Top Meat", "address": "Profitou Daniil 14, Tavros 177 78", "phone": "+30 210 341 4201", "city": "Tavros", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Vittos Family", "address": "Papadopoulou 22, Agios Ioannis Rentis 182 33", "phone": "+30 210 483 7001", "city": "Agios Ioannis Rentis", "business_type": "Gyros Üretimi", "notes": "40+ yıl"},
    {"company_name": "Andriopoulos", "address": "Kifisou 112, Peristeri 121 33", "phone": "+30 210 573 5901", "city": "Peristeri", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Savvas Kebap A.E.", "address": "Dimokratias 62, Agioi Anargyroi", "phone": "+30 210 576 6175", "city": "Agioi Anargyroi", "business_type": "Kebap Üretimi", "notes": "1925'ten beri"},
    {"company_name": "Batanian Bros", "address": "Anaxagora 6, Koropi 194 00", "phone": "+30 210 662 0046", "city": "Koropi", "business_type": "Kebap Üretimi", "notes": "1922'den beri"},
    {"company_name": "Pozatzidis", "address": "Ipeirou 7 & Echelidon, Peiraias 185 40", "phone": "+30 213 037 5140", "city": "Piraeus", "business_type": "Kebap Üretimi", "notes": ""},
    {"company_name": "Psichogios Delicatessen", "address": "Leoforos Sofokli Venizelou 92, Likovrisi 141 23", "phone": "+30 210 282 9759", "city": "Likovrisi", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "JM Group (Meïdanis)", "address": "Samou 34 & Antigonis, Mandra 196 00", "phone": "+30 210 554 0070", "city": "Mandra", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Bozionelos", "address": "Pyrgou 27, Moschato 183 44", "phone": "+30 210 481 8964", "city": "Moschato", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Brothers Meat O.E.", "address": "P. Nikolaidi 30, Agios Ioannis Rentis 182 33", "phone": "+30 210 482 3002", "city": "Agios Ioannis Rentis", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Serafeim Zavvos", "address": "Karaiskaki 16, Nikaia 184 53", "phone": "+30 210 493 6413", "city": "Nikaia", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Stohos", "address": "Peiraios 226, Tavros 177 78", "phone": "+30 210 942 2204", "city": "Tavros", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Belle Meat", "address": "Ortansias 25, Acharnes 136 71", "phone": "+30 210 559 5135", "city": "Acharnes", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Manibus Premium", "address": "Nikopoleos 25, Ilion 131 22", "phone": "+30 210 501 5888", "city": "Ilion", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Lampridis Family", "address": "Konstantinoupoleos 441, Acharnes 136 71", "phone": "+30 210 574 5705", "city": "Acharnes", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Meat Farm", "address": "Ano Liosia, Attiki", "phone": "", "city": "Ano Liosia", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Chamakos - Ileiakos", "address": "Prasino, Pyrgos 271 50, Ileia", "phone": "+30 26210 23816", "city": "Pyrgos", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Panitsas - Kreatagora", "address": "Viomihaniki Periochi Patras 252 00", "phone": "+30 2610 701369", "city": "Patras", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Alexandros A.V.E.E.", "address": "7o km EO Serres-Selanik", "phone": "+30 23210 75498", "city": "Serres", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Andreas Petikas", "address": "15o km EO Selanik-Perea", "phone": "+30 2310 472214", "city": "Thessaloniki", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Quality Farm Ltd", "address": "BIPE (BİO.PA.) Kavala", "phone": "+30 695 181 8650", "city": "Kavala", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Bovillage", "address": "Leoforos Pentelis 72, Halandri 152 34", "phone": "+30 210 689 1624", "city": "Halandri", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Agora Kreton Amfilohias", "address": "Agiou Nikolaou 28, Ilion 131 22", "phone": "+30 698 424 0050", "city": "Ilion", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "I. Braditsas Trofino", "address": "48,7 km EO Tarras-Monemvasia, Molaoi", "phone": "+30 27320 22375", "city": "Molaoi", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Afoi Asimaki O.E.", "address": "Georgiou Papandreou 72, Goudi 157 73", "phone": "+30 210 775 7075", "city": "Goudi", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Makris D. Nikolaos", "address": "Kentriki Agora K3-04B/05B, Agios Ioannis Rentis 182 33", "phone": "+30 210 481 1316", "city": "Agios Ioannis Rentis", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Paterakis A.E.", "address": "Sternes Akrotiriou, Chania 731 00", "phone": "+30 28210 66121", "city": "Chania", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Meatka A.E.", "address": "Thermopylon 20 & Diagora, Spata 190 04", "phone": "+30 210 663 4848", "city": "Spata", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Panitsas Andreas & Co", "address": "Ileias 193, Kato Ovria, Patras", "phone": "+30 2610 521354", "city": "Patras", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Ptinotrofikes Artas", "address": "10o km EO Arta-Salaora", "phone": "+30 26810 41585", "city": "Arta", "business_type": "Tavuk Gyros", "notes": ""},
    {"company_name": "Ch. Michas A.E.V.E.", "address": "Thesi Kanali, Ypsilantis 322 00", "phone": "+30 22680 29100", "city": "Ypsilantis", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Afoi Lazaridis & Co", "address": "Karaoli 42 & Sirou, Korydallos 181 21", "phone": "+30 210 562 2112", "city": "Korydallos", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Kanavitsas", "address": "Ag. Georgiou 1, Tavros 177 78", "phone": "+30 210 346 0560", "city": "Tavros", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Zaco A.E.B.E.", "address": "Tatoiou 386, Acharnes 136 71", "phone": "+30 210 620 2175", "city": "Acharnes", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Tsaousidis", "address": "Neos Zois 19300, Aspropyrgos", "phone": "+30 210 559 5515", "city": "Aspropyrgos", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Makris - Fresh Meat", "address": "Kentriki Agora K3-04B/05B, Agios Ioannis Rentis 182 33", "phone": "+30 210 481 1316", "city": "Agios Ioannis Rentis", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Comeco A.E.", "address": "Triklino, Kerkyra 491 50", "phone": "", "city": "Corfu", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Manolis Kebap", "address": "Leoforos Eirinis 73, Tavros", "phone": "+30 210 342 8121", "city": "Tavros", "business_type": "Kebap Üretimi", "notes": ""},
    {"company_name": "Nikos Kebap", "address": "Profitou Daniil 14, Tavros", "phone": "+30 694 366 0025", "city": "Tavros", "business_type": "Kebap Üretimi", "notes": ""},
    {"company_name": "Alpha Kebab I.K.E.", "address": "Pythodorou 6, Athens", "phone": "+30 210 524 8236", "city": "Athens", "business_type": "Kebap Üretimi", "notes": ""},
    {"company_name": "Parnassos - Afoi Fakou", "address": "Fokionos 52, Piraeus", "phone": "+30 210 422 6810", "city": "Piraeus", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Geystikos Kosmos (TWM)", "address": "Frixou 13, Acharnes 136 73", "phone": "+30 210 247 8620", "city": "Acharnes", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Ginis Greek Meat", "address": "Edessis 20, Agios Ioannis Rentis", "phone": "+30 210 493 5035", "city": "Agios Ioannis Rentis", "business_type": "Gyros Üretimi", "notes": ""},
    {"company_name": "Siarambis Kreopoleio", "address": "Fylis 92, Kamatero", "phone": "+30 210 238 6367", "city": "Kamatero", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Kreatoemporiki Kossyva", "address": "Akrotiriou 123, Patras", "phone": "", "city": "Patras", "business_type": "Et İşleme", "notes": ""},
    {"company_name": "Aspro Provato", "address": "Palea EO Korinthou-Patron 30, Kato Diminio", "phone": "+30 27420 25575", "city": "Kato Diminio", "business_type": "Gyros Üretimi", "notes": ""},
]


class LeadFinder:
    """Factory finder using verified database for Greece + SerpAPI for others"""
    
    def __init__(self):
        self.serpapi_key = os.environ.get('SERPAPI_KEY')
        self.gemini_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('GEMINI_API_KEY')
    
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 500
    ) -> List[FoundLead]:
        """Search for factories - use verified database for Greece, SerpAPI for others"""
        
        country_lower = country.lower()
        
        # Use verified database for Greece
        if country_lower == "greece":
            return self._get_greek_factories(location, limit)
        
        # Use SerpAPI for other countries
        if self.serpapi_key:
            results = await self._search_with_serpapi(keywords, location, country, limit)
            if results:
                return results
        
        # Fallback to AI
        if self.gemini_key:
            return await self._search_with_ai(keywords, location, country, limit)
        
        return []
    
    def _get_greek_factories(self, location: str, limit: int) -> List[FoundLead]:
        """Get verified Greek factories from database"""
        leads = []
        location_lower = (location or "").lower()
        
        for factory in GREEK_FACTORIES:
            # Filter by location if specified
            if location_lower and location_lower != "all":
                factory_city = (factory.get("city", "") or "").lower()
                factory_address = (factory.get("address", "") or "").lower()
                if location_lower not in factory_city and location_lower not in factory_address:
                    continue
            
            lead = FoundLead(
                company_name=factory["company_name"],
                city=factory.get("city", ""),
                country="Greece",
                address=factory.get("address", ""),
                phone=factory.get("phone", ""),
                business_type=factory.get("business_type", "Gyros/Kebap Üretimi"),
                notes=factory.get("notes", "") or "Doğrulanmış Fabrika"
            )
            leads.append(lead)
            
            if len(leads) >= limit:
                break
        
        return leads
    
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
            seen_names = set()
            
            # Location string for Google Maps
            if location and location.lower() != 'all':
                search_location = f"{location}, {country}"
            else:
                search_location = country
            
            # Generate multiple search queries
            base_keywords = keywords[:5]
            
            search_patterns = [
                "{kw} production {loc}",
                "{kw} factory {loc}",
                "{kw} manufacturer {loc}",
                "{kw} producer {loc}",
                "{kw} wholesale {loc}",
                "{kw} fabrik {loc}",
                "{kw} produktion {loc}",
                "{kw} hersteller {loc}",
                "{kw} üretim {loc}",
                "{kw} fabrika {loc}",
            ]
            
            search_queries = []
            for kw in base_keywords:
                for pattern in search_patterns:
                    query = pattern.format(kw=kw, loc=search_location)
                    if query not in search_queries:
                        search_queries.append(query)
            
            # Combined searches
            combined_kw = " ".join(base_keywords[:3])
            search_queries.extend([
                f"{combined_kw} {search_location}",
                f"döner kebab gyros factory {search_location}",
                f"meat processing plant {search_location}",
                f"halal meat production {search_location}",
                f"fleischverarbeitung {search_location}",
                f"et işleme tesisi {search_location}",
            ])
            
            # Country-specific searches
            country_lower = country.lower()
            if country_lower == "turkey":
                search_queries.extend([
                    f"döner fabrikası {search_location}",
                    f"et işleme tesisi {search_location}",
                    f"kebap üretim {search_location}",
                ])
            
            logger.info(f"Running {len(search_queries)} search queries for {country}")
            
            for query in search_queries:
                if len(leads) >= limit:
                    break
                    
                try:
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
                        name_key = name.lower().strip()
                        
                        if name_key in seen_names:
                            continue
                        seen_names.add(name_key)
                        
                        if self._is_restaurant(name_key, item):
                            logger.info(f"Filtered out: {name}")
                            continue
                        
                        address = item.get("address", "")
                        phone = item.get("phone", "")
                        website = item.get("website", "")
                        
                        city_name = location if location and location.lower() != 'all' else ""
                        if not city_name and address:
                            parts = address.split(",")
                            if len(parts) >= 2:
                                city_name = parts[-2].strip()
                        
                        types = item.get("type", "") or item.get("types", [])
                        if isinstance(types, list):
                            types = ", ".join(types)
                        
                        business_type = self._determine_business_type(name, types, keywords)
                        
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
                    logger.error(f"SerpAPI error for '{query}': {e}")
                    continue
            
            logger.info(f"Total leads found: {len(leads)}")
            return leads
            
        except Exception as e:
            logger.error(f"SerpAPI error: {e}")
            return []
    
    def _is_restaurant(self, name_lower: str, item: dict) -> bool:
        """STRICT filter - Only allow real registered companies"""
        
        # MUST have legal company suffix
        legal_suffixes = [
            'gmbh', ' kg', ' ag', 'e.k.', 'ohg', ' se',
            's.a.', 's.l.', 's.l.u.',
            's.r.l.',
            'a.e.', 'e.p.e.', 'o.e.', 'i.k.e.', 'a.e.b.e.', 'α.ε.', 'ε.π.ε.',
            'a.ş.', 'ltd.', 'ltd şti', 'tic.',
            'b.v.', 'n.v.',
            ' inc', ' llc', ' corp', ' co.',
            ' sa', ' sl', ' srl', ' ae'
        ]
        
        has_legal_suffix = any(suffix in name_lower for suffix in legal_suffixes)
        
        if not has_legal_suffix:
            return True
        
        blacklist = [
            'restaurant', 'imbiss', 'bistro', 'cafe', 'bar',
            'tavern', 'diner', 'pizzeria', 'grill',
            'takeaway', 'takeout', 'delivery', 'catering',
            'supermarket', 'market', 'grocery', 'shop',
            'butcher', 'metzgerei', 'kasap', 'κρεοπωλείο',
            'souvlaki', 'gyros haus', 'döner haus', 'kebab haus'
        ]
        
        if any(word in name_lower for word in blacklist):
            return True
        
        return False
    
    def _determine_business_type(self, name: str, types: str, keywords: List[str]) -> str:
        """Determine the business type"""
        name_lower = name.lower()
        keywords_lower = [k.lower() for k in keywords]
        
        if 'döner' in name_lower or 'doner' in name_lower or 'döner' in keywords_lower:
            return "Döner Üretimi"
        elif 'gyros' in name_lower or 'gyros' in keywords_lower:
            return "Gyros Üretimi"
        elif 'kebab' in name_lower or 'kebap' in name_lower:
            return "Kebap Üretimi"
        elif 'meat' in name_lower or 'fleisch' in name_lower:
            return "Et İşleme"
        elif 'food' in name_lower:
            return "Gıda Üretimi"
        else:
            return "Üretim Tesisi"
    
    async def _search_with_ai(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Fallback: Use AI to search for factories with strict prompt"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            location_str = f"{location}" if location and location.lower() != 'all' else "tüm şehirler"
            keywords_str = ", ".join(keywords)
            
            system_prompt = """Sen bir pazar araştırma uzmanısın. Görevin, belirli bir bölgedeki ticari işletmeleri bulmak ve bunları yazılı tarafından okunabilir bir formatta sunmaktır.

Görev: Kullanıcının belirttiği bölgedeki tüm Gyros üretim tesislerini, Döner fabrikalarını ve toptan et işleme merkezlerini bul.

Format Kuralları:
- Yanıtı sadece JSON formatında ver
- Her işletme için şu bilgileri dahil et: company_name, city, address, phone, business_type (Fabrika/Toptancı), website (varsa)
- Sadece gerçek ve doğrulanabilir yerleri listele
- RESTORAN, IMBISS, FAST FOOD OLMASIN
- Şirket adında yasal ek olmalı: GmbH, S.A., S.L., S.R.L., Ltd, A.Ş. vb.

JSON formatı:
[{"company_name": "Şirket Adı S.L.", "city": "Şehir", "address": "Adres", "phone": "Telefon", "business_type": "Döner Fabrikası", "website": "www.site.com"}]

SADECE JSON döndür, başka açıklama yazma."""

            user_prompt = f"""{country} ülkesinde {location_str} bölgesinde şu kelimelere uygun işletmeleri bul:
{keywords_str}

SADECE üretim tesisleri ve fabrikalar. Restoran, imbiss, fast food YASAK.
En fazla 15-20 gerçek işletme bul. JSON array döndür:"""

            chat = LlmChat(
                api_key=self.gemini_key,
                session_id=f"factory-{country}-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-flash")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(chat.send_message(message), timeout=120.0)
            
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
                        notes=item.get('notes', 'AI önerisi')
                    )
                    leads.append(lead)
                        
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
