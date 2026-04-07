import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MapPin, Navigation, Route, List, RotateCcw, ExternalLink, Loader2, Clock, FileDown, Search, X, Crosshair, Zap, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Translations
const texts = {
  en: {
    title: 'Route Planner',
    subtitle: 'Create optimized routes for business trips',
    selectAll: 'Select All',
    clear: 'Clear',
    startAddress: 'Start Address',
    searchPlaceholder: 'Search for address... (e.g., Berlin, Germany)',
    useMyLocation: 'Use My Location',
    locating: 'Locating...',
    createRoute: 'Create Route',
    calculating: 'Calculating...',
    autoOptimize: 'Auto Optimize',
    optimizeByDistance: 'Find the shortest route automatically',
    routeSummary: 'Route Summary',
    kilometers: 'Kilometers',
    hours: 'Hours',
    start: 'Start',
    customers: 'Customers',
    noCustomersWithLocation: 'No customers with location',
    addCustomersFirst: 'Add customers with city/country first',
    loadingLocations: 'Loading locations...',
    addressVerified: 'Address verified',
    tip: 'Tip',
    tipText: 'Enter your start address or click "Use My Location", then select customers and click "Create Route".',
    locationSuccess: 'Location found',
    locationError: 'Could not get location',
    enableLocation: 'Please enable location access',
    addressSelected: 'Address selected',
    routeCreated: 'Route created!',
    pdfDownloaded: 'PDF downloaded',
    error: 'Error',
    enterStartAddress: 'Please enter a start address',
    selectAtLeast: 'Select at least 1 customer',
    couldNotCalculate: 'Could not calculate route',
    couldNotDownload: 'Could not download PDF',
    customersLoaded: 'customer locations loaded',
    remove: 'Remove',
    select: 'Select',
  },
  tr: {
    title: 'Rota Planlayıcı',
    subtitle: 'İş gezileri için optimize edilmiş rotalar oluşturun',
    selectAll: 'Tümünü Seç',
    clear: 'Temizle',
    startAddress: 'Başlangıç Adresi',
    searchPlaceholder: 'Adres aramak için yazın... (örn: Berlin, Germany)',
    useMyLocation: 'Konumumu Bul',
    locating: 'Konum alınıyor...',
    createRoute: 'Rota Oluştur',
    calculating: 'Hesaplanıyor...',
    autoOptimize: 'Otomatik Optimize Et',
    optimizeByDistance: 'En kısa rotayı otomatik bul',
    routeSummary: 'Rota Özeti',
    kilometers: 'Kilometre',
    hours: 'Saat',
    start: 'Başlangıç',
    customers: 'Müşteriler',
    noCustomersWithLocation: 'Konumu olan müşteri yok',
    addCustomersFirst: 'Önce şehir/ülke bilgisi olan müşteri ekleyin',
    loadingLocations: 'Konumlar yükleniyor...',
    addressVerified: 'Adres doğrulandı',
    tip: 'İpucu',
    tipText: 'Başlangıç adresinizi girin veya "Konumumu Bul" butonuna tıklayın, ardından müşterileri seçip "Rota Oluştur" butonuna tıklayın.',
    locationSuccess: 'Konum bulundu',
    locationError: 'Konum alınamadı',
    enableLocation: 'Lütfen konum erişimini etkinleştirin',
    addressSelected: 'Adres seçildi',
    routeCreated: 'Rota oluşturuldu!',
    pdfDownloaded: 'PDF indirildi',
    error: 'Hata',
    enterStartAddress: 'Lütfen başlangıç adresi girin',
    selectAtLeast: 'En az 1 müşteri seçin',
    couldNotCalculate: 'Rota hesaplanamadı',
    couldNotDownload: 'PDF indirilemedi',
    customersLoaded: 'müşteri konumu yüklendi',
    remove: 'Seçimi Kaldır',
    select: 'Seç',
  },
  de: {
    title: 'Routenplaner',
    subtitle: 'Erstellen Sie optimierte Routen für Geschäftsreisen',
    selectAll: 'Alle auswählen',
    clear: 'Löschen',
    startAddress: 'Startadresse',
    searchPlaceholder: 'Nach Adresse suchen... (z.B. Berlin, Germany)',
    useMyLocation: 'Meinen Standort verwenden',
    locating: 'Standort wird ermittelt...',
    createRoute: 'Route erstellen',
    calculating: 'Berechnung...',
    autoOptimize: 'Auto-Optimieren',
    optimizeByDistance: 'Kürzeste Route automatisch finden',
    routeSummary: 'Routenübersicht',
    kilometers: 'Kilometer',
    hours: 'Stunden',
    start: 'Start',
    customers: 'Kunden',
    noCustomersWithLocation: 'Keine Kunden mit Standort',
    addCustomersFirst: 'Fügen Sie zuerst Kunden mit Stadt/Land hinzu',
    loadingLocations: 'Standorte werden geladen...',
    addressVerified: 'Adresse bestätigt',
    tip: 'Tipp',
    tipText: 'Geben Sie Ihre Startadresse ein oder klicken Sie auf "Meinen Standort verwenden", wählen Sie dann Kunden aus und klicken Sie auf "Route erstellen".',
    locationSuccess: 'Standort gefunden',
    locationError: 'Standort konnte nicht ermittelt werden',
    enableLocation: 'Bitte aktivieren Sie den Standortzugriff',
    addressSelected: 'Adresse ausgewählt',
    routeCreated: 'Route erstellt!',
    pdfDownloaded: 'PDF heruntergeladen',
    error: 'Fehler',
    enterStartAddress: 'Bitte geben Sie eine Startadresse ein',
    selectAtLeast: 'Mindestens 1 Kunde auswählen',
    couldNotCalculate: 'Route konnte nicht berechnet werden',
    couldNotDownload: 'PDF konnte nicht heruntergeladen werden',
    customersLoaded: 'Kundenstandorte geladen',
    remove: 'Entfernen',
    select: 'Auswählen',
  },
  pl: {
    title: 'Planowanie trasy',
    subtitle: 'Twórz zoptymalizowane trasy dla podróży służbowych',
    selectAll: 'Zaznacz wszystko',
    clear: 'Wyczyść',
    startAddress: 'Adres początkowy',
    searchPlaceholder: 'Szukaj adresu... (np. Warsaw, Poland)',
    useMyLocation: 'Użyj mojej lokalizacji',
    locating: 'Lokalizowanie...',
    createRoute: 'Utwórz trasę',
    calculating: 'Obliczanie...',
    autoOptimize: 'Auto-optymalizacja',
    optimizeByDistance: 'Automatycznie znajdź najkrótszą trasę',
    routeSummary: 'Podsumowanie trasy',
    kilometers: 'Kilometry',
    hours: 'Godziny',
    start: 'Start',
    customers: 'Klienci',
    noCustomersWithLocation: 'Brak klientów z lokalizacją',
    addCustomersFirst: 'Najpierw dodaj klientów z miastem/krajem',
    loadingLocations: 'Ładowanie lokalizacji...',
    addressVerified: 'Adres zweryfikowany',
    tip: 'Wskazówka',
    tipText: 'Wprowadź adres początkowy lub kliknij "Użyj mojej lokalizacji", następnie wybierz klientów i kliknij "Utwórz trasę".',
    locationSuccess: 'Lokalizacja znaleziona',
    locationError: 'Nie można uzyskać lokalizacji',
    enableLocation: 'Proszę włączyć dostęp do lokalizacji',
    addressSelected: 'Adres wybrany',
    routeCreated: 'Trasa utworzona!',
    pdfDownloaded: 'PDF pobrany',
    error: 'Błąd',
    enterStartAddress: 'Proszę wprowadzić adres początkowy',
    selectAtLeast: 'Wybierz co najmniej 1 klienta',
    couldNotCalculate: 'Nie można obliczyć trasy',
    couldNotDownload: 'Nie można pobrać PDF',
    customersLoaded: 'lokalizacji klientów załadowanych',
    remove: 'Usuń',
    select: 'Wybierz',
  },
};

