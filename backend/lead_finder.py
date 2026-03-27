"""
Lead Finder Service - Automatically finds potential B2B leads
Uses Kimi K2.5 AI to find businesses matching criteria
"""
import os
import re
import json
import asyncio
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
import httpx

logger = logging.getLogger(__name__)

@dataclass
class FoundLead:
    company_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None

class LeadFinderService:
    """Service to find potential B2B leads using Kimi K2.5 AI"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Moonshot AI base URL for Kimi K2.5
        self.base_url = "https://api.moonshot.cn/v1"
        
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 50
    ) -> List[FoundLead]:
        """
        Search for potential leads based on keywords and location
        """
        combined_query = ", ".join(keywords)
        query = f"{combined_query} manufacturers producers suppliers in {location} {country}"
        
        # Run multiple searches to get more results
        all_leads = []
        
        # Primary search with main keywords
        leads1 = await self._search_with_kimi(query, country, location, limit)
        all_leads.extend(leads1)
        
        # Secondary search with specific industry terms
        if len(all_leads) < limit:
            query2 = f"gyros döner kebab souvlaki meat processing factory in {location} {country}"
            leads2 = await self._search_with_kimi(query2, country, location, limit)
            all_leads.extend(leads2)
        
        # Third search for wholesale suppliers
        if len(all_leads) < limit:
            query3 = f"wholesale meat supplier food manufacturer in {location} {country}"
            leads3 = await self._search_with_kimi(query3, country, location, limit)
            all_leads.extend(leads3)
        
        # Deduplicate by company name
        seen = set()
        unique_leads = []
        for lead in all_leads:
            if lead.company_name:
                key = lead.company_name.lower().strip()
                if key not in seen:
                    seen.add(key)
                    unique_leads.append(lead)
        
        return unique_leads[:limit]
    
    async def _search_with_kimi(self, query: str, country: str, location: str, limit: int) -> List[FoundLead]:
        """Use Kimi K2.5 to search and extract business information"""
        
        system_prompt = f"""You are an expert B2B lead researcher specializing in the food manufacturing industry.
Your task is to provide real business names for companies that manufacture gyros, döner, kebab, souvlaki, and similar meat products.

**CRITICAL LOCATION REQUIREMENT:**
- The user is searching for businesses in **{location}** city in **{country}**.
- You MUST ONLY return companies that are physically located in or very near **{location}** city.
- Do NOT include companies from other cities or regions within {country}.

IMPORTANT: Return AT LEAST 15-25 companies from {location} specifically. Be comprehensive.

You must return a JSON array with real companies. Each company MUST have:
- company_name: The actual name of the company (REQUIRED, cannot be null)
- email: Business email address if known (can be null)
- phone: Business phone number if known (can be null)
- address: Physical address if known (should include {location} city)
- city: MUST be "{location}" or nearby suburb (REQUIRED)
- country: "{country}" (REQUIRED)
- website: Company website URL if known (can be null)
- description: Brief description of what they produce

Include companies from these categories (ONLY if they are in {location}):
1. Meat processing plants and factories
2. Gyros/döner meat producers
3. Kebab manufacturers
4. Food processing companies
5. Wholesale meat suppliers
6. Industrial food producers
7. Spice and seasoning suppliers for meat industry

IMPORTANT RULES:
1. company_name is REQUIRED - never return null for company_name
2. ONLY include companies physically located in {location} city
3. Focus on B2B manufacturers and suppliers, NOT restaurants
"""
        
        user_prompt = f"""Find ALL businesses you know that match this search: "{query}"

**LOCATION FILTER: {location}, {country} ONLY**

List gyros, döner, kebab, souvlaki, or meat processing companies that are physically located in {location} city.

Be COMPREHENSIVE. Include:
- Large manufacturers
- Small/medium producers  
- Wholesale suppliers
- Industrial food processors
- Spice and seasoning companies
- Meat cutting/processing plants

