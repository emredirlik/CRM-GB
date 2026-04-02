"""
DHL Tracking Service - Real tracking via web scraping
"""
import asyncio
import aiohttp
import logging
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class DHLTracker:
    """DHL package tracking - real tracking data via web scraping"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache'
        }
    
    async def track_package(self, tracking_number: str) -> Dict:
        """Track a DHL package by tracking number"""
        tracking_number = tracking_number.strip().upper()
        
        if not tracking_number:
            return self._error_response(tracking_number, "Tracking number required")
        
        # Validate tracking number format (DHL Germany uses 12-20 digit numbers)
        if len(tracking_number) < 10:
            return self._error_response(tracking_number, "Invalid tracking number format - too short")
        
        try:
            # Try DHL.de tracking page scraping
            result = await self._scrape_dhl_page(tracking_number)
            if result.get("success"):
                return result
            
            # If scraping didn't work, return a proper "not found" or "checking" status
            return {
                "success": True,
                "tracking_number": tracking_number,
                "status": "pending",
                "status_text": "Sendung wird geprüft / Kargo kontrol ediliyor",
                "current_location": "",
                "events": [],
                "estimated_delivery": None,
                "last_update": datetime.now(timezone.utc).isoformat(),
                "message": "DHL-Sendungsverfolgung wird aktualisiert. Bitte versuchen Sie es später erneut.",
                "dhl_link": f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
            }
            
        except Exception as e:
            logger.error(f"DHL tracking error: {e}")
            return self._error_response(tracking_number, str(e))
    
    async def _scrape_dhl_page(self, tracking_number: str) -> Dict:
        """Scrape DHL tracking page for status"""
        try:
            url = f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    headers=self.headers,
                    timeout=aiohttp.ClientTimeout(total=15),
                    allow_redirects=True
                ) as response:
                    
                    if response.status != 200:
                        logger.warning(f"DHL page returned status {response.status}")
                        return {"success": False}
                    
                    html = await response.text()
                    return self._parse_tracking_html(html, tracking_number)
                    
        except asyncio.TimeoutError:
            logger.warning("DHL page request timeout")
            return {"success": False}
        except Exception as e:
            logger.error(f"DHL scraping error: {e}")
            return {"success": False}
    
    def _parse_tracking_html(self, html: str, tracking_number: str) -> Dict:
        """Parse DHL tracking page HTML"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Initialize response
            status = "unknown"
            status_text = ""
            current_location = ""
            estimated_delivery = None
            events = []
            
            # Look for status indicators in the page
            html_lower = html.lower()
            
            # Check for delivered status
            if any(term in html_lower for term in ['zugestellt', 'delivered', 'erfolgreich zugestellt', 'abgeholt von empfänger']):
                status = "delivered"
                status_text = "Zugestellt / Teslim Edildi"
            # Check for out for delivery
            elif any(term in html_lower for term in ['in zustellung', 'out for delivery', 'wird heute zugestellt', 'zustellung heute']):
                status = "out_for_delivery"
                status_text = "In Zustellung / Dağıtımda"
            # Check for in transit
            elif any(term in html_lower for term in ['unterwegs', 'in transit', 'transport', 'paketzentrum', 'sendung ist auf dem weg']):
                status = "in_transit"
                status_text = "Unterwegs / Yolda"
            # Check for picked up
            elif any(term in html_lower for term in ['angenommen', 'eingeliefert', 'picked up', 'abgeholt', 'paket wurde angenommen']):
                status = "picked_up"
                status_text = "Angenommen / Teslim Alındı"
            # Check for problem/exception
            elif any(term in html_lower for term in ['problem', 'exception', 'benachrichtigung', 'nicht zugestellt', 'zustellung nicht möglich']):
                status = "exception"
                status_text = "Problem / Sorun Var"
            # Check for not found
            elif any(term in html_lower for term in ['nicht gefunden', 'not found', 'keine sendung', 'ungültig']):
                return {"success": False}
            else:
                # If we have content but couldn't determine status, assume it's being processed
                if 'sendungsverfolgung' in html_lower or 'tracking' in html_lower:
                    status = "in_transit"
                    status_text = "In Bearbeitung / İşleniyor"
            
            # Try to extract location from page
            location_patterns = [
                r'Standort:?\s*([A-Za-zäöüÄÖÜß\-\s]+)',
                r'Location:?\s*([A-Za-z\-\s]+)',
                r'in\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:zugestellt|angekommen)',
            ]
            
            for pattern in location_patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    current_location = match.group(1).strip()
                    break
            
            # Try to find delivery date
            date_patterns = [
                r'(\d{1,2}\.\d{1,2}\.\d{4})',
                r'(\d{1,2}\s+(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4})',
            ]
            
            for pattern in date_patterns:
                matches = re.findall(pattern, html)
                if matches:
                    estimated_delivery = matches[-1]  # Take the latest date found
                    break
            
            # Try to extract tracking events from the page
            # Look for event-like patterns
            event_pattern = r'(\d{1,2}\.\d{1,2}\.\d{4})[,\s]+(\d{1,2}:\d{2})?\s*(?:Uhr)?\s*[-–]?\s*([^<\n]+)'
            event_matches = re.findall(event_pattern, html)
            
            for match in event_matches[:10]:  # Limit to 10 events
                date_str = match[0]
                time_str = match[1] if match[1] else ""
                description = match[2].strip() if len(match) > 2 else ""
                
                if description and len(description) > 5:
                    events.append({
                        "date": date_str,
                        "time": time_str,
                        "location": "",
                        "description": description[:200],  # Limit length
                        "status": ""
                    })
            
            # Only return success if we found a valid status
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
                    "dhl_link": f"https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={tracking_number}"
                }
            
            return {"success": False}
            
        except Exception as e:
            logger.error(f"HTML parse error: {e}")
            return {"success": False}
    
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


# Status labels for multi-language support
STATUS_LABELS = {
    'en': {
        'picked_up': 'Picked Up',
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'exception': 'Exception',
        'not_found': 'Not Found',
        'error': 'Error',
        'pending': 'Pending',
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
        'pending': 'Beklemede',
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
        'pending': 'Ausstehend',
        'unknown': 'Unbekannt'
    }
}

# Create singleton instance
dhl_tracker = DHLTracker()
