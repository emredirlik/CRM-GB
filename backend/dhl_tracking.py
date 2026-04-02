"""
DHL Tracking Service - Using DHL Unified Tracking API
"""
import asyncio
import aiohttp
import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class DHLTracker:
    """DHL package tracking using official DHL API"""
    
    def __init__(self):
        # DHL API endpoint
        self.api_base = "https://api-eu.dhl.com/track/shipments"
        self.headers = {
            'Accept': 'application/json',
            'User-Agent': 'GewurzbergCRM/1.0'
        }
    
    async def track_package(self, tracking_number: str) -> Dict:
        """Track a DHL package by tracking number"""
        tracking_number = tracking_number.strip().upper()
        
        if not tracking_number:
            return self._error_response(tracking_number, "Takip numarası gerekli")
        
        if len(tracking_number) < 8:
            return self._error_response(tracking_number, "Geçersiz takip numarası formatı")
        
        try:
            # Try to get tracking info from DHL API
            result = await self._fetch_dhl_tracking(tracking_number)
            
            if result.get("success"):
                return result
            
            # If API didn't work, return manual check message
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": "check_required",
                "status_text": "Manuel Kontrol Gerekli",
                "current_location": "",
                "events": [],
                "estimated_delivery": None,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "message": "Takip bilgisi otomatik alınamadı. Lütfen DHL sitesinden kontrol edin.",
                "dhl_link": self._get_tracking_link(tracking_number)
            }
            
        except Exception as e:
            logger.error(f"DHL tracking error: {e}")
            return self._error_response(tracking_number, str(e))
    
    def _get_tracking_link(self, tracking_number: str) -> str:
        """Get the correct DHL tracking URL based on format"""
        # Express formats (starts with letters or specific patterns)
        if re.match(r'^[A-Z]{2}\d+[A-Z]{2}$', tracking_number):  # e.g., CS638795253DE
            return f"https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}"
        elif re.match(r'^JD\d+$', tracking_number):  # JD format
            return f"https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}"
        elif re.match(r'^\d{10,}$', tracking_number):  # Pure numeric - DHL Paket
            return f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
        else:
            # Default to Express
            return f"https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}"
    
    async def _fetch_dhl_tracking(self, tracking_number: str) -> Dict:
        """Fetch tracking data from DHL API"""
        try:
            url = f"{self.api_base}?trackingNumber={tracking_number}"
            
            async with aiohttp.ClientSession() as session:
                # Try DHL public tracking API
                async with session.get(
                    url,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        return self._parse_dhl_response(data, tracking_number)
                    elif response.status == 404:
                        logger.info(f"Tracking {tracking_number} not found in DHL API")
                    else:
                        logger.warning(f"DHL API returned status {response.status}")
            
            return {"success": False}
            
        except asyncio.TimeoutError:
            logger.warning("DHL API timeout")
            return {"success": False}
        except Exception as e:
            logger.error(f"DHL API error: {e}")
            return {"success": False}
    
    def _parse_dhl_response(self, data: Dict, tracking_number: str) -> Dict:
        """Parse DHL API response"""
        try:
            shipments = data.get("shipments", [])
            
            if not shipments:
                return {"success": False}
            
            shipment = shipments[0]
            
            # Get status
            status_obj = shipment.get("status", {})
            status_code = status_obj.get("statusCode", "unknown")
            description = status_obj.get("description", "")
            
            # Map to our status codes
            status, status_text = self._map_status(status_code, description)
            
            # Get location
            location = ""
            location_obj = status_obj.get("location", {})
            if location_obj:
                address = location_obj.get("address", {})
                city = address.get("addressLocality", "")
                country = address.get("countryCode", "")
                location = f"{city}, {country}" if city else country
            
            # Get estimated delivery
            estimated_delivery = None
            estimated_obj = shipment.get("estimatedTimeOfDelivery")
            if estimated_obj:
                estimated_delivery = estimated_obj
            
            # Get events
            events = []
            for event in shipment.get("events", [])[:10]:
                event_location = ""
                loc_obj = event.get("location", {})
                if loc_obj:
                    addr = loc_obj.get("address", {})
                    event_city = addr.get("addressLocality", "")
                    event_country = addr.get("countryCode", "")
                    event_location = f"{event_city}, {event_country}" if event_city else event_country
                
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
                        pass
                
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
        code = code.lower() if code else ""
        desc = description.lower() if description else ""
        combined = f"{code} {desc}"
        
        if any(word in combined for word in ['delivered', 'zugestellt', 'teslim']):
            return ("delivered", "Teslim Edildi / Zugestellt")
        elif any(word in combined for word in ['out for delivery', 'in zustellung', 'dağıtımda']):
            return ("out_for_delivery", "Dağıtımda / In Zustellung")
        elif any(word in combined for word in ['transit', 'unterwegs', 'yolda', 'processed', 'departed', 'arrived']):
            return ("in_transit", "Yolda / Unterwegs")
        elif any(word in combined for word in ['picked up', 'collected', 'abgeholt', 'shipment information received']):
            return ("picked_up", "Teslim Alındı / Abgeholt")
        elif any(word in combined for word in ['customs', 'zoll', 'gümrük']):
            return ("customs", "Gümrükte / Im Zoll")
        elif any(word in combined for word in ['exception', 'failed', 'problem', 'fehler']):
            return ("exception", "Sorun Var / Problem")
        else:
            return ("in_transit", description or "İşleniyor / In Bearbeitung")
    
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


# Status labels for UI
STATUS_LABELS = {
    'en': {
        'picked_up': 'Picked Up',
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'exception': 'Exception',
        'customs': 'In Customs',
        'check_required': 'Check Required',
        'pending': 'Pending',
        'error': 'Error',
        'unknown': 'Unknown'
    },
    'tr': {
        'picked_up': 'Teslim Alındı',
        'in_transit': 'Yolda',
        'out_for_delivery': 'Dağıtımda',
        'delivered': 'Teslim Edildi',
        'exception': 'Sorun Var',
        'customs': 'Gümrükte',
        'check_required': 'Kontrol Gerekli',
        'pending': 'Beklemede',
        'error': 'Hata',
        'unknown': 'Bilinmiyor'
    },
    'de': {
        'picked_up': 'Abgeholt',
        'in_transit': 'Unterwegs',
        'out_for_delivery': 'In Zustellung',
        'delivered': 'Zugestellt',
        'exception': 'Ausnahme',
        'customs': 'Im Zoll',
        'check_required': 'Prüfung erforderlich',
        'pending': 'Ausstehend',
        'error': 'Fehler',
        'unknown': 'Unbekannt'
    }
}

# Singleton instance
dhl_tracker = DHLTracker()