Return as a JSON array with AT LEAST 15-25 companies. Remember: 
- company_name is REQUIRED
- city MUST be {location}
- Include as many real businesses as you know"""

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "kimi-k2-0711-preview",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 4096
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Kimi API error: {response.status_code} - {response.text}")
                    # Fallback to emergent integrations if Kimi fails
                    return await self._fallback_search(query, country, location, limit)
                
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                logger.info(f"Kimi K2.5 Response: {content[:500] if content else 'None'}")
                
                # Parse JSON response
                response_text = content.strip() if content else ""
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                
                # Find JSON array in response
                json_match = re.search(r'\[[\s\S]*\]', response_text)
                if json_match:
                    data = json.loads(json_match.group())
                    leads = []
                    for item in data:
                        if not item.get("company_name"):
                            continue
                        lead = FoundLead(
                            company_name=item.get("company_name"),
                            email=item.get("email"),
                            phone=item.get("phone"),
                            address=item.get("address"),
                            city=item.get("city", location),
                            country=item.get("country", country),
                            website=item.get("website"),
                            description=item.get("description"),
                            source="Kimi K2.5 AI Search"
                        )
                        leads.append(lead)
                    return leads
                
                return []
                
        except Exception as e:
            logger.error(f"Kimi K2.5 search failed: {str(e)}")
            # Fallback to emergent integrations
            return await self._fallback_search(query, country, location, limit)
    
    async def _fallback_search(self, query: str, country: str, location: str, limit: int) -> List[FoundLead]:
        """Fallback to Emergent Integrations if Kimi fails"""
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        emergent_key = os.environ.get('EMERGENT_LLM_KEY')
        if not emergent_key:
            return []
            
        system_prompt = f"""You are a B2B lead researcher. Find companies in {location}, {country} that manufacture gyros, döner, kebab, or meat products. Return a JSON array with company_name, email, phone, address, city, country, website, description."""
        
        user_prompt = f"""Find businesses: "{query}" in {location}, {country}. Return JSON array."""

        try:
            chat = LlmChat(
                api_key=emergent_key,
                session_id=f"lead-search-fallback-{hash(query)}",
                system_message=system_prompt
            ).with_model("openai", "gpt-5.2")
            
            response = await chat.send_message(UserMessage(text=user_prompt))
            
            response_text = response.strip() if response else ""
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                data = json.loads(json_match.group())
                leads = []
                for item in data:
                    if not item.get("company_name"):
                        continue
                    lead = FoundLead(
                        company_name=item.get("company_name"),
                        email=item.get("email"),
                        phone=item.get("phone"),
                        address=item.get("address"),
                        city=item.get("city", location),
                        country=item.get("country", country),
                        website=item.get("website"),
                        description=item.get("description"),
                        source="AI Search (Fallback)"
                    )
                    leads.append(lead)
                return leads
            
            return []
            
        except Exception as e:
            logger.error(f"Fallback search failed: {str(e)}")
            return []

    async def enrich_lead(self, lead: FoundLead) -> FoundLead:
        """Try to find additional information for a lead using Kimi K2.5"""
        if lead.email and lead.phone:
            return lead
            
        prompt = f"""Find contact information for this company:
Company: {lead.company_name}
Location: {lead.city}, {lead.country}
Website: {lead.website or 'Unknown'}

Return as JSON:
{{"email": "...", "phone": "...", "address": "..."}}

If you can't find specific info, return null for those fields."""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "kimi-k2-0711-preview",
                        "messages": [
                            {"role": "system", "content": "You are a business information researcher. Find accurate contact details."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 500
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    json_match = re.search(r'\{[\s\S]*\}', content)
                    if json_match:
                        data = json.loads(json_match.group())
                        if data.get("email") and not lead.email:
                            lead.email = data["email"]
                        if data.get("phone") and not lead.phone:
                            lead.phone = data["phone"]
                        if data.get("address") and not lead.address:
                            lead.address = data["address"]
            
            return lead
            
        except Exception as e:
            logger.error(f"Lead enrichment failed: {str(e)}")
            return lead


# Predefined search templates for food industry
SEARCH_TEMPLATES = {
    "greece_gyros": {
        "keywords": [
            "gyros meat producer",
            "gyros manufacturer", 
            "döner kebab factory",
            "souvlaki meat supplier",
            "kebab producer wholesale"
        ],
        "country": "Greece"
    },
    "germany_doner": {
        "keywords": [
            "döner production",
            "kebab hersteller",
            "döner fleisch produzent",
            "gyros hersteller"
        ],
        "country": "Germany"
    },
    "turkey_kebab": {
        "keywords": [
            "kebab üretici",
            "döner fabrikası",
            "et işleme tesisi"
        ],
        "country": "Turkey"
    },
    "europe_meat": {
        "keywords": [
            "meat processing factory",
            "döner meat wholesale",
            "gyros production company"
        ],
        "country": "Europe"
    }
}
