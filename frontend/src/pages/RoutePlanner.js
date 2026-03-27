import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MapPin, Navigation, Route, List, RotateCcw, ExternalLink, Loader2, Clock, FileDown, Search, X } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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

const RoutePlanner = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [geocodedLeads, setGeocodedLeads] = useState({});
  const [route, setRoute] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [startAddress, setStartAddress] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  const mapRef = useRef(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API}/leads`);
      const leadsData = response.data;
      setLeads(leadsData);
      setLoading(false);
      
      // Start geocoding immediately
      if (leadsData.length > 0) {
        geocodeAllLeads(leadsData);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Error', { description: 'Failed to load customers' });
      setLoading(false);
    }
  };

  const geocodeAllLeads = async (leadsList) => {
    setGeocoding(true);
    const results = {};
    
    for (const lead of leadsList) {
      if (lead.city && lead.country) {
        try {
          const response = await axios.get(`${API}/geocode`, {
            params: { city: lead.city, country: lead.country }
          });
          if (response.data && response.data.lat) {
            // Add small random offset to prevent overlapping
            results[lead.id] = {
              lat: response.data.lat + (Math.random() - 0.5) * 0.01,
              lng: response.data.lng + (Math.random() - 0.5) * 0.01
            };
          }
        } catch (error) {
          console.error(`Geocoding failed for ${lead.company_name}:`, error);
        }
        // Small delay between requests
        await new Promise(r => setTimeout(r, 300));
      }
    }
    
    setGeocodedLeads(results);
    setGeocoding(false);
    
    if (Object.keys(results).length > 0) {
      toast.success(`${Object.keys(results).length} müşteri konumu yüklendi`);
    }
  };

  // Address autocomplete search via backend
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
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
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
    toast.success('Adres seçildi ✓');
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
  };

  const calculateOptimalRoute = async () => {
    if (!startAddress.trim()) {
      toast.error('Hata', { description: 'Lütfen başlangıç adresi girin' });
      return;
    }
    
    if (selectedLeads.size < 1) {
      toast.error('Hata', { description: 'En az 1 müşteri seçin' });
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
      toast.success('Rota oluşturuldu!', { 
        description: `${response.data.total_distance.toFixed(1)} km, ~${response.data.estimated_hours.toFixed(1)} saat` 
      });
    } catch (error) {
      const detail = error.response?.data?.detail || 'Rota hesaplanamadı';
      toast.error('Hata', { description: detail });
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
      link.setAttribute('download', 'rota_plani.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF indirildi');
    } catch (error) {
      toast.error('Hata', { description: 'PDF indirilemedi' });
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
  
  // Build map positions including start point
  const mapPositions = [];
  if (startCoords) {
    mapPositions.push([startCoords.lat, startCoords.lng]);
  }
  Object.values(geocodedLeads).forEach(c => mapPositions.push([c.lat, c.lng]));

  // Default center if no positions
  const defaultCenter = mapPositions.length > 0 
    ? mapPositions[0] 
    : [52.52, 13.405]; // Berlin

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="route-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="route-planner-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Rota Planlayıcı</h1>
          <p className="text-muted-foreground mt-1">
            İş gezileri için optimize edilmiş rotalar oluşturun
            {geocoding && <span className="ml-2 text-orange-600">(Konumlar yükleniyor...)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={selectAll} disabled={Object.keys(geocodedLeads).length === 0}>
            <List className="w-4 h-4 mr-2" />
            Tümünü Seç
          </Button>
          <Button variant="outline" onClick={clearSelection}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Temizle
          </Button>
        </div>
      </div>

      {/* Start Address Input with Autocomplete */}
      <Card className="relative z-50">
        <CardContent className="p-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Label htmlFor="start-address" className="text-sm font-medium mb-2 block">
                Başlangıç Adresi
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="start-address"
                  placeholder="Adres aramak için yazın... (örn: Berlin, Germany)"
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
              
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-[1000] max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b last:border-b-0 transition-colors flex items-start gap-3"
                      data-testid={`suggestion-${idx}`}
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
              
              {/* Selected address indicator */}
              {startCoords && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <MapPin className="w-4 h-4" />
                  <span>Adres doğrulandı ✓</span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={calculateOptimalRoute} 
              disabled={calculating || selectedLeads.size < 1 || !startAddress.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Route className="w-4 h-4 mr-2" />}
              {calculating ? 'Hesaplanıyor...' : 'Rota Oluştur'}
            </Button>
          </div>
          
          {/* Quick Tips */}
          {!startCoords && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>İpucu:</strong> Başlangıç adresinizi yazın (örn: "Gewürzberg GmbH, Berlin") ve önerilerden seçin. Ardından müşterileri seçip "Rota Oluştur" butonuna tıklayın.
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
                      <strong>Başlangıç: {startCoords.address || startAddress}</strong>
                    </Popup>
                  </Marker>
                )}
                
                {/* Lead markers - show ALL geocoded leads */}
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
                              Durak #{routeIndex + 1} ({routeStop?.distance?.toFixed(1)} km)
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
                              {isSelected ? 'Seçimi Kaldır' : 'Seç'}
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

        {/* Sidebar - Route Summary and Lead Selection */}
        <div className="space-y-4">
          {/* Route Summary */}
          {route && (
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-orange-600" />
                  Rota Özeti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-orange-600">{route.total_distance.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Kilometre</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{route.estimated_hours.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Saat</p>
                  </div>
                </div>
                
                {/* Stops */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-green-100 text-green-700">Başlangıç</Badge>
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
                
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    className="flex-1"
                    onClick={openGoogleMapsRoute}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Maps
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={downloadRoutePdf}
                    disabled={downloadingPdf}
                  >
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
                  Müşteriler
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
                  Konumlar yükleniyor...
                </div>
              ) : leadsWithCoords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Konumu olan müşteri yok</p>
                  <p className="text-xs mt-1">Önce şehir/ülke bilgisi olan müşteri ekleyin</p>
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
