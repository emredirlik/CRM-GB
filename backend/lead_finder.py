"""
Lead Finder Module - Uses Gemini API to find potential business leads
"""
import os
import json
import logging
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
        limit: int = 50
    ) -> List[FoundLead]:
        """
        Search for potential leads based on keywords and location using Gemini
        """
        if not self.api_key:
            logger.error("No Gemini API key configured")
            return []
        
        combined_query = ", ".join(keywords)
        
        # Run multiple searches to get more results
        all_leads = []
        
        # Primary search
        query1 = f"{combined_query} manufacturers producers in {location} {country}"
        leads1 = await self._search_with_gemini(query1, country, location, limit)
        all_leads.extend(leads1)
        
        # Secondary search with specific terms
        if len(all_leads) < limit:
            query2 = f"gyros döner kebab souvlaki meat processing factory company in {location} {country}"
            leads2 = await self._search_with_gemini(query2, country, location, limit)
            all_leads.extend(leads2)
        
        # Third search for food industry
        if len(all_leads) < limit:
            query3 = f"food manufacturer wholesale meat supplier spice factory in {location} {country}"
            leads3 = await self._search_with_gemini(query3, country, location, limit)
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
    
    async def _search_with_gemini(
        self, 
        query: str, 
        country: str, 
        location: str, 
        limit: int
    ) -> List[FoundLead]:
        """Use Gemini API to find leads"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            system_prompt = f"""You are a business research assistant helping to find food industry companies.

Your task is to list REAL businesses that match the search criteria.
Focus on gyros, döner, kebab, souvlaki, meat processing, spice/seasoning manufacturers.

Return your response as a JSON array with this structure:
[
  {{
    "company_name": "Company Name (REQUIRED)",
    "contact_person": "Contact name if known",
    "email": "email@example.com",
    "phone": "+30 XXX XXX XXXX",
    "address": "Full street address",
    "city": "{location}",
    "country": "{country}",
    "website": "https://example.com",
    "business_type": "Gyros Manufacturer / Meat Processor / etc",
    "notes": "Brief description"
  }}
]

IMPORTANT RULES:
1. Return AT LEAST 20-30 companies from {location}, {country}
2. Only include REAL companies that actually exist
3. city MUST be {location}
4. country MUST be {country}
5. company_name is REQUIRED for every entry
6. Return ONLY the JSON array, no other text"""

            user_prompt = f"""Find ALL businesses matching: "{query}"

Location: {location}, {country}

List as many real gyros, döner, kebab, souvlaki, meat processing, and food manufacturing companies as you can find in this location.

Include:
- Large manufacturers
- Small/medium producers  
- Wholesale suppliers
- Industrial food processors
- Spice and seasoning companies
- Meat cutting/processing plants

Return at least 20-30 companies as a JSON array."""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"lead-search-{location}-{country}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.5-flash")
            
            message = UserMessage(text=user_prompt)
            response = await chat.send_message(message)
            
            # Parse the response
            return self._parse_gemini_response(response, country, location)
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return []
    
    def _parse_gemini_response(self, response: str, country: str, location: str) -> List[FoundLead]:
        """Parse Gemini response into FoundLead objects"""
        leads = []
        try:
            # Clean response - remove markdown code blocks if present
            text = response.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            if text.endswith("```"):
                text = text[:-3]
            
            # Find JSON array in response
            start_idx = text.find('[')
            end_idx = text.rfind(']') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                data = json.loads(json_str)
                
                for item in data:
                    if isinstance(item, dict) and item.get('company_name'):
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
                            notes=item.get('notes')
                        )
                        leads.append(lead)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
        except Exception as e:
            logger.error(f"Parse error: {e}")
        
        return leads