// Fix leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const blueIcon = createIcon('blue');
const greenIcon = createIcon('green');
const redIcon = createIcon('red');
const orangeIcon = createIcon('orange');

// Component to fit map bounds
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

// Calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Nearest neighbor algorithm for route optimization
const optimizeRouteOrder = (startCoords, leads, geocodedLeads) => {
  if (leads.length === 0) return [];
  
  const remaining = [...leads];
  const optimized = [];
  let currentLat = startCoords.lat;
  let currentLng = startCoords.lng;
  
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const lead = remaining[i];
      const coords = geocodedLeads[lead.id];
      if (coords) {
        const dist = calculateDistance(currentLat, currentLng, coords.lat, coords.lng);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = i;
        }
      }
    }
    
    const nearest = remaining.splice(nearestIndex, 1)[0];
    const nearestCoords = geocodedLeads[nearest.id];
    optimized.push({
      ...nearest,
      distance: nearestDistance,
      coords: nearestCoords
    });
    
    if (nearestCoords) {
      currentLat = nearestCoords.lat;
      currentLng = nearestCoords.lng;
    }
  }
  
  return optimized;
};

const RoutePlanner = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState(() => {
    // Restore from localStorage
    const saved = localStorage.getItem('routePlanner_selectedLeads');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [geocodedLeads, setGeocodedLeads] = useState({});
  const [route, setRoute] = useState(() => {
    // Restore route from localStorage
    const saved = localStorage.getItem('routePlanner_route');
    return saved ? JSON.parse(saved) : null;
  });
  const [calculating, setCalculating] = useState(false);
  const [startAddress, setStartAddress] = useState(() => {
    return localStorage.getItem('routePlanner_startAddress') || '';
  });
  const [startCoords, setStartCoords] = useState(() => {
    const saved = localStorage.getItem('routePlanner_startCoords');
    return saved ? JSON.parse(saved) : null;
  });
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  const mapRef = useRef(null);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('routePlanner_selectedLeads', JSON.stringify([...selectedLeads]));
  }, [selectedLeads]);
  
  useEffect(() => {
    if (route) {
      localStorage.setItem('routePlanner_route', JSON.stringify(route));
    }
  }, [route]);
  
  useEffect(() => {
    localStorage.setItem('routePlanner_startAddress', startAddress);
  }, [startAddress]);
  
  useEffect(() => {
    if (startCoords) {
      localStorage.setItem('routePlanner_startCoords', JSON.stringify(startCoords));
    }
  }, [startCoords]);

  // Extended city coordinates
  const cityCoords = {
    'Athens': { lat: 37.9838, lng: 23.7275 },
    'Thessaloniki': { lat: 40.6401, lng: 22.9444 },
    'Berlin': { lat: 52.5200, lng: 13.4050 },
    'Munich': { lat: 48.1351, lng: 11.5820 },
    'Hamburg': { lat: 53.5511, lng: 9.9937 },
    'Frankfurt': { lat: 50.1109, lng: 8.6821 },
    'Istanbul': { lat: 41.0082, lng: 28.9784 },
    'Ankara': { lat: 39.9334, lng: 32.8597 },
    'Izmir': { lat: 38.4237, lng: 27.1428 },
    'Amsterdam': { lat: 52.3676, lng: 4.9041 },
    'Rotterdam': { lat: 51.9244, lng: 4.4777 },
    'Warsaw': { lat: 52.2297, lng: 21.0122 },
    'Krakow': { lat: 50.0647, lng: 19.9450 },
    'Vienna': { lat: 48.2082, lng: 16.3738 },
    'Paris': { lat: 48.8566, lng: 2.3522 },
    'London': { lat: 51.5074, lng: -0.1278 },
    'Bucharest': { lat: 44.4268, lng: 26.1025 },
    'Sofia': { lat: 42.6977, lng: 23.3219 },
    'Riyadh': { lat: 24.7136, lng: 46.6753 },
    'Dubai': { lat: 25.2048, lng: 55.2708 },
    'Rethymno': { lat: 35.3661, lng: 24.4765 },
    'Heraklion': { lat: 35.3387, lng: 25.1442 },
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API}/leads`);
      const leadsData = response.data;
      setLeads(leadsData);
      setLoading(false);
      
      if (leadsData.length > 0) {
        geocodeAllLeads(leadsData);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error(t.error, { description: 'Failed to load customers' });
      setLoading(false);
    }
  };

  const geocodeAllLeads = async (leadsList) => {
    setGeocoding(true);
    const results = {};
    
    for (const lead of leadsList) {
      if (lead.city) {
        const cityName = lead.city.split('(')[0].trim();
        const predefined = Object.entries(cityCoords).find(([key]) => 
          cityName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(cityName.toLowerCase())
        );
        
        if (predefined) {
          results[lead.id] = {
            lat: predefined[1].lat + (Math.random() - 0.5) * 0.02,
            lng: predefined[1].lng + (Math.random() - 0.5) * 0.02
          };
        } else if (lead.country) {
          try {
            const response = await axios.get(`${API}/geocode`, {
              params: { city: lead.city, country: lead.country }
            });
            if (response.data && response.data.lat) {
              results[lead.id] = {
                lat: response.data.lat + (Math.random() - 0.5) * 0.01,
                lng: response.data.lng + (Math.random() - 0.5) * 0.01
              };
            }
          } catch (error) {
            console.error(`Geocoding failed for ${lead.company_name}:`, error);
          }
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }
    
    setGeocodedLeads(results);
    setGeocoding(false);
    
    if (Object.keys(results).length > 0) {
      toast.success(`${Object.keys(results).length} ${t.customersLoaded}`);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t.error, { description: t.enableLocation });
      return;
    }
    
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        try {
          const response = await axios.get(`${API}/geocode/reverse`, {
            params: { lat: latitude, lon: longitude }
          });
          
          const address = response.data?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setStartAddress(address);
          setStartCoords({ lat: latitude, lng: longitude, address });
          toast.success(t.locationSuccess);
        } catch (error) {
          // If reverse geocoding fails, just use coordinates
          const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setStartAddress(address);
          setStartCoords({ lat: latitude, lng: longitude, address });
          toast.success(t.locationSuccess);
        }
        
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error(t.locationError, { description: t.enableLocation });
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Address autocomplete search
  const searchAddress = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setSearchingAddress(true);
    try {
      const response = await axios.get(`${API}/geocode/search`, {
        params: { q: query }
      });
      setSuggestions(response.data || []);
      setShowSuggestions((response.data || []).length > 0);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  }, []);

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setStartAddress(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  const selectSuggestion = (suggestion) => {
    setStartAddress(suggestion.display_name);
    setStartCoords({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      address: suggestion.display_name
    });
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success(t.addressSelected + ' ✓');
  };

  const toggleLeadSelection = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const selectAll = () => {
    const geocodedIds = Object.keys(geocodedLeads);
    setSelectedLeads(new Set(geocodedIds));
  };

  const clearSelection = () => {
    setSelectedLeads(new Set());
    setRoute(null);
    setStartCoords(null);
    setStartAddress('');
    // Clear localStorage
    localStorage.removeItem('routePlanner_selectedLeads');
    localStorage.removeItem('routePlanner_route');
    localStorage.removeItem('routePlanner_startAddress');
    localStorage.removeItem('routePlanner_startCoords');
  };

  // Auto optimize route by distance
  const autoOptimizeRoute = () => {
    if (!startCoords) {
      toast.error(t.error, { description: t.enterStartAddress });
      return;
    }
    
    if (selectedLeads.size < 1) {
      toast.error(t.error, { description: t.selectAtLeast });
      return;
    }
    
    setCalculating(true);
    
    // Get selected leads with coordinates
    const selectedLeadsList = leads.filter(l => selectedLeads.has(l.id) && geocodedLeads[l.id]);
    
    // Optimize route order
    const optimizedStops = optimizeRouteOrder(startCoords, selectedLeadsList, geocodedLeads);
    
    // Calculate total distance
    let totalDistance = 0;
    optimizedStops.forEach(stop => {
      totalDistance += stop.distance;
    });
    
    // Estimate time (average 60 km/h + 15 min per stop)
    const estimatedHours = (totalDistance / 60) + (optimizedStops.length * 0.25);
    
    setRoute({
      start_point: startCoords,
      stops: optimizedStops.map((stop, idx) => ({
        id: stop.id,
        company_name: stop.company_name,
        city: stop.city,
        lat: stop.coords.lat,
        lng: stop.coords.lng,
        distance: stop.distance,
        order: idx + 1
      })),
      total_distance: totalDistance,
      estimated_hours: estimatedHours
    });
    
    toast.success(t.routeCreated, { 
      description: `${totalDistance.toFixed(1)} km, ~${estimatedHours.toFixed(1)} ${t.hours}` 
    });
    
    setCalculating(false);
  };

  const calculateOptimalRoute = async () => {
    if (!startAddress.trim()) {
      toast.error(t.error, { description: t.enterStartAddress });
      return;
    }
    
    if (selectedLeads.size < 1) {
      toast.error(t.error, { description: t.selectAtLeast });
      return;
    }

    setCalculating(true);

    try {
      const response = await axios.post(`${API}/route/calculate`, {
        start_address: startAddress,
        lead_ids: Array.from(selectedLeads)
      });
      
      setRoute(response.data);
      if (response.data.start_point) {
        setStartCoords(response.data.start_point);
      }
      toast.success(t.routeCreated, { 
        description: `${response.data.total_distance.toFixed(1)} km, ~${response.data.estimated_hours.toFixed(1)} ${t.hours}` 
      });
    } catch (error) {
      // Fallback to local optimization if API fails
      if (startCoords) {
        autoOptimizeRoute();
      } else {
        const detail = error.response?.data?.detail || t.couldNotCalculate;
        toast.error(t.error, { description: detail });
      }
    } finally {
      setCalculating(false);
    }
  };

  const downloadRoutePdf = async () => {
    if (!route) return;
    
    setDownloadingPdf(true);
    try {
      const response = await axios.post(`${API}/route/pdf`, {
        start_address: startAddress,
        lead_ids: Array.from(selectedLeads)
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'route_plan.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t.pdfDownloaded);
    } catch (error) {
      toast.error(t.error, { description: t.couldNotDownload });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const openGoogleMapsRoute = () => {
    if (!route || !route.stops.length) return;

    const origin = `${route.start_point.lat},${route.start_point.lng}`;
    const waypoints = route.stops.map(p => `${p.lat},${p.lng}`).join('/');
    
    const url = `https://www.google.com/maps/dir/${origin}/${waypoints}`;
    window.open(url, '_blank');
  };

  const leadsWithCoords = leads.filter(lead => geocodedLeads[lead.id]);
  
  // Build map positions
  const mapPositions = [];
  if (startCoords) {
    mapPositions.push([startCoords.lat, startCoords.lng]);
  }
  Object.values(geocodedLeads).forEach(c => mapPositions.push([c.lat, c.lng]));

  const defaultCenter = mapPositions.length > 0 
    ? mapPositions[0] 
    : [52.52, 13.405];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="route-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="route-planner-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight font-['Manrope']">{t.title}</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            {t.subtitle}
            {geocoding && <span className="ml-2 text-orange-600">({t.loadingLocations})</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} disabled={Object.keys(geocodedLeads).length === 0}>
            <List className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.selectAll}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            <RotateCcw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.clear}</span>
          </Button>
        </div>
      </div>

      {/* Start Address Input */}
      <Card className="relative z-20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1 min-w-0 relative">
              <Label htmlFor="start-address" className="text-sm font-medium mb-2 block">
                {t.startAddress}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="start-address"
                  placeholder={t.searchPlaceholder}
                  value={startAddress}
                  onChange={handleAddressChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-10 pr-10"
                  data-testid="start-address-input"
                  autoComplete="off"
                />
                {searchingAddress && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {startAddress && !searchingAddress && (
                  <button
                    onClick={() => {
                      setStartAddress('');
                      setStartCoords(null);
                      setSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b last:border-b-0 transition-colors flex items-start gap-3"
                    >
                      <MapPin className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{suggestion.display_name.split(',')[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {suggestion.display_name.split(',').slice(1, 4).join(',')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {startCoords && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <MapPin className="w-4 h-4" />
                  <span>{t.addressVerified} ✓</span>
                </div>
              )}
            </div>
            
            {/* Buttons row - responsive */}
            <div className="flex flex-wrap gap-2">
              {/* Use My Location Button */}
              <Button 
                variant="outline"
                onClick={getUserLocation}
                disabled={gettingLocation}
                className="flex-1 sm:flex-none sm:min-w-[140px]"
                size="sm"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">{t.locating}</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t.useMyLocation}</span>
                  </>
                )}
              </Button>
              
              {/* Auto Optimize Button */}
              {startCoords && selectedLeads.size > 0 && (
                <Button 
                  variant="outline"
                  onClick={autoOptimizeRoute}
                  disabled={calculating}
                  className="flex-1 sm:flex-none bg-purple-50 hover:bg-purple-100 border-purple-200"
                  size="sm"
                >
                  <Zap className="w-4 h-4 sm:mr-2 text-purple-600" />
                  <span className="hidden sm:inline">{t.autoOptimize}</span>
                </Button>
              )}
              
              {/* Create Route Button */}
              <Button 
                onClick={calculateOptimalRoute} 
                disabled={calculating || selectedLeads.size < 1 || !startAddress.trim()}
                className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                size="sm"
              >
                {calculating ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Route className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">{calculating ? t.calculating : t.createRoute}</span>
              </Button>
            </div>
          </div>
          
          {/* Tips */}
          {!startCoords && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>{t.tip}:</strong> {t.tipText}
            </div>
          )}
          
          {/* Auto Optimize Info */}
          {startCoords && selectedLeads.size > 0 && !route && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg text-sm text-purple-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span><strong>{t.autoOptimize}:</strong> {t.optimizeByDistance}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <MapContainer
                center={defaultCenter}
                zoom={5}
                style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {mapPositions.length > 0 && <FitBounds positions={mapPositions} />}
                
                {/* Start point */}
                {startCoords && (
                  <Marker position={[startCoords.lat, startCoords.lng]} icon={greenIcon}>
                    <Popup>
                      <strong>{t.start}: {startCoords.address || startAddress}</strong>
                    </Popup>
                  </Marker>
                )}
                
                {/* Lead markers */}
                {leadsWithCoords.map((lead) => {
                  const coords = geocodedLeads[lead.id];
                  const isSelected = selectedLeads.has(lead.id);
                  const routeStop = route?.stops?.find(r => r.id === lead.id);
                  const routeIndex = route?.stops?.findIndex(r => r.id === lead.id) ?? -1;
                  
                  return (
                    <Marker 
                      key={lead.id} 
                      position={[coords.lat, coords.lng]}
                      icon={routeIndex >= 0 ? orangeIcon : (isSelected ? redIcon : blueIcon)}
                      eventHandlers={{
                        click: () => toggleLeadSelection(lead.id)
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          {routeIndex >= 0 && (
                            <span className="inline-block mb-2 px-2 py-1 bg-orange-500 text-white text-xs rounded">
                              #{routeIndex + 1} ({routeStop?.distance?.toFixed(1)} km)
                            </span>
                          )}
                          <strong>{lead.company_name}</strong><br />
                          <span className="text-sm text-gray-600">
                            {lead.city}, {lead.country}
                          </span><br />
                          {lead.first_name} {lead.last_name}
                          <div className="mt-2">
                            <button 
                              onClick={() => toggleLeadSelection(lead.id)}
                              className={`text-xs px-2 py-1 rounded ${isSelected ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
                            >
                              {isSelected ? t.remove : t.select}
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                
                {/* Route polyline */}
                {route && route.stops.length > 0 && startCoords && (
                  <Polyline
                    positions={[
                      [startCoords.lat, startCoords.lng],
                      ...route.stops.map(p => [p.lat, p.lng])
                    ]}
                    color="#f97316"
                    weight={4}
                    dashArray="10, 10"
                  />
                )}
              </MapContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Route Summary */}
          {route && (
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-orange-600" />
                  {t.routeSummary}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-orange-600">{route.total_distance.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t.kilometers}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{route.estimated_hours.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t.hours}</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-green-100 text-green-700">{t.start}</Badge>
                    <span className="truncate text-xs">{startAddress.slice(0, 30)}...</span>
                  </div>
                  {route.stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-center gap-2 text-sm">
                      <Badge className="bg-orange-500 text-white min-w-[24px] justify-center">{index + 1}</Badge>
                      <span className="truncate flex-1">{stop.company_name}</span>
                      <span className="text-xs text-muted-foreground">{stop.distance?.toFixed(0)} km</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={openGoogleMapsRoute}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Maps
                  </Button>
                  <Button variant="outline" onClick={downloadRoutePdf} disabled={downloadingPdf}>
                    {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lead Selection */}
          <Card className="max-h-[400px] overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t.customers}
                </span>
                <Badge variant="secondary">
                  {selectedLeads.size} / {leadsWithCoords.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              {geocoding ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.loadingLocations}
                </div>
              ) : leadsWithCoords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">{t.noCustomersWithLocation}</p>
                  <p className="text-xs mt-1">{t.addCustomersFirst}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leadsWithCoords.map((lead) => {
                    const isSelected = selectedLeads.has(lead.id);
                    const routeIndex = route?.stops?.findIndex(r => r.id === lead.id) ?? -1;
                    
                    return (
                      <div
                        key={lead.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50 border border-orange-200' : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => toggleLeadSelection(lead.id)}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{lead.company_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {lead.city}, {lead.country}
                          </p>
                        </div>
                        {routeIndex >= 0 && (
                          <Badge className="bg-orange-500 flex-shrink-0">
                            #{routeIndex + 1}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanner;
