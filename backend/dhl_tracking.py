"""
DHL Tracking Service - Real tracking via DHL API
"""
import asyncio
import aiohttp
import logging
from datetime import datetime, timezone
from typing import Dict, List
import json
import re

logger = logging.getLogger(__name__)

class DHLTracker:
    """DHL package tracking - real tracking data"""
    
    def __init__(self):
        # DHL public tracking endpoint
        self.tracking_url = "https://www.dhl.de/int-verfolgen/data/search"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'de-DE,de;q=0.9',
            'Content-Type': 'application/json',
            'Origin': 'https://www.dhl.de',
            'Referer': 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html'
        }
    
    async def track_package(self, tracking_number: str) -> Dict:
        """Track a DHL package by tracking number"""
        tracking_number = tracking_number.strip().upper()
        
        if not tracking_number:
            return self._error_response(tracking_number, "Tracking number required")
        
        # Validate tracking number format
        if len(tracking_number) < 10:
            return self._error_response(tracking_number, "Invalid tracking number format")
        
        try:
            # Try multiple tracking methods
            result = await self._track_via_api(tracking_number)
            if result.get("success"):
                return result
            
            # Fallback to alternative API
            result = await self._track_via_nolp(tracking_number)
            if result.get("success"):
                return result
                
            # Return not found status (not demo)
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": "not_found",
                "status_text": "Sendung nicht gefunden / Paket henüz sisteme girilmemiş",
                "current_location": "",
                "events": [],
                "last_update": datetime.now(timezone.utc).isoformat(),
                "message": "Takip numarası DHL sisteminde bulunamadı. Lütfen numarayı kontrol edin."
            }
            
        except Exception as e:
            logger.error(f"DHL tracking error: {e}")
            return self._error_response(tracking_number, str(e))
    
    async def _track_via_api(self, tracking_number: str) -> Dict:
        """Track via DHL's JSON API"""
        try:
            async with aiohttp.ClientSession() as session:
                # DHL tracking API
                url = f"https://www.dhl.de/int-verfolgen/data/search?piececode={tracking_number}&language=de"
                
                async with session.get(
                    url,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_dhl_response(data, tracking_number)
                    
        except asyncio.TimeoutError:
            logger.warning("DHL API timeout")
        except Exception as e:
            logger.error(f"DHL API error: {e}")
        
        return {"success": False}
    
    async def _track_via_nolp(self, tracking_number: str) -> Dict:
        """Track via DHL NOLP API"""
        try:
            async with aiohttp.ClientSession() as session:
                url = "https://nolp.dhl.de/nextt-online-public/set_identcodes.do"
                params = {
                    "lang": "de",
                    "idc": tracking_number
                }
                
                async with session.get(
                    url,
                    params=params,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=10),
                    allow_redirects=True
                ) as response:
                    
                    if response.status == 200:
                        text = await response.text()
                        return self._parse_nolp_html(text, tracking_number)
                        
        except Exception as e:
            logger.error(f"NOLP API error: {e}")
        
        return {"success": False}
    
    def _parse_dhl_response(self, data: Dict, tracking_number: str) -> Dict:
        """Parse DHL JSON response"""
        try:
            sendungen = data.get("sendungen", [])
            
            if not sendungen:
                return {"success": False}
            
            shipment = sendungen[0]
            details = shipment.get("sendungsdetails", {})
            verlauf = details.get("sendungsverlauf", {})
            
            # Get status
            status_raw = verlauf.get("aktuellerStatus", "")
            kurzstatus = verlauf.get("kurzStatus", "")
            
            status, status_text = self._map_status(status_raw, kurzstatus)
            
            # Get events
            events = []
            for event in verlauf.get("events", []):
                events.append({
                    "date": event.get("datum", ""),
                    "time": event.get("uhrzeit", ""),
                    "location": event.get("ort", ""),
                    "description": event.get("status", ""),
                    "status": event.get("rulesAction", "")
                })
            
            # Current location from latest event
            current_location = events[0].get("location", "") if events else ""
            
            # Estimated delivery
            estimated = details.get("zustellzeitfenster", {})
            estimated_delivery = None
            if estimated:
                estimated_delivery = f"{estimated.get('von', '')} - {estimated.get('bis', '')}"
            
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": status,
                "status_text": status_text,
                "current_location": current_location,
                "estimated_delivery": estimated_delivery,
                "events": events,
                "last_update": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return {"success": False}
    
    def _parse_nolp_html(self, html: str, tracking_number: str) -> Dict:
        """Parse NOLP HTML response"""
        try:
            # Look for status patterns in HTML
            status = "in_transit"
            status_text = "Unterwegs"
            
            if "zugestellt" in html.lower() or "delivered" in html.lower():
                status = "delivered"
                status_text = "Zugestellt / Teslim Edildi"
            elif "zustellung" in html.lower():
                status = "out_for_delivery"
                status_text = "In Zustellung / Dağıtımda"
            elif "angenommen" in html.lower():
                status = "picked_up"
                status_text = "Angenommen / Teslim Alındı"
            elif "nicht gefunden" in html.lower() or "not found" in html.lower():
                return {"success": False}
            
            # Extract location if possible
            location_match = re.search(r'(?:in|bei|Standort:?)\s*([A-Za-zäöüÄÖÜß\s]+)', html)
            location = location_match.group(1).strip() if location_match else ""
            
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": status,
                "status_text": status_text,
                "current_location": location,
                "events": [],
                "last_update": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"HTML parse error: {e}")
            return {"success": False}
    
    def _map_status(self, status_raw: str, kurzstatus: str) -> tuple:
        """Map DHL status to standard status"""
        status_raw = status_raw.lower() if status_raw else ""
        kurzstatus = kurzstatus.lower() if kurzstatus else ""
        
        combined = f"{status_raw} {kurzstatus}"
        
        if any(word in combined for word in ["zugestellt", "delivered", "abgeholt"]):
            return ("delivered", "Zugestellt / Teslim Edildi")
        elif any(word in combined for word in ["zustellung", "delivery", "auslieferung"]):
            return ("out_for_delivery", "In Zustellung / Dağıtımda")
        elif any(word in combined for word in ["paketzentrum", "hub", "transit", "transport"]):
            return ("in_transit", "Im Transport / Yolda")
        elif any(word in combined for word in ["angenommen", "eingeliefert", "picked"]):
            return ("picked_up", "Angenommen / Teslim Alındı")
        elif any(word in combined for word in ["problem", "exception", "fehler"]):
            return ("exception", "Problem / Sorun")
        else:
            return ("in_transit", kurzstatus or "In Bearbeitung / İşleniyor")
    
    def _error_response(self, tracking_number: str, error: str) -> Dict:
        return {
            "success": False,
            "tracking_number": tracking_number,
            "status": "error",
            "status_text": f"Hata: {error}",
            "current_location": "",
            "events": [],
            "error": error,
            "last_update": datetime.now(timezone.utc).isoformat()
        }


# Status labels
STATUS_LABELS = {
    'en': {
        'picked_up': 'Picked Up',
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'exception': 'Exception',
        'not_found': 'Not Found',
        'error': 'Error',
        'unknown': 'Unknown'
    },
    'tr': {
        'picked_up': 'Teslim Alındı',
        'in_transit': 'Yolda',
        'out_for_delivery': 'Dağıtımda',
        'delivered': 'Teslim Edildi',
        'exception': 'Sorun Var',
        'not_found': 'Bulunamadı',
        'error': 'Hata',
        'unknown': 'Bilinmiyor'
    },
    'de': {
        'picked_up': 'Abgeholt',
        'in_transit': 'Unterwegs',
        'out_for_delivery': 'In Zustellung',
        'delivered': 'Zugestellt',
        'exception': 'Ausnahme',
        'not_found': 'Nicht gefunden',
        'error': 'Fehler',
        'unknown': 'Unbekannt'
    }
}

# Create singleton
dhl_tracker = DHLTracker()
