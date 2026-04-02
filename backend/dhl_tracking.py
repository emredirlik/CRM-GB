"""
DHL Tracking Service - Uses AI to fetch real tracking data
Supports both DHL Paket and DHL Express
"""
import asyncio
import aiohttp
import logging
import os
import re
import json
from datetime import datetime, timezone
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class DHLTracker:
    """DHL package tracking with AI-powered web lookup"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('GEMINI_API_KEY')
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/html',
            'Accept-Language': 'de-DE,de;q=0.9'
        }
    
    async def track_package(self, tracking_number: str) -> Dict:
        """Track a DHL package by tracking number"""
        tracking_number = tracking_number.strip().upper()
        
        if not tracking_number:
            return self._error_response(tracking_number, "Takip numarası gerekli")
        
        if len(tracking_number) < 10:
            return self._error_response(tracking_number, "Geçersiz takip numarası")
        
        try:
            # Check tracking number format
            is_express = bool(re.match(r'^[A-Z]{2}\d+[A-Z]{2}$', tracking_number)) or tracking_number.startswith('JD')
            
            # Try DHL Paket API first (for domestic German shipments)
            if not is_express:
                result = await self._track_paket(tracking_number)
                if result.get("success") and result.get("status") not in ["not_found", "error"]:
                    return result
            
            # Use AI to look up tracking info online
            if self.api_key:
                result = await self._track_with_ai(tracking_number)
                if result.get("success"):
                    return result
            
            # Return with link for manual check
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": "check_online",
                "status_text": "Online Kontrol Gerekli",
                "current_location": "",
                "events": [],
                "estimated_delivery": None,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "message": "Takip bilgisi için DHL linkine tıklayın",
                "dhl_link": self._get_tracking_link(tracking_number)
            }
            
        except Exception as e:
            logger.error(f"DHL tracking error: {e}")
            return self._error_response(tracking_number, str(e))
    
    def _get_tracking_link(self, tracking_number: str) -> str:
        """Get appropriate DHL tracking URL"""
        if re.match(r'^[A-Z]{2}\d+[A-Z]{2}$', tracking_number) or tracking_number.startswith('JD'):
            return f"https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}"
        return f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
    
    async def _track_paket(self, tracking_number: str) -> Dict:
        """Track via DHL Paket API"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"https://www.dhl.de/int-verfolgen/data/search?piececode={tracking_number}&language=de"
                
                async with session.get(
                    url,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    
                    if response.status == 200:
                        content_type = response.headers.get('Content-Type', '')
                        if 'json' in content_type:
                            data = await response.json()
                            return self._parse_paket_response(data, tracking_number)
        
        except Exception as e:
            logger.error(f"Paket API error: {e}")
        
        return {"success": False}
    
    def _parse_paket_response(self, data: Dict, tracking_number: str) -> Dict:
        """Parse DHL Paket JSON response"""
        try:
            sendungen = data.get("sendungen", [])
            if not sendungen:
                return {"success": False}
            
            shipment = sendungen[0]
            details = shipment.get("sendungsdetails", {})
            verlauf = details.get("sendungsverlauf", {})
            
            status_raw = verlauf.get("aktuellerStatus", "")
            kurzstatus = verlauf.get("kurzStatus", "")
            
            status, status_text = self._map_status(status_raw, kurzstatus)
            
            events = []
            for event in verlauf.get("events", [])[:10]:
                events.append({
                    "date": event.get("datum", ""),
                    "time": event.get("uhrzeit", ""),
                    "location": event.get("ort", ""),
                    "description": event.get("status", "")
                })
            
            location = events[0].get("location", "") if events else ""
            
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": status,
                "status_text": status_text,
                "current_location": location,
                "events": events,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "dhl_link": self._get_tracking_link(tracking_number)
            }
            
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return {"success": False}
    
    async def _track_with_ai(self, tracking_number: str) -> Dict:
        """Use AI to look up tracking info from DHL website"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            system_prompt = """Sen bir kargo takip asistanısın. Kullanıcı DHL takip numarası verecek.

GÖREV: DHL web sitesinden bu kargonun GERÇEK durumunu kontrol et ve bildir.

DHL Takip Linkleri:
- Express: https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id=NUMARA
- Paket: https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=NUMARA

