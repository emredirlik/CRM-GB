import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MapPin, Navigation, Route, List, RotateCcw, ExternalLink, Loader2 } from 'lucide-react';
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
  const [route, setRoute] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [startPoint, setStartPoint] = useState({ lat: 52.52, lng: 13.405 }); // Berlin default
  const mapRef = useRef(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API}/leads`);
      setLeads(response.data);
      setLoading(false);
      
      // Start geocoding in background
      geocodeLeads(response.data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Hata', { description: 'Müşteriler yüklenemedi' });
      setLoading(false);
    }
  };

  const geocodeLeads = async (leadsList) => {
    setGeocoding(true);
    try {
      // Filter leads with city info
      const leadsToGeocode = leadsList.filter(lead => lead.city && lead.country);
      
      if (leadsToGeocode.length === 0) {
        setGeocoding(false);
        return;
      }

      // Use backend geocoding API
      const response = await axios.post(`${API}/geocode/batch`, leadsToGeocode);
      setGeocodedLeads(response.data);
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setGeocoding(false);
    }
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
    setRoute([]);
  };

  // Simple nearest neighbor algorithm for route optimization
  const calculateOptimalRoute = () => {
    if (selectedLeads.size < 2) {
      toast.error('Hata', { description: 'En az 2 müşteri seçin' });
      return;
    }

    setCalculating(true);

    // Get selected lead coordinates
    const points = Array.from(selectedLeads)
      .filter(id => geocodedLeads[id])
      .map(id => ({
        id,
        ...geocodedLeads[id],
        lead: leads.find(l => l.id === id)
      }));

    if (points.length < 2) {
      toast.error('Hata', { description: 'Seçilen müşterilerin konumları bulunamadı' });
      setCalculating(false);
      return;
    }

    // Nearest neighbor algorithm starting from Berlin
    const visited = new Set();
    const orderedRoute = [];
    let current = startPoint;

    while (visited.size < points.length) {
      let nearest = null;
      let nearestDist = Infinity;

      for (const point of points) {
        if (visited.has(point.id)) continue;
        
        const dist = Math.sqrt(
          Math.pow(current.lat - point.lat, 2) + 
          Math.pow(current.lng - point.lng, 2)
        );
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = point;
        }
      }

      if (nearest) {
        visited.add(nearest.id);
        orderedRoute.push(nearest);
        current = nearest;
      }
    }

    setRoute(orderedRoute);
    setCalculating(false);
    toast.success('Başarılı', { description: `${orderedRoute.length} noktalı rota oluşturuldu` });
  };

  const openGoogleMapsRoute = () => {
    if (route.length === 0) return;

    // Build Google Maps directions URL
    const waypoints = route.map(p => `${p.lat},${p.lng}`).join('/');
    const origin = `${startPoint.lat},${startPoint.lng}`;
    
    const url = `https://www.google.com/maps/dir/${origin}/${waypoints}`;
    window.open(url, '_blank');
  };

  const leadsWithCoords = leads.filter(lead => geocodedLeads[lead.id]);
  const mapPositions = Object.values(geocodedLeads).map(c => [c.lat, c.lng]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Rota Planlayıcı</h1>
          <p className="text-muted-foreground mt-1">
            İş seyahatleri için otomatik rota oluşturun
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
          <Button onClick={calculateOptimalRoute} disabled={calculating || selectedLeads.size < 2}>
            {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Route className="w-4 h-4 mr-2" />}
            {calculating ? 'Hesaplanıyor...' : 'Rota Oluştur'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <MapContainer
                center={[52.52, 13.405]}
                zoom={5}
                style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                
                {mapPositions.length > 0 && <FitBounds positions={mapPositions} />}
                
                {/* Start point (Berlin) */}
                <Marker position={[startPoint.lat, startPoint.lng]} icon={greenIcon}>
                  <Popup>
                    <strong>Başlangıç: Berlin</strong><br />
                    Gewürzberg GmbH
                  </Popup>
                </Marker>
                
                {/* Lead markers */}
                {leadsWithCoords.map((lead) => {
                  const coords = geocodedLeads[lead.id];
                  const isSelected = selectedLeads.has(lead.id);
                  const routeIndex = route.findIndex(r => r.id === lead.id);
                  
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
                              Durak #{routeIndex + 1}
                            </span>
                          )}
                          <strong>{lead.company_name}</strong><br />
                          <span className="text-sm text-gray-600">
                            {lead.city}, {lead.country}
                          </span><br />
                          {lead.first_name} {lead.last_name}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
                
                {/* Route polyline */}
                {route.length > 0 && (
                  <Polyline
                    positions={[
                      [startPoint.lat, startPoint.lng],
                      ...route.map(p => [p.lat, p.lng])
                    ]}
                    color="#f97316"
                    weight={3}
                    dashArray="10, 10"
                  />
                )}
              </MapContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Lead list and Route */}
        <div className="space-y-4">
          {/* Route Summary */}
          {route.length > 0 && (
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-orange-600" />
                  Planlanan Rota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-green-100">Başlangıç</Badge>
                    <span>Berlin - Gewürzberg GmbH</span>
                  </div>
                  {route.map((point, index) => (
                    <div key={point.id} className="flex items-center gap-2 text-sm">
                      <Badge className="bg-orange-500">{index + 1}</Badge>
                      <span className="truncate">{point.lead?.company_name}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={openGoogleMapsRoute}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Google Maps'te Aç
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lead Selection */}
          <Card className="max-h-[500px] overflow-hidden flex flex-col">
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  Konum bilgisi olan müşteri bulunamadı
                </p>
              ) : (
                <div className="space-y-2">
                  {leadsWithCoords.map((lead) => {
                    const isSelected = selectedLeads.has(lead.id);
                    const routeIndex = route.findIndex(r => r.id === lead.id);
                    
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
