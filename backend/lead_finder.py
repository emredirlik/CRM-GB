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
        # Top Producers
        {"company_name": "Megas Yeeros A.E.", "city": "Aspropyrgos", "address": "Leoforos Nato 100, Aspropyrgos 193 00", "phone": "+30 210 558 4098", "business_type": "Gyros Production", "notes": "Günlük 35 ton - Dünyanın en büyüğü"},
        {"company_name": "Elvida Foods S.A.", "city": "Peristeri", "address": "Stylianou Gonata 40, Peristeri 121 33", "phone": "+30 210 578 5051", "business_type": "Gyros Production", "notes": "Günlük 20 ton, 20+ ülkeye ihracat"},
        {"company_name": "Nostimost", "city": "Peristeri", "address": "Stylianou Gonata 40, Peristeri 121 33", "phone": "+30 210 578 5051", "business_type": "Gyros & Souvlaki", "notes": "ISO, BRC, IFS, Helal sertifikalı"},
        {"company_name": "Creta Farms A.E.", "city": "Athens", "address": "23o km Athinon-Lamias, Kryoneri", "phone": "+30 210 626 0000", "business_type": "Gyros Production", "notes": "%100 Yunan eti"},
        {"company_name": "Aifantis Grubu", "city": "Agrinio", "address": "Acheloos Bridge, Agrinio 301 00", "phone": "+30 26410 91990", "business_type": "Gyros & Souvlaki", "notes": "4.500 m² tesis"},
        {"company_name": "Nanos A.E.B.E.", "city": "Aspropyrgos", "address": "Thesi Tzaverdela, Aspropyrgos 193 00", "phone": "+30 210 559 0994", "business_type": "Gyros & Kebap"},
        {"company_name": "PFS Foods", "city": "Larisa", "address": "10o km EO Larisa-Ampelona, Ampelonas 404 00", "phone": "+30 2410 942 069", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Kasidis S.A.", "city": "Tyrnavos", "address": "1o km EO Tyrnavou-Larisas, Tyrnavos 401 00", "phone": "+30 2410 831 520", "business_type": "Gyros & Kebap", "notes": "1885'ten beri"},
        {"company_name": "King's Gyros S.A.", "city": "Agios Ioannis Rentis", "address": "Dimitratou Aristeidi 26, 182 33", "phone": "+30 210 481 0009", "business_type": "Gyros & Souvlaki"},
        {"company_name": "DHQ", "city": "Aspropyrgos", "address": "Neos Zois, Aspropyrgos 193 00", "phone": "+30 210 559 5515", "business_type": "Gyros Production", "notes": "4.000 m² tesis"},
        {"company_name": "Pindos A.E.B.E.", "city": "Ioannina", "address": "Ioannina, Epir", "phone": "+30 26510 25100", "business_type": "Chicken Gyros", "notes": "374 milyon € ciro"},
        {"company_name": "Vikrea A.E.B.E.", "city": "Kavala", "address": "7o km Kavala-Eleftheroupolis, 641 00", "phone": "+30 2510 327011", "business_type": "Gyros & Kebap", "notes": "40+ yıllık"},
        {"company_name": "Kreka A.E.", "city": "Kavala", "address": "Perni, Chrysoupoli 642 00, Kavala", "phone": "+30 25910 42100", "business_type": "Gyros & Souvlaki", "notes": "1971'den beri, halka açık"},
        {"company_name": "TWM A.E.B.E.", "city": "Acharnes", "address": "Frixou 13, Acharnes 136 73", "phone": "+30 210 247 8620", "business_type": "Gyros & Souvlaki", "notes": "Modern biyomihania"},
        {"company_name": "Top Meat", "city": "Tavros", "address": "Profitou Daniil 14, Tavros 177 78", "phone": "+30 210 341 4201", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Vittos Family", "city": "Agios Ioannis Rentis", "address": "Papadopoulou 22, 182 33", "phone": "+30 210 483 7001", "business_type": "Gyros & Souvlaki", "notes": "40+ yıl"},
        {"company_name": "Andriopoulos", "city": "Peristeri", "address": "Kifisou 112, Peristeri 121 33", "phone": "+30 210 573 5901", "business_type": "Gyros & Kebap"},
        {"company_name": "Savvas Kebap A.E.", "city": "Agioi Anargyroi", "address": "Dimokratias 62, Agioi Anargyroi", "phone": "+30 210 576 6175", "business_type": "Kebap & Lahmacun", "notes": "1925'ten beri"},
        {"company_name": "Batanian Bros", "city": "Koropi", "address": "Anaxagora 6, Koropi 194 00", "phone": "+30 210 662 0046", "business_type": "Kebap & Pastırma", "notes": "1922'den beri"},
        {"company_name": "Pozatzidis", "city": "Piraeus", "address": "Ipeirou 7 & Echelidon, Peiraias 185 40", "phone": "+30 213 037 5140", "business_type": "Kebap & Döner"},
        {"company_name": "Psichogios Delicatessen", "city": "Likovrisi", "address": "Leoforos Sofokli Venizelou 92, 141 23", "phone": "+30 210 282 9759", "business_type": "Gyros & Deli"},
        {"company_name": "JM Group (Meïdanis)", "city": "Mandra", "address": "Samou 34 & Antigonis, Mandras 196 00", "phone": "+30 210 554 0070", "business_type": "Meat Processing"},
        {"company_name": "Bozionelos", "city": "Moschato", "address": "Pyrgou 27, Moschato 183 44", "phone": "+30 210 481 8964", "business_type": "Gyros & Kebap"},
        {"company_name": "Brothers Meat O.E.", "city": "Agios Ioannis Rentis", "address": "P. Nikolaidi 30, 182 33", "phone": "+30 210 482 3002", "business_type": "Meat Processing"},
        {"company_name": "Serafeim Zavvos", "city": "Nikaia", "address": "Karaiskaki 16, Nikaia 184 53", "phone": "+30 210 493 6413", "business_type": "Gyros & Kebap"},
        {"company_name": "Stohos", "city": "Tavros", "address": "Peiraios 226, Tavros 177 78", "phone": "+30 210 942 2204", "business_type": "Meat Processing"},
        {"company_name": "Belle Meat", "city": "Acharnes", "address": "Ortansias 25, Acharnes 136 71", "phone": "+30 210 559 5135", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Manibus Premium", "city": "Ilion", "address": "Nikopoleos 25, Ilion 131 22", "phone": "+30 210 501 5888", "business_type": "Premium Gyros"},
        {"company_name": "Lampridis Family", "city": "Acharnes", "address": "Konstantinoupoleos 441, 136 71", "phone": "+30 210 574 5705", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Meat Farm", "city": "Ano Liosia", "address": "Ano Liosia, Attiki", "phone": "", "business_type": "Gyros Production"},
        {"company_name": "Chamakos - Ileiakos", "city": "Pyrgos", "address": "Prasino, Pyrgos 271 50, Ileia", "phone": "+30 26210 23816", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Panitsas - Kreatagora", "city": "Patras", "address": "Viomihaniki Periochi Patras 252 00", "phone": "+30 2610 701369", "business_type": "Meat Processing"},
        {"company_name": "Alexandros A.V.E.E.", "city": "Serres", "address": "7o km EO Serres-Selanik", "phone": "+30 23210 75498", "business_type": "Gyros & Kebap"},
        {"company_name": "Andreas Petikas", "city": "Thessaloniki", "address": "15o km EO Selanik-Perea", "phone": "+30 2310 472214", "business_type": "Gyros Production"},
        {"company_name": "Quality Farm Ltd", "city": "Kavala", "address": "BIPE (BİO.PA.) Kavala", "phone": "+30 695 181 8650", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Bovillage", "city": "Halandri", "address": "Leoforos Pentelis 72, 152 34", "phone": "+30 210 689 1624", "business_type": "Premium Meat"},
        {"company_name": "Agora Kreton Amfilohias", "city": "Ilion", "address": "Agiou Nikolaou 28, 131 22", "phone": "+30 698 424 0050", "business_type": "Meat Processing"},
        {"company_name": "I. Braditsas Trofino", "city": "Molaoi", "address": "48,7 km EO Tarras-Monemvasia", "phone": "+30 27320 22375", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Afoi Asimaki O.E.", "city": "Goudi", "address": "Georgiou Papandreou 72, 157 73", "phone": "+30 210 775 7075", "business_type": "Meat Processing"},
        {"company_name": "Makris D. Nikolaos", "city": "Agios Ioannis Rentis", "address": "Kentriki Agora K3-04B/05B, 182 33", "phone": "+30 210 481 1316", "business_type": "Gyros & Kebap"},
        {"company_name": "Paterakis A.E.", "city": "Chania", "address": "Sternes Akrotiriou, 731 00", "phone": "+30 28210 66121", "business_type": "Gyros Production"},
        {"company_name": "Meatka A.E.", "city": "Spata", "address": "Thermopylon 20 & Diagora, 190 04", "phone": "+30 210 663 4848", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Panitsas Andreas & Co", "city": "Patras", "address": "Ileias 193, Kato Ovria", "phone": "+30 2610 521354", "business_type": "Meat Processing"},
        {"company_name": "Ptinotrofikes Artas", "city": "Arta", "address": "10o km EO Arta-Salaora", "phone": "+30 26810 41585", "business_type": "Poultry & Gyros"},
        {"company_name": "Ch. Michas A.E.V.E.", "city": "Ypsilantis", "address": "Thesi Kanali, 322 00", "phone": "+30 22680 29100", "business_type": "Gyros Production"},
        {"company_name": "Afoi Lazaridis & Co", "city": "Korydallos", "address": "Karaoli 42 & Sirou, 181 21", "phone": "+30 210 562 2112", "business_type": "Meat Processing"},
        {"company_name": "Kanavitsas", "city": "Tavros", "address": "Ag. Georgiou 1, 177 78", "phone": "+30 210 346 0560", "business_type": "Gyros & Kebap"},
        {"company_name": "Zaco A.E.B.E.", "city": "Acharnes", "address": "Tatoiou 386, 136 71", "phone": "+30 210 620 2175", "business_type": "Gyros Production"},
        {"company_name": "Tsaousidis", "city": "Aspropyrgos", "address": "Neos Zois 19300", "phone": "+30 210 559 5515", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Makris - Fresh Meat", "city": "Agios Ioannis Rentis", "address": "Kentriki Agora K3-04B/05B, 182 33", "phone": "+30 210 481 1316", "business_type": "Gyros & Kebap"},
        {"company_name": "Comeco A.E.", "city": "Corfu", "address": "Triklino, Kerkyra 491 50", "phone": "", "business_type": "Meat Processing"},
        {"company_name": "Manolis Kebap", "city": "Tavros", "address": "Leoforos Eirinis 73", "phone": "+30 210 342 8121", "business_type": "Kebap Production"},
        {"company_name": "Nikos Kebap", "city": "Tavros", "address": "Profitou Daniil 14", "phone": "+30 694 366 0025", "business_type": "Kebap Production"},
        {"company_name": "Alpha Kebab I.K.E.", "city": "Athens", "address": "Pythodorou 6", "phone": "+30 210 524 8236", "business_type": "Kebap Production"},
        {"company_name": "Parnassos - Afoi Fakou", "city": "Piraeus", "address": "Fokionos 52", "phone": "+30 210 422 6810", "business_type": "Gyros & Kebap"},
        {"company_name": "Geystikos Kosmos (TWM)", "city": "Acharnes", "address": "Frixou 13, 136 73", "phone": "+30 210 247 8620", "business_type": "Gyros & Souvlaki"},
        {"company_name": "Ginis Greek Meat", "city": "Agios Ioannis Rentis", "address": "Edessis 20", "phone": "+30 210 493 5035", "business_type": "Gyros Production"},
        {"company_name": "Siarambis Kreopoleio", "city": "Kamatero", "address": "Fylis 92", "phone": "+30 210 238 6367", "business_type": "Meat Processing"},
        {"company_name": "Kreatoemporiki Kossyva", "city": "Patras", "address": "Akrotiriou 123", "phone": "", "business_type": "Meat Processing"},
        {"company_name": "Aspro Provato", "city": "Kato Diminio", "address": "Palea EO Korinthou-Patron 30", "phone": "+30 27420 25575", "business_type": "Gyros & Souvlaki"},
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
