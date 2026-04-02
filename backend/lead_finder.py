"""
Lead Finder Module - Dynamic AI-Powered Factory Search
Uses AI to find meat production factories worldwide
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


class LeadFinder:
    """Factory finder using AI search with user-defined keywords"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('GEMINI_API_KEY')
    
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 100
    ) -> List[FoundLead]:
        """Search for factories using AI with user keywords"""
        
        if not self.api_key:
            logger.error("No API key found for AI search")
            return []
        
        return await self._search_with_ai(keywords, location, country, limit)
    
    async def _search_with_ai(
        self, 
        keywords: List[str],
        location: str, 
        country: str, 
        limit: int
    ) -> List[FoundLead]:
        """Use AI to search for factories with user-provided keywords"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            location_str = f"{location} şehrinde" if location and location.lower() != 'all' else "tüm şehirlerde"
            keywords_str = ", ".join(keywords)
            
            system_prompt = f"""Sen bir B2B endüstriyel araştırma uzmanısın. SADECE GERÇEK fabrikaları ve üretim tesislerini bulacaksın.

## KESİN KURALLAR - MUTLAKA UYULMALI:

1. **SADECE ÜRETİM TESİSLERİ**: 
   - Döner üretim fabrikası ✓
   - Gyros üretim tesisi ✓
   - Kebap üretim fabrikası ✓
   - Et işleme tesisi ✓
   - Toptan et deposu ✓

2. **YASAK - KESİNLİKLE DÖNDÜRME**:
   - Restaurant ❌
   - Imbiss ❌
   - Fast food ❌
   - Bistro ❌
   - Grill ❌
   - Döner dükkanı ❌
   - Kebap evi ❌
   - Gyros lokantası ❌
   - Takeaway ❌
   - Kiosk ❌

3. **ŞİRKET ADI KURALI**:
   Şirket adında yasal ek olmalı:
   - Almanya: GmbH, GmbH & Co. KG, AG, e.K., SE
   - İspanya: S.A., S.L., S.L.U.
   - Romanya: S.R.L., S.A.
   - Yunanistan: A.E., E.P.E., O.E.
   - Türkiye: A.Ş., Ltd. Şti.
   - Genel: Ltd, Inc, BV, NV

4. **VERİ KALİTESİ**:
   - GERÇEK, var olan şirketler
   - Telefon numarası varsa ekle
   - Adres bilgisi varsa ekle
   - Uydurma bilgi YASAK

## ÇIKTI FORMATI (JSON Array):
[
  {{
    "company_name": "Şirket Adı GmbH",
    "city": "Şehir",
    "address": "Tam Adres",
    "phone": "+XX XXX XXXXXXX",
    "business_type": "Döner Üretimi / Gyros Üretimi / Kebap Üretimi / Et İşleme",
    "notes": "Ek bilgi (kapasite, yıl, sertifika vb.)"
  }}
]

SADECE JSON array döndür. Açıklama yazma."""

            user_prompt = f"""**{country}** ülkesinde **{location_str}** şu anahtar kelimelere uygun ÜRETİM FABRİKALARI bul:

Arama kelimeleri: {keywords_str}

## ÖNEMLİ:
- SADECE üretim tesisleri ve fabrikalar
- Restoran, imbiss, fast food KESİNLİKLE OLMASIN
- Minimum {min(limit, 20)} fabrika bul (varsa)
- JSON array formatında döndür"""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"factory-{country}-{location}-{hash(keywords_str)}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.0-flash")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=90.0
            )
            
            return self._parse_response(response, country, location, limit)
            
        except Exception as e:
            logger.error(f"AI search error: {e}")
            return []
    
    def _parse_response(self, response: str, country: str, location: str, limit: int) -> List[FoundLead]:
        """Parse AI response and filter results"""
        leads = []
        
        # Banned words - restaurants and non-factories
        banned_words = [
            'restaurant', 'imbiss', 'grill', 'bistro', 'takeaway', 'kiosk',
            'fast food', 'dükkan', 'lokanta', 'evi', 'house', 'kitchen',
            'cafe', 'bar', 'pub', 'tavern', 'diner', 'eatery', 'pizzeria',
            'restoran', 'lokal', 'gastro', 'snack', 'express'
        ]
        
        try:
            text = response.strip()
            
            # Clean markdown formatting
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
                data = json.loads(text[start_idx:end_idx])
                
                for item in data:
                    if not isinstance(item, dict) or not item.get('company_name'):
                        continue
                    
                    company_name = item.get('company_name', '')
                    name_lower = company_name.lower()
                    
                    # Skip if contains banned words
                    if any(banned in name_lower for banned in banned_words):
                        logger.info(f"Filtered out (restaurant): {company_name}")
                        continue
                    
                    # Verify has legal suffix (factory indicator)
                    legal_suffixes = [
                        'gmbh', 'ag', 'e.k.', 'se', 'kg', 'ohg',  # German
                        's.a.', 's.l.', 's.l.u.',  # Spanish
                        's.r.l.',  # Romanian/Italian
                        'a.e.', 'e.p.e.', 'o.e.', 'i.k.e.',  # Greek
                        'a.ş.', 'ltd', 'şti',  # Turkish
                        'b.v.', 'n.v.',  # Dutch
                        'inc', 'llc', 'corp'  # International
                    ]
                    
                    has_legal_suffix = any(suffix in name_lower for suffix in legal_suffixes)
                    
                    # Also accept if contains production keywords
                    production_keywords = [
                        'produktion', 'production', 'üretim', 'fabrik', 'factory',
                        'işleme', 'processing', 'meat', 'fleisch', 'et ', 'food'
                    ]
                    has_production_keyword = any(kw in name_lower for kw in production_keywords)
                    
                    if not has_legal_suffix and not has_production_keyword:
                        logger.info(f"Filtered out (no legal suffix): {company_name}")
                        continue
                    
                    lead = FoundLead(
                        company_name=company_name,
                        city=item.get('city', location if location != 'all' else ''),
                        country=country,
                        address=item.get('address', ''),
                        phone=item.get('phone', ''),
                        business_type=item.get('business_type', 'Döner/Kebap Üretimi'),
                        notes=item.get('notes', '')
                    )
                    leads.append(lead)
                    
                    if len(leads) >= limit:
                        break
                        
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