SADECE JSON formatında yanıt ver:
{
    "status": "delivered/in_transit/out_for_delivery/picked_up/customs",
    "status_text": "Durumun Türkçe açıklaması",
    "current_location": "Son konum şehir ve ülke",
    "estimated_delivery": "Tahmini teslimat tarihi veya null",
    "events": [
        {"date": "GG.AA.YYYY", "time": "SS:DD", "location": "Şehir, Ülke", "description": "Ne oldu"}
    ]
}

ÖNEMLİ: 
- GERÇEK takip bilgilerini DHL sitesinden kontrol et
- Kargo Almanya'dan çıkıp başka ülkeye gidebilir (mesela Yunanistan)
- Tüm geçmiş hareketleri listele
- SADECE JSON döndür"""

            user_prompt = f"""DHL Takip Numarası: {tracking_number}

Bu kargonun DHL sitesindeki GERÇEK takip bilgilerini bul.
Kargonun nereden nereye gittiğini, tüm durakları ve son durumunu göster.

JSON formatında yanıt ver."""

            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"dhl-{tracking_number}-{datetime.now().timestamp()}",
                system_message=system_prompt
            ).with_model("gemini", "gemini-2.0-flash")
            
            message = UserMessage(text=user_prompt)
            response = await asyncio.wait_for(
                chat.send_message(message),
                timeout=30.0
            )
            
            return self._parse_ai_response(response, tracking_number)
            
        except asyncio.TimeoutError:
            logger.warning("AI tracking timeout")
            return {"success": False}
        except Exception as e:
            logger.error(f"AI tracking error: {e}")
            return {"success": False}
    
    def _parse_ai_response(self, response: str, tracking_number: str) -> Dict:
        """Parse AI response"""
        try:
            text = response.strip()
            
            # Remove markdown code blocks
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            if text.endswith("```"):
                text = text[:-3]
            
            # Find JSON
            start_idx = text.find('{')
            end_idx = text.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = text[start_idx:end_idx]
                data = json.loads(json_str)
                
                return {
                    "success": True,
                    "tracking_number": tracking_number,
                    "status": data.get("status", "in_transit"),
                    "status_text": data.get("status_text", ""),
                    "current_location": data.get("current_location", ""),
                    "estimated_delivery": data.get("estimated_delivery"),
                    "events": data.get("events", [])[:10],
                    "last_update": datetime.now(timezone.utc).isoformat(),
                    "dhl_link": self._get_tracking_link(tracking_number)
                }
            
            return {"success": False}
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return {"success": False}
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return {"success": False}
    
    def _map_status(self, status_raw: str, kurzstatus: str) -> tuple:
        """Map DHL status to standard status"""
        combined = f"{status_raw} {kurzstatus}".lower()
        
        if any(word in combined for word in ["zugestellt", "delivered"]):
            return ("delivered", "Teslim Edildi")
        elif any(word in combined for word in ["zustellung", "delivery"]):
            return ("out_for_delivery", "Dağıtımda")
        elif any(word in combined for word in ["paketzentrum", "transit", "transport"]):
            return ("in_transit", "Yolda")
        elif any(word in combined for word in ["angenommen", "picked"]):
            return ("picked_up", "Teslim Alındı")
        elif any(word in combined for word in ["zoll", "customs"]):
            return ("customs", "Gümrükte")
        else:
            return ("in_transit", kurzstatus or "İşleniyor")
    
    def _error_response(self, tracking_number: str, error: str) -> Dict:
        return {
            "success": False,
            "tracking_number": tracking_number,
            "status": "error",
            "status_text": f"Hata: {error}",
            "current_location": "",
            "events": [],
            "error": error,
            "last_update": datetime.now(timezone.utc).isoformat(),
            "dhl_link": self._get_tracking_link(tracking_number) if tracking_number else ""
        }


# Status labels
STATUS_LABELS = {
    'tr': {
        'picked_up': 'Teslim Alındı',
        'in_transit': 'Yolda',
        'out_for_delivery': 'Dağıtımda',
        'delivered': 'Teslim Edildi',
        'customs': 'Gümrükte',
        'exception': 'Sorun Var',
        'check_online': 'Online Kontrol',
        'error': 'Hata'
    },
    'de': {
        'picked_up': 'Abgeholt',
        'in_transit': 'Unterwegs',
        'out_for_delivery': 'In Zustellung',
        'delivered': 'Zugestellt',
        'customs': 'Im Zoll',
        'exception': 'Ausnahme',
        'check_online': 'Online prüfen',
        'error': 'Fehler'
    }
}

# Singleton
dhl_tracker = DHLTracker()
