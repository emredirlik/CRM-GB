"""
Lead Finder Service - Automatically finds potential B2B leads
Uses web search to find businesses matching criteria
"""
import os
import re
import json
import asyncio
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
import aiohttp
from urllib.parse import quote_plus

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
    """Service to find potential B2B leads using AI-powered search"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.emergentintegrations.ai/v1"
        
    async def search_leads(
        self, 
        keywords: List[str], 
        location: str, 
        country: str,
        limit: int = 20
    ) -> List[FoundLead]:
        """
        Search for potential leads based on keywords and location
        
        Args:
            keywords: List of business types to search (e.g., ["gyros producer", "döner manufacturer"])
            location: City or region (e.g., "Athens")
            country: Country name (e.g., "Greece")
            limit: Maximum number of leads to return
        """
        all_leads = []
        
        for keyword in keywords:
            query = f"{keyword} {location} {country} contact email"
            leads = await self._search_with_ai(query, country, limit // len(keywords))
            all_leads.extend(leads)
        
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
    
    async def _search_with_ai(self, query: str, country: str, limit: int) -> List[FoundLead]:
        """Use AI to search and extract business information"""
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        system_prompt = """You are an expert B2B lead researcher specializing in the food manufacturing industry. 
Your task is to provide real business information for companies that manufacture gyros, döner, kebab, and souvlaki meat products.

You must return a JSON array with real companies. Each company MUST have:
- company_name: The actual name of the company (REQUIRED, cannot be null)
- email: Business email address if known
- phone: Business phone number if known  
- address: Physical address if known
- city: City where the company is located
- country: Country where the company is located
- website: Company website URL if known
- description: Brief description of what they produce

Example of expected output:
[
  {
    "company_name": "Kronos Foods",
    "email": "info@kronosfoods.com",
    "phone": "+30 210 5551234",
    "address": "Industrial Zone, Aspropyrgos",
    "city": "Athens",
    "country": "Greece",
    "website": "https://kronosfoods.com",
    "description": "Large-scale gyros and döner meat producer for restaurants and food service"
  }
]

IMPORTANT RULES:
1. company_name is REQUIRED - never return null for company_name
2. Only include companies you have knowledge about
3. Focus on B2B manufacturers and suppliers, NOT restaurants
4. If you don't know specific contact details, you can leave those as null, but company_name MUST be provided
"""
        
        user_prompt = f"""Find {limit} real businesses that match this search: "{query}"

These should be gyros, döner, kebab, or souvlaki meat manufacturers, producers, or wholesale suppliers in or near {country}.
Focus on B2B companies that supply to restaurants and food service businesses.

Return the results as a JSON array. Remember: company_name is REQUIRED for each entry."""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"lead-search-{hash(query)}",
                system_message=system_prompt
            ).with_model("openai", "gpt-5.2")
            
            response = await chat.send_message(UserMessage(text=user_prompt))
            
            logger.info(f"AI Response: {response[:500] if response else 'None'}")
            
            # Parse JSON response
            response_text = response.strip() if response else ""
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
                    # Skip entries without company_name
                    if not item.get("company_name"):
                        continue
                    lead = FoundLead(
                        company_name=item.get("company_name"),
                        email=item.get("email"),
                        phone=item.get("phone"),
                        address=item.get("address"),
                        city=item.get("city", ""),
                        country=item.get("country", country),
                        website=item.get("website"),
                        description=item.get("description"),
                        source="AI Search"
                    )
                    leads.append(lead)
                return leads
            
            return []
            
        except Exception as e:
            logger.error(f"AI search failed: {str(e)}")
            return []

    async def enrich_lead(self, lead: FoundLead) -> FoundLead:
        """Try to find additional information for a lead"""
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        if lead.email and lead.phone:
            return lead  # Already has contact info
            
        prompt = f"""Find contact information for this company:
Company: {lead.company_name}
Location: {lead.city}, {lead.country}
Website: {lead.website or 'Unknown'}

Return as JSON:
{{"email": "...", "phone": "...", "address": "..."}}

If you can't find specific info, return null for those fields."""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"enrich-{hash(lead.company_name)}",
                system_message="You are a business information researcher. Find accurate contact details."
            ).with_model("openai", "gpt-5.2")
            
            response = await chat.send_message(UserMessage(text=prompt))
            
            # Parse response
            json_match = re.search(r'\{[\s\S]*\}', response)
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
