"""
Lead Finder Module - Verified Factory Database + AI Search
Uses real verified factory data for Germany and Greece
AI search for other countries
"""
import asyncio
import aiohttp
import logging
import re
import json
import os
from typing import List, Optional
from pydantic import BaseModel
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


# ============================================
# VERIFIED GERMAN DÖNER FACTORIES
# ============================================
GERMAN_FACTORIES = [
    {"company_name": "Polat Dönerproduktion GmbH", "city": "Mönchengladbach", "phone": "+49 2161 464770", "business_type": "Döner Produktion", "notes": "1996'dan beri, NRW'de ilk EC onaylı"},
    {"company_name": "ÖZTAS Fleischhandel & Dönerproduktion e.K.", "city": "Moers", "phone": "+49 2841 99830", "business_type": "Döner Produktion", "notes": "Günlük 40+ ton, 1994'ten beri"},
    {"company_name": "AVRASYA DönerProduktion & Fleischgrosshandels GmbH", "city": "Düsseldorf", "business_type": "Döner Produktion"},
    {"company_name": "AKGÜL Fleischhandel & Doner Produktion", "city": "Viersen", "business_type": "Döner Produktion"},
    {"company_name": "Frostpack Geflügelverarbeitung GmbH", "city": "Paderborn", "business_type": "Döner Produktion"},
    {"company_name": "Zirve Dönerproduktion Ltd.", "city": "Essen", "business_type": "Döner Produktion", "notes": "Geçici izinli"},
    {"company_name": "Ozer Döner Produktion GmbH", "city": "Heinsberg", "business_type": "Döner Produktion"},
    {"company_name": "Atik Döner GmbH", "city": "Bochum", "business_type": "Döner Produktion", "notes": "Almanya'nın önde gelen üreticilerinden"},
    {"company_name": "BEY GmbH Dönerproduktion", "city": "Krefeld", "business_type": "Döner Produktion"},
    {"company_name": "NEFIS Dönerproduktion & Fleischhandels GmbH", "city": "Duisburg", "business_type": "Döner Produktion"},
    {"company_name": "Ercan Donerproduktion GmbH", "city": "Gelsenkirchen", "business_type": "Döner Produktion"},
    {"company_name": "Kismet Fleisch Döner Produktion", "city": "Köln", "phone": "+49 221 9763700", "business_type": "Döner Produktion", "notes": "2001'den beri, 20-49 çalışan"},
    {"company_name": "Düzgün Food GmbH", "city": "Köln", "phone": "+49 221 1793550", "business_type": "Döner Produktion", "notes": "320 çalışan, 3 tesis, günlük 40-60 ton"},
    {"company_name": "Tuna Food", "city": "Köln", "business_type": "Döner Produktion"},
    {"company_name": "AC Gastro GmbH", "city": "Köln", "business_type": "Döner Produktion", "notes": "5-9 çalışan"},
    {"company_name": "Öztürk Döner Produktion GmbH & Co.KG", "city": "Waldburg/Ravensburg", "business_type": "Döner Produktion", "notes": "1995'ten beri, aile işletmesi"},
    {"company_name": "Birtat / Meat World SE", "city": "Ludwigsburg", "business_type": "Döner Produktion", "notes": "Günlük 35-40 ton, 30+ yıl"},
    {"company_name": "CarnEt Fleisch GmbH", "city": "Stuttgart", "business_type": "Döner Produktion", "notes": "Helal sertifikalı"},
    {"company_name": "BDK - Berlin Döner Kebab", "city": "Berlin", "phone": "+49 30 4613920", "business_type": "Döner Produktion", "notes": "1978'den beri, 3 fabrika (Berlin+Polonya), 30 ülkeye ihracat"},
    {"company_name": "Kap-lan Dönerproduktion", "city": "Berlin", "business_type": "Döner Produktion"},
    {"company_name": "Carnivora GmbH", "city": "Berlin", "business_type": "Döner Produktion", "notes": "100-199 çalışan"},
    {"company_name": "Farmers Food", "city": "Berlin", "business_type": "Döner Produktion", "notes": "Döner endüstrisi tedarikçisi"},
    {"company_name": "Finalta Döner", "city": "Berlin", "business_type": "Döner Produktion"},
    {"company_name": "Narin Döner", "city": "Berlin", "business_type": "Döner Produktion"},
    {"company_name": "Tek Döner", "city": "Berlin", "address": "Max-Urich-Str. 1-9, 13355 Berlin", "business_type": "Döner Produktion"},
    {"company_name": "MY FOOD MS GMBH", "city": "Pulheim-Brauweiler", "business_type": "Döner Produktion", "notes": "2009'dan beri"},
    {"company_name": "Efsane / Kaya Dönerproduktion GmbH", "city": "Wittstock", "business_type": "Döner Produktion", "notes": "Berlin kuzeybatısı, 2009'dan beri"},
    {"company_name": "ÖzDöner", "city": "Germany", "business_type": "Döner Produktion", "notes": "Türkiye ve Almanya'da üretim"},
    {"company_name": "NUR Helal Döner Produktion GmbH", "city": "Hamburg", "business_type": "Döner Produktion", "notes": "30+ yıl tecrübe, Helal sertifikalı"},
    {"company_name": "Namm Helal Döner und Fleischhandel", "city": "Hamburg", "business_type": "Döner Produktion"},
    {"company_name": "Tadim Döner GmbH", "city": "Velten", "business_type": "Döner Produktion"},
    {"company_name": "Kama Dönerproduktion", "city": "Barenthin", "business_type": "Döner Produktion"},
    {"company_name": "Yeni Istikbal Kebab GmbH", "city": "Treuen", "business_type": "Kebab Produktion"},
    {"company_name": "ADIM Dönerproduktion GmbH", "city": "Großröhrsdorf", "business_type": "Döner Produktion"},
    {"company_name": "Dündar Dönerproduktion", "city": "Neunkirchen", "business_type": "Döner Produktion"},
    {"company_name": "Tekdemir GmbH Kebab-Produktion", "city": "Saarbrücken", "business_type": "Kebab Produktion"},
    {"company_name": "Euro Döner GmbH & Co. KG", "city": "Eisenach", "business_type": "Döner Produktion"},
    {"company_name": "Dostlar Group", "city": "Frankfurt", "business_type": "Döner Produktion", "notes": "2 üretim tesisi, 1999'dan beri"},
    {"company_name": "Öztek Döner Vertriebs GmbH", "city": "München", "business_type": "Döner Produktion", "notes": "2010'dan beri, Helal"},
    {"company_name": "Eroğlu Döner GmbH & Co. KG", "city": "Hannover", "business_type": "Döner Produktion", "notes": "19+ yıl"},
    {"company_name": "ADA Food", "city": "Bremen", "business_type": "Döner Produktion"},
    {"company_name": "Mamado Ready Doner", "city": "Düsseldorf", "business_type": "Döner Produktion"},
    {"company_name": "Avrupa Kebap", "city": "Köthen", "business_type": "Kebab Produktion"},
    {"company_name": "YOLDAS Dönerproduktion GmbH", "city": "Dortmund", "business_type": "Döner Produktion"},
    {"company_name": "TEKDEMIR Dönerproduktion GmbH", "city": "Mannheim", "business_type": "Döner Produktion"},
    {"company_name": "ÖZ Ustam GmbH", "city": "Nürnberg", "business_type": "Döner Produktion"},
    {"company_name": "First Orient-Food GmbH", "city": "Leipzig", "business_type": "Döner Produktion"},
    {"company_name": "Doner&Fleisch Großhandel Ozgun Deniz Cam", "city": "Dortmund", "business_type": "Döner Produktion"},
]

