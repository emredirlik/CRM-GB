"""
DHL Tracking Service - Using Official DHL API
"""
import asyncio
import aiohttp
import logging
import os
import re
from datetime import datetime, timezone
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class DHLTracker:
    """DHL package tracking using official DHL API"""
    
    def __init__(self):
        # DHL API Key
        self.api_key = os.environ.get('DHL_API_KEY', 'MARGzS9fwu8yG2HCnbQiGmmLYYmtzlWS')
        self.api_base = "https://api-eu.dhl.com/track/shipments"
    
    async def track_package(self, tracking_number: str) -> Dict:
        """Track a DHL package by tracking number"""
        tracking_number = tracking_number.strip().upper()
        
        if not tracking_number:
            return self._error_response(tracking_number, "Takip numarası gerekli")
        
        if len(tracking_number) < 10:
            return self._error_response(tracking_number, "Geçersiz takip numarası")
        
        try:
            result = await self._track_via_api(tracking_number)
            
            if result.get("success"):
                return result
            
            # Return not found
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": "not_found",
                "status_text": "Kargo bulunamadı",
                "current_location": "",
                "events": [],
                "estimated_delivery": None,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "message": "Bu takip numarası DHL sisteminde bulunamadı.",
                "dhl_link": self._get_tracking_link(tracking_number)
            }
            
        except Exception as e:
            logger.error(f"DHL tracking error: {e}")
            return self._error_response(tracking_number, str(e))
    
    def _get_tracking_link(self, tracking_number: str) -> str:
        """Get DHL tracking URL"""
        if re.match(r'^[A-Z]{2}\d+[A-Z]{2}$', tracking_number) or tracking_number.startswith('JD'):
            return f"https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}"
        return f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
    
    async def _track_via_api(self, tracking_number: str) -> Dict:
        """Track via official DHL API"""
        try:
            url = f"{self.api_base}?trackingNumber={tracking_number}"
            
            headers = {
                'DHL-API-Key': self.api_key,
                'Accept': 'application/json',
                'User-Agent': 'GewurzbergCRM/1.0'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as response:
                    
                    logger.info(f"DHL API response status: {response.status}")
                    
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_api_response(data, tracking_number)
                    elif response.status == 404:
                        logger.info(f"Tracking {tracking_number} not found")
                        return {"success": False}
                    else:
                        error_text = await response.text()
                        logger.error(f"DHL API error {response.status}: {error_text}")
                        return {"success": False}
            
        except asyncio.TimeoutError:
            logger.warning("DHL API timeout")
            return {"success": False}
        except Exception as e:
            logger.error(f"DHL API error: {e}")
            return {"success": False}
    
    def _parse_api_response(self, data: Dict, tracking_number: str) -> Dict:
        """Parse official DHL API response"""
        try:
            shipments = data.get("shipments", [])
            
            if not shipments:
                return {"success": False}
            
            shipment = shipments[0]
            
            # Get status
            status_obj = shipment.get("status", {})
            status_code = status_obj.get("statusCode", "")
            description = status_obj.get("description", "")
            
            # Map status
            status, status_text = self._map_status(status_code, description)
            
            # Get current location
            location = ""
            location_obj = status_obj.get("location", {})
            if location_obj:
                address = location_obj.get("address", {})
                city = address.get("addressLocality", "")
                country = address.get("countryCode", "")
                if city:
                    location = f"{city}, {country}" if country else city
            
            # Get estimated delivery
            estimated_delivery = None
            eta = shipment.get("estimatedTimeOfDelivery")
            if eta:
                estimated_delivery = eta
            
            # Get events
            events = []
            for event in shipment.get("events", []):
                # Parse timestamp
                timestamp = event.get("timestamp", "")
                event_date = ""
                event_time = ""
                
                if timestamp:
                    try:
                        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                        event_date = dt.strftime("%d.%m.%Y")
                        event_time = dt.strftime("%H:%M")
                    except:
                        event_date = timestamp[:10] if len(timestamp) >= 10 else ""
                
                # Get event location
                event_location = ""
                event_loc_obj = event.get("location", {})
                if event_loc_obj:
                    event_addr = event_loc_obj.get("address", {})
                    event_city = event_addr.get("addressLocality", "")
                    event_country = event_addr.get("countryCode", "")
                    if event_city:
                        event_location = f"{event_city}, {event_country}" if event_country else event_city
                
                events.append({
                    "date": event_date,
                    "time": event_time,
                    "location": event_location,
                    "description": event.get("description", ""),
                    "status": event.get("statusCode", "")
                })
            
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": status,
                "status_text": status_text,
                "current_location": location,
                "estimated_delivery": estimated_delivery,
                "events": events,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "dhl_link": self._get_tracking_link(tracking_number)
            }
            
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return {"success": False}
    
    def _map_status(self, code: str, description: str) -> tuple:
        """Map DHL status code to our status"""
        code_lower = (code or "").lower()
        desc_lower = (description or "").lower()
        combined = f"{code_lower} {desc_lower}"
        
        if any(word in combined for word in ['delivered', 'zugestellt', 'teslim']):
            return ("delivered", "Teslim Edildi")
        elif any(word in combined for word in ['out for delivery', 'in zustellung', 'with delivery courier']):
            return ("out_for_delivery", "Dağıtımda")
        elif any(word in combined for word in ['transit', 'processed', 'departed', 'arrived', 'forwarded']):
            return ("in_transit", "Yolda")
        elif any(word in combined for word in ['picked', 'collected', 'shipment information received']):
            return ("picked_up", "Teslim Alındı")
        elif any(word in combined for word in ['customs', 'clearance', 'zoll']):
            return ("customs", "Gümrükte")
        elif any(word in combined for word in ['exception', 'failed', 'undeliverable']):
            return ("exception", "Sorun Var")
        else:
            return ("in_transit", description or "İşleniyor")
    
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
        'not_found': 'Bulunamadı',
        'error': 'Hata'
    },
    'de': {
        'picked_up': 'Abgeholt',
        'in_transit': 'Unterwegs',
        'out_for_delivery': 'In Zustellung',
        'delivered': 'Zugestellt',
        'customs': 'Im Zoll',
        'exception': 'Ausnahme',
        'not_found': 'Nicht gefunden',
        'error': 'Fehler'
    }
}

# Singleton
dhl_tracker = DHLTracker()
