"""
DHL Tracking Service - Real tracking via web scraping
Works with DHL Express and DHL Paket
"""
import asyncio
import aiohttp
import logging
import re
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class DHLTracker:
    """DHL package tracking using web scraping"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache'
        }
    
    async def track_package(self, tracking_number: str) -> Dict:
        """Track a DHL package by tracking number"""
        tracking_number = tracking_number.strip().upper()
        
        if not tracking_number:
            return self._error_response(tracking_number, "Takip numarası gerekli")
        
        if len(tracking_number) < 8:
            return self._error_response(tracking_number, "Geçersiz takip numarası")
        
        try:
            # Try DHL Express tracking (for international/express shipments)
            result = await self._track_via_dhl_express(tracking_number)
            if result.get("success") and result.get("status") != "unknown":
                return result
            
            # Try DHL Paket (German domestic)
            result = await self._track_via_dhl_paket(tracking_number)
            if result.get("success") and result.get("status") != "unknown":
                return result
            
            # Return with DHL link for manual check
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": "pending",
                "status_text": "Bilgi Alınamadı",
                "current_location": "",
                "events": [],
                "estimated_delivery": None,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "message": "Takip bilgisi bulunamadı. Lütfen DHL linkinden kontrol edin.",
                "dhl_link": self._get_tracking_link(tracking_number)
            }
            
        except Exception as e:
            logger.error(f"DHL tracking error: {e}")
            return self._error_response(tracking_number, str(e))
    
    def _get_tracking_link(self, tracking_number: str) -> str:
        """Get DHL tracking URL"""
        if re.match(r'^[A-Z]{2}\d+[A-Z]{2}$', tracking_number):
            return f"https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}"
        return f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
    
    async def _track_via_dhl_express(self, tracking_number: str) -> Dict:
        """Track via DHL Express international tracking"""
        try:
            # DHL uses this endpoint for tracking data
            url = f"https://www.dhl.com/shipmentTracking?AWB={tracking_number}&countryCode=DE&languageCode=de"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    headers={
                        **self.headers,
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as response:
                    if response.status == 200:
                        try:
                            data = await response.json()
                            result = self._parse_express_json(data, tracking_number)
                            if result.get("success"):
                                return result
                        except:
                            # Try HTML parsing
                            pass
                
                # Try alternative Express URL
                alt_url = f"https://www.dhl.com/de-de/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}"
                
                async with session.get(
                    alt_url,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                    allow_redirects=True
                ) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self._parse_express_html(html, tracking_number)
            
            return {"success": False}
            
        except Exception as e:
            logger.error(f"Express tracking error: {e}")
            return {"success": False}
    
    async def _track_via_dhl_paket(self, tracking_number: str) -> Dict:
        """Track via DHL Paket (German)"""
        try:
            url = f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                    allow_redirects=True
                ) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self._parse_paket_html(html, tracking_number)
            
            return {"success": False}
            
        except Exception as e:
            logger.error(f"Paket tracking error: {e}")
            return {"success": False}
    
    def _parse_express_json(self, data: Dict, tracking_number: str) -> Dict:
        """Parse DHL Express JSON response"""
        try:
            results = data.get("results", [])
            if not results:
                return {"success": False}
            
            shipment = results[0]
            
            # Get status
            status_code = shipment.get("delivery", {}).get("status", "")
            description = shipment.get("delivery", {}).get("description", "")
            
            status, status_text = self._map_status(status_code, description)
            
            # Get location
            location = shipment.get("delivery", {}).get("location", "")
            
            # Get events
            events = []
            checkpoints = shipment.get("checkpoints", [])
            for cp in checkpoints[:10]:
                events.append({
                    "date": cp.get("date", ""),
                    "time": cp.get("time", ""),
                    "location": cp.get("location", ""),
                    "description": cp.get("description", ""),
                    "status": ""
                })
            
            # Estimated delivery
            estimated = shipment.get("delivery", {}).get("estimatedTimeOfDelivery")
            
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": status,
                "status_text": status_text,
                "current_location": location,
                "estimated_delivery": estimated,
                "events": events,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "dhl_link": self._get_tracking_link(tracking_number)
            }
            
        except Exception as e:
            logger.error(f"JSON parse error: {e}")
            return {"success": False}
    
    def _parse_express_html(self, html: str, tracking_number: str) -> Dict:
        """Parse DHL Express HTML page"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            html_lower = html.lower()
            
            status = "unknown"
            status_text = ""
            current_location = ""
            estimated_delivery = None
            events = []
            
            # Find status from various indicators
            if any(x in html_lower for x in ['delivered', 'zugestellt', 'teslim edildi', 'shipment has been delivered']):
                status = "delivered"
                status_text = "Teslim Edildi"
            elif any(x in html_lower for x in ['out for delivery', 'in zustellung', 'dağıtımda', 'with delivery courier']):
                status = "out_for_delivery"
                status_text = "Dağıtımda"
            elif any(x in html_lower for x in ['in transit', 'unterwegs', 'yolda', 'shipment in transit', 'processed at', 'departed from', 'arrived at']):
                status = "in_transit"
                status_text = "Yolda"
            elif any(x in html_lower for x in ['picked up', 'abgeholt', 'shipment picked up', 'collected']):
                status = "picked_up"
                status_text = "Teslim Alındı"
            elif any(x in html_lower for x in ['customs', 'zoll', 'gümrük', 'clearance']):
                status = "customs"
                status_text = "Gümrükte"
            
            # Extract events from tracking table or list
            # Look for tracking events in various formats
            event_containers = soup.find_all(['tr', 'div', 'li'], class_=re.compile(r'event|checkpoint|tracking|status', re.I))
            
            for container in event_containers[:10]:
                text = container.get_text(strip=True, separator=' ')
                if len(text) > 10:
                    # Try to extract date/time/location/description
                    date_match = re.search(r'(\d{1,2}[./]\d{1,2}[./]\d{2,4})', text)
                    time_match = re.search(r'(\d{1,2}:\d{2})', text)
                    
                    events.append({
                        "date": date_match.group(1) if date_match else "",
                        "time": time_match.group(1) if time_match else "",
                        "location": "",
                        "description": text[:150],
                        "status": ""
                    })
            
            # Try to find location
            location_patterns = [
                r'(?:location|standort|konum)[:\s]*([A-Za-zäöüÄÖÜß\s,]+)',
                r'(?:delivered to|zugestellt in|teslim yeri)[:\s]*([A-Za-zäöüÄÖÜß\s,]+)',
            ]
            for pattern in location_patterns:
                match = re.search(pattern, html, re.I)
                if match:
                    current_location = match.group(1).strip()[:50]
                    break
            
            if status != "unknown":
                return {
                    "success": True,
                    "tracking_number": tracking_number,
                    "status": status,
                    "status_text": status_text,
                    "current_location": current_location,
                    "estimated_delivery": estimated_delivery,
                    "events": [e for e in events if e["description"]],
                    "last_update": datetime.now(timezone.utc).isoformat(),
                    "dhl_link": self._get_tracking_link(tracking_number)
                }
            
            return {"success": False}
            
        except Exception as e:
            logger.error(f"Express HTML parse error: {e}")
            return {"success": False}
    
    def _parse_paket_html(self, html: str, tracking_number: str) -> Dict:
        """Parse DHL Paket HTML page"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            html_lower = html.lower()
            
            status = "unknown"
            status_text = ""
            current_location = ""
            estimated_delivery = None
            events = []
            
            # Check status
            if any(x in html_lower for x in ['zugestellt', 'delivered', 'erfolgreich zugestellt']):
                status = "delivered"
                status_text = "Teslim Edildi"
            elif any(x in html_lower for x in ['in zustellung', 'out for delivery']):
                status = "out_for_delivery"
                status_text = "Dağıtımda"
            elif any(x in html_lower for x in ['unterwegs', 'in transit', 'im paketzentrum']):
                status = "in_transit"
                status_text = "Yolda"
            elif any(x in html_lower for x in ['angenommen', 'eingeliefert', 'picked up']):
                status = "picked_up"
                status_text = "Teslim Alındı"
            
            # Find tracking events
            event_pattern = r'(\d{1,2}\.\d{1,2}\.\d{4})\s*,?\s*(\d{1,2}:\d{2})?\s*(?:Uhr)?\s*[-–:]?\s*([^<\n]{5,})'
            matches = re.findall(event_pattern, html)
            
            for match in matches[:10]:
                desc = match[2].strip() if len(match) > 2 else ""
                if desc and len(desc) > 5:
                    events.append({
                        "date": match[0],
                        "time": match[1] if match[1] else "",
                        "location": "",
                        "description": desc[:150],
                        "status": ""
                    })
            
            if status != "unknown":
                return {
                    "success": True,
                    "tracking_number": tracking_number,
                    "status": status,
                    "status_text": status_text,
                    "current_location": current_location,
                    "estimated_delivery": estimated_delivery,
                    "events": events,
                    "last_update": datetime.now(timezone.utc).isoformat(),
                    "dhl_link": self._get_tracking_link(tracking_number)
                }
            
            return {"success": False}
            
        except Exception as e:
            logger.error(f"Paket HTML parse error: {e}")
            return {"success": False}
    
    def _map_status(self, code: str, description: str) -> tuple:
        """Map status code to our status"""
        combined = f"{code} {description}".lower()
        
        if any(x in combined for x in ['delivered', 'zugestellt']):
            return ("delivered", "Teslim Edildi")
        elif any(x in combined for x in ['out for delivery', 'in zustellung']):
            return ("out_for_delivery", "Dağıtımda")
        elif any(x in combined for x in ['transit', 'unterwegs', 'processed']):
            return ("in_transit", "Yolda")
        elif any(x in combined for x in ['picked', 'collected', 'abgeholt']):
            return ("picked_up", "Teslim Alındı")
        elif any(x in combined for x in ['customs', 'zoll']):
            return ("customs", "Gümrükte")
        elif any(x in combined for x in ['exception', 'failed']):
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
        'exception': 'Sorun Var',
        'customs': 'Gümrükte',
        'pending': 'Beklemede',
        'error': 'Hata'
    },
    'de': {
        'picked_up': 'Abgeholt',
        'in_transit': 'Unterwegs',
        'out_for_delivery': 'In Zustellung',
        'delivered': 'Zugestellt',
        'exception': 'Ausnahme',
        'customs': 'Im Zoll',
        'pending': 'Ausstehend',
        'error': 'Fehler'
    },
    'en': {
        'picked_up': 'Picked Up',
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'exception': 'Exception',
        'customs': 'In Customs',
        'pending': 'Pending',
        'error': 'Error'
    }
}

# Singleton
dhl_tracker = DHLTracker()