# ============================================
# VERIFIED GREEK GYROS FACTORIES
# ============================================
GREEK_FACTORIES = [
    {"company_name": "Megas Yeeros A.E.", "city": "Aspropyrgos", "address": "Leoforos Nato 100, Aspropyrgos 193 00", "phone": "+30 210 558 4098", "business_type": "Gyros Üretimi", "notes": "Günlük 35 ton - Dünyanın en büyüğü"},
    {"company_name": "Elvida Foods S.A.", "city": "Peristeri", "address": "Stylianou Gonata 40, Peristeri 121 33", "phone": "+30 210 578 5051", "business_type": "Gyros Üretimi", "notes": "Günlük 20 ton, 20+ ülkeye ihracat"},
    {"company_name": "Nostimost", "city": "Peristeri", "address": "Stylianou Gonata 40, Peristeri 121 33", "phone": "+30 210 578 5051", "business_type": "Gyros Üretimi", "notes": "ISO, BRC, IFS, Helal sertifikalı"},
    {"company_name": "Creta Farms A.E.", "city": "Athens", "address": "23o km Athinon-Lamias, Kryoneri", "phone": "+30 210 626 0000", "business_type": "Gyros Üretimi", "notes": "%100 Yunan eti"},
    {"company_name": "Aifantis Grubu", "city": "Agrinio", "address": "Acheloos Bridge, Agrinio 301 00", "phone": "+30 26410 91990", "business_type": "Gyros Üretimi", "notes": "4.500 m² tesis"},
    {"company_name": "Nanos A.E.B.E.", "city": "Aspropyrgos", "address": "Thesi Tzaverdela, Aspropyrgos 193 00", "phone": "+30 210 559 0994", "business_type": "Gyros Üretimi"},
    {"company_name": "PFS Foods", "city": "Larisa", "address": "10o km EO Larisa-Ampelona, Ampelonas 404 00", "phone": "+30 2410 942 069", "business_type": "Gyros Üretimi"},
    {"company_name": "Kasidis S.A.", "city": "Tyrnavos", "address": "1o km EO Tyrnavou-Larisas, Tyrnavos 401 00", "phone": "+30 2410 831 520", "business_type": "Gyros Üretimi", "notes": "1885'ten beri"},
    {"company_name": "King's Gyros S.A.", "city": "Agios Ioannis Rentis", "address": "Dimitratou Aristeidi 26, 182 33", "phone": "+30 210 481 0009", "business_type": "Gyros Üretimi"},
    {"company_name": "DHQ", "city": "Aspropyrgos", "address": "Neos Zois, Aspropyrgos 193 00", "phone": "+30 210 559 5515", "business_type": "Gyros Üretimi", "notes": "4.000 m² tesis"},
    {"company_name": "Pindos A.E.B.E.", "city": "Ioannina", "address": "Ioannina, Epir", "phone": "+30 26510 25100", "business_type": "Tavuk Gyros", "notes": "374 milyon € ciro"},
    {"company_name": "Vikrea A.E.B.E.", "city": "Kavala", "address": "7o km Kavala-Eleftheroupolis, 641 00", "phone": "+30 2510 327011", "business_type": "Gyros Üretimi", "notes": "40+ yıllık"},
    {"company_name": "Kreka A.E.", "city": "Kavala", "address": "Perni, Chrysoupoli 642 00, Kavala", "phone": "+30 25910 42100", "business_type": "Gyros Üretimi", "notes": "1971'den beri, halka açık"},
    {"company_name": "TWM A.E.B.E.", "city": "Acharnes", "address": "Frixou 13, Acharnes 136 73", "phone": "+30 210 247 8620", "business_type": "Gyros Üretimi", "notes": "Modern fabrika"},
    {"company_name": "Top Meat", "city": "Tavros", "address": "Profitou Daniil 14, Tavros 177 78", "phone": "+30 210 341 4201", "business_type": "Gyros Üretimi"},
    {"company_name": "Vittos Family", "city": "Agios Ioannis Rentis", "address": "Papadopoulou 22, 182 33", "phone": "+30 210 483 7001", "business_type": "Gyros Üretimi", "notes": "40+ yıl"},
    {"company_name": "Andriopoulos", "city": "Peristeri", "address": "Kifisou 112, Peristeri 121 33", "phone": "+30 210 573 5901", "business_type": "Gyros Üretimi"},
    {"company_name": "Savvas Kebap A.E.", "city": "Agioi Anargyroi", "address": "Dimokratias 62", "phone": "+30 210 576 6175", "business_type": "Kebap Üretimi", "notes": "1925'ten beri"},
    {"company_name": "Batanian Bros", "city": "Koropi", "address": "Anaxagora 6, Koropi 194 00", "phone": "+30 210 662 0046", "business_type": "Kebap Üretimi", "notes": "1922'den beri"},
    {"company_name": "Pozatzidis", "city": "Piraeus", "address": "Ipeirou 7 & Echelidon, 185 40", "phone": "+30 213 037 5140", "business_type": "Kebap Üretimi"},
    {"company_name": "Psichogios Delicatessen", "city": "Likovrisi", "address": "Leoforos Sofokli Venizelou 92, 141 23", "phone": "+30 210 282 9759", "business_type": "Gyros Üretimi"},
    {"company_name": "JM Group (Meïdanis)", "city": "Mandra", "address": "Samou 34 & Antigonis, 196 00", "phone": "+30 210 554 0070", "business_type": "Et İşleme"},
    {"company_name": "Bozionelos", "city": "Moschato", "address": "Pyrgou 27, 183 44", "phone": "+30 210 481 8964", "business_type": "Gyros Üretimi"},
    {"company_name": "Brothers Meat O.E.", "city": "Agios Ioannis Rentis", "address": "P. Nikolaidi 30, 182 33", "phone": "+30 210 482 3002", "business_type": "Et İşleme"},
    {"company_name": "Serafeim Zavvos", "city": "Nikaia", "address": "Karaiskaki 16, 184 53", "phone": "+30 210 493 6413", "business_type": "Gyros Üretimi"},
    {"company_name": "Stohos", "city": "Tavros", "address": "Peiraios 226, 177 78", "phone": "+30 210 942 2204", "business_type": "Et İşleme"},
    {"company_name": "Belle Meat", "city": "Acharnes", "address": "Ortansias 25, 136 71", "phone": "+30 210 559 5135", "business_type": "Gyros Üretimi"},
    {"company_name": "Manibus Premium", "city": "Ilion", "address": "Nikopoleos 25, 131 22", "phone": "+30 210 501 5888", "business_type": "Gyros Üretimi"},
    {"company_name": "Lampridis Family", "city": "Acharnes", "address": "Konstantinoupoleos 441, 136 71", "phone": "+30 210 574 5705", "business_type": "Gyros Üretimi"},
    {"company_name": "Meat Farm", "city": "Ano Liosia", "address": "Ano Liosia, Attiki", "business_type": "Gyros Üretimi"},
    {"company_name": "Chamakos - Ileiakos", "city": "Pyrgos", "address": "Prasino, 271 50, Ileia", "phone": "+30 26210 23816", "business_type": "Gyros Üretimi"},
    {"company_name": "Panitsas - Kreatagora", "city": "Patras", "address": "Viomihaniki Periochi Patras 252 00", "phone": "+30 2610 701369", "business_type": "Et İşleme"},
    {"company_name": "Alexandros A.V.E.E.", "city": "Serres", "address": "7o km EO Serres-Selanik", "phone": "+30 23210 75498", "business_type": "Gyros Üretimi"},
    {"company_name": "Andreas Petikas", "city": "Thessaloniki", "address": "15o km EO Selanik-Perea", "phone": "+30 2310 472214", "business_type": "Gyros Üretimi"},
    {"company_name": "Quality Farm Ltd", "city": "Kavala", "address": "BIPE (BİO.PA.) Kavala", "phone": "+30 695 181 8650", "business_type": "Gyros Üretimi"},
    {"company_name": "Bovillage", "city": "Halandri", "address": "Leoforos Pentelis 72, 152 34", "phone": "+30 210 689 1624", "business_type": "Et İşleme"},
    {"company_name": "Agora Kreton Amfilohias", "city": "Ilion", "address": "Agiou Nikolaou 28, 131 22", "phone": "+30 698 424 0050", "business_type": "Et İşleme"},
    {"company_name": "I. Braditsas Trofino", "city": "Molaoi", "address": "48,7 km EO Tarras-Monemvasia", "phone": "+30 27320 22375", "business_type": "Gyros Üretimi"},
    {"company_name": "Afoi Asimaki O.E.", "city": "Goudi", "address": "Georgiou Papandreou 72, 157 73", "phone": "+30 210 775 7075", "business_type": "Et İşleme"},
    {"company_name": "Makris D. Nikolaos", "city": "Agios Ioannis Rentis", "address": "Kentriki Agora K3-04B/05B, 182 33", "phone": "+30 210 481 1316", "business_type": "Gyros Üretimi"},
    {"company_name": "Paterakis A.E.", "city": "Chania", "address": "Sternes Akrotiriou, 731 00", "phone": "+30 28210 66121", "business_type": "Gyros Üretimi"},
    {"company_name": "Meatka A.E.", "city": "Spata", "address": "Thermopylon 20 & Diagora, 190 04", "phone": "+30 210 663 4848", "business_type": "Gyros Üretimi"},
    {"company_name": "Panitsas Andreas & Co", "city": "Patras", "address": "Ileias 193, Kato Ovria", "phone": "+30 2610 521354", "business_type": "Et İşleme"},
    {"company_name": "Ptinotrofikes Artas", "city": "Arta", "address": "10o km EO Arta-Salaora", "phone": "+30 26810 41585", "business_type": "Tavuk Gyros"},
    {"company_name": "Ch. Michas A.E.V.E.", "city": "Ypsilantis", "address": "Thesi Kanali, 322 00", "phone": "+30 22680 29100", "business_type": "Gyros Üretimi"},
    {"company_name": "Afoi Lazaridis & Co", "city": "Korydallos", "address": "Karaoli 42 & Sirou, 181 21", "phone": "+30 210 562 2112", "business_type": "Et İşleme"},
    {"company_name": "Kanavitsas", "city": "Tavros", "address": "Ag. Georgiou 1, 177 78", "phone": "+30 210 346 0560", "business_type": "Gyros Üretimi"},
    {"company_name": "Zaco A.E.B.E.", "city": "Acharnes", "address": "Tatoiou 386, 136 71", "phone": "+30 210 620 2175", "business_type": "Gyros Üretimi"},
    {"company_name": "Tsaousidis", "city": "Aspropyrgos", "address": "Neos Zois 19300", "phone": "+30 210 559 5515", "business_type": "Gyros Üretimi"},
    {"company_name": "Makris - Fresh Meat", "city": "Agios Ioannis Rentis", "address": "Kentriki Agora K3-04B/05B, 182 33", "phone": "+30 210 481 1316", "business_type": "Gyros Üretimi"},
    {"company_name": "Comeco A.E.", "city": "Corfu", "address": "Triklino, Kerkyra 491 50", "business_type": "Et İşleme"},
    {"company_name": "Manolis Kebap", "city": "Tavros", "address": "Leoforos Eirinis 73", "phone": "+30 210 342 8121", "business_type": "Kebap Üretimi"},
    {"company_name": "Nikos Kebap", "city": "Tavros", "address": "Profitou Daniil 14", "phone": "+30 694 366 0025", "business_type": "Kebap Üretimi"},
    {"company_name": "Alpha Kebab I.K.E.", "city": "Athens", "address": "Pythodorou 6", "phone": "+30 210 524 8236", "business_type": "Kebap Üretimi"},
    {"company_name": "Parnassos - Afoi Fakou", "city": "Piraeus", "address": "Fokionos 52", "phone": "+30 210 422 6810", "business_type": "Gyros Üretimi"},
    {"company_name": "Geystikos Kosmos (TWM)", "city": "Acharnes", "address": "Frixou 13, 136 73", "phone": "+30 210 247 8620", "business_type": "Gyros Üretimi"},
    {"company_name": "Ginis Greek Meat", "city": "Agios Ioannis Rentis", "address": "Edessis 20", "phone": "+30 210 493 5035", "business_type": "Gyros Üretimi"},
    {"company_name": "Siarambis Kreopoleio", "city": "Kamatero", "address": "Fylis 92", "phone": "+30 210 238 6367", "business_type": "Et İşleme"},
    {"company_name": "Kreatoemporiki Kossyva", "city": "Patras", "address": "Akrotiriou 123", "business_type": "Et İşleme"},
    {"company_name": "Aspro Provato", "city": "Kato Diminio", "address": "Palea EO Korinthou-Patron 30", "phone": "+30 27420 25575", "business_type": "Gyros Üretimi"},
]


class LeadFinder:
    """Factory finder using verified database + AI search"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('GEMINI_API_KEY')
    
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 100
    ) -> List[FoundLead]:
        """Search for döner/gyros factories"""
        
        country_lower = country.lower()
        location_lower = (location or "").lower()
        
        # Use verified database for Germany and Greece
        if country_lower == "germany":
            return self._get_verified_factories(GERMAN_FACTORIES, location_lower, country, limit)
        elif country_lower == "greece":
            return self._get_verified_factories(GREEK_FACTORIES, location_lower, country, limit)
        else:
            # Use AI for other countries
            if self.api_key:
                return await self._search_with_ai(keywords, location, country, limit)
            return []
    
    def _get_verified_factories(self, factories: list, location: str, country: str, limit: int) -> List[FoundLead]:
        """Get factories from verified database"""
        leads = []
        
        for factory in factories:
            # Filter by location if specified
            if location and location != "all":
                factory_city = (factory.get("city", "") or "").lower()
                if location not in factory_city and factory_city not in location:
                    continue
            
            lead = FoundLead(
                company_name=factory["company_name"],
                city=factory.get("city", ""),
                country=country,
                address=factory.get("address", ""),
                phone=factory.get("phone", ""),
                business_type=factory.get("business_type", "Döner/Gyros Üretimi"),
                notes=factory.get("notes", "Doğrulanmış Fabrika")
            )
            leads.append(lead)
            
            if len(leads) >= limit:
                break
        
        return leads
    
    async def _search_with_ai(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Use AI to search for factories in other countries"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            location_str = f"{location} şehrinde" if location and location.lower() != 'all' else "tüm şehirlerde"
            
            system_prompt = f"""Sen bir B2B iş araştırma uzmanısın. {country} ülkesinde GERÇEK döner, gyros, kebap ÜRETİM FABRİKALARINI bulacaksın.

KURALLAR:
1. SADECE üretim fabrikaları - restoran, imbiss, fast food OLMAZ
2. Şirket adında yasal ek olmalı: GmbH, S.A., S.L., Ltd, B.V., vb.
3. Mümkünse telefon ve adres bilgisi ekle
4. GERÇEK, var olan şirketler olmalı

JSON formatında döndür:
[
  {{"company_name": "Firma Adı S.L.", "city": "Şehir", "address": "Adres", "phone": "Telefon", "business_type": "Döner/Kebap Üretimi", "notes": "Bilgi"}}
]

{limit} fabrika bul. SADECE JSON döndür."""

            user_prompt = f"""{country} ülkesinde {location_str} döner, gyros, kebap ÜRETİM FABRİKALARI bul.

Restoran veya fast food DEĞİL, sadece üretim tesisleri.
JSON array döndür:"""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"factory-{country}-{location}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.0-flash")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=90.0
            )
            
            return self._parse_response(response, country, location)
            
        except Exception as e:
            logger.error(f"AI search error: {e}")
            return []
    
    def _parse_response(self, response: str, country: str, location: str) -> List[FoundLead]:
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
                    if isinstance(item, dict) and item.get('company_name'):
                        # Filter restaurants
                        name = item.get('company_name', '').lower()
                        if any(x in name for x in ['restaurant', 'imbiss', 'grill', 'bistro']):
                            continue
                        
                        lead = FoundLead(
                            company_name=item.get('company_name', ''),
                            city=item.get('city', location if location != 'all' else ''),
                            country=country,
                            address=item.get('address', ''),
                            phone=item.get('phone', ''),
                            business_type=item.get('business_type', 'Döner/Kebap Üretimi'),
                            notes=item.get('notes', '')
                        )
                        leads.append(lead)
                        
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
