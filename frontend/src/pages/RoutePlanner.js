import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { MapPin, Navigation, Route, List, RotateCcw, ExternalLink, Loader2, Clock, FileDown, Search } from 'lucide-react';
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
      toast.error('Error', { description: 'Failed to load customers' });
      setLoading(false);
    }
  };

  const geocodeLeads = async (leadsList) => {
    setGeocoding(true);
    try {
      const leadsToGeocode = leadsList.filter(lead => lead.city && lead.country);
      
      if (leadsToGeocode.length === 0) {
        setGeocoding(false);
        return;
      }

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
    setRoute(null);
    setStartCoords(null);
  };

  const calculateOptimalRoute = async () => {
    if (!startAddress.trim()) {
      toast.error('Error', { description: 'Please enter a start address' });
      return;
    }
    
    if (selectedLeads.size < 1) {
      toast.error('Error', { description: 'Select at least 1 customer' });
      return;
    }

    setCalculating(true);

    try {
      const response = await axios.post(`${API}/route/calculate`, {
        start_address: startAddress,
        lead_ids: Array.from(selectedLeads)
      });
      
      setRoute(response.data);
      setStartCoords(response.data.start_point);
      toast.success('Success', { 
        description: `Route created: ${response.data.total_distance.toFixed(1)} km, ~${response.data.estimated_hours.toFixed(1)} hours` 
      });
    } catch (error) {
      const detail = error.response?.data?.detail || 'Failed to calculate route';
      toast.error('Error', { description: detail });
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
      toast.success('Success', { description: 'PDF downloaded' });
    } catch (error) {
      toast.error('Error', { description: 'Failed to download PDF' });
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
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Route Planner</h1>
          <p className="text-muted-foreground mt-1">
            Create optimized routes for business trips
            {geocoding && <span className="ml-2 text-orange-600">(Loading locations...)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={selectAll} disabled={Object.keys(geocodedLeads).length === 0}>
            <List className="w-4 h-4 mr-2" />
            Select All
          </Button>
          <Button variant="outline" onClick={clearSelection}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Start Address Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <Label htmlFor="start-address" className="text-sm font-medium mb-2 block">
                Start Address
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="start-address"
                  placeholder="e.g. Gewürzberg GmbH, Berlin, Germany"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  className="pl-10"
                  data-testid="start-address-input"
                />
              </div>
            </div>
            <Button 
              onClick={calculateOptimalRoute} 
              disabled={calculating || selectedLeads.size < 1 || !startAddress.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {calculating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Route className="w-4 h-4 mr-2" />}
              {calculating ? 'Calculating...' : 'Create Route'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                
                {/* Start point */}
                {startCoords && (
                  <Marker position={[startCoords.lat, startCoords.lng]} icon={greenIcon}>
                    <Popup>
                      <strong>Start: {startAddress}</strong>
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
                              Stop #{routeIndex + 1} ({routeStop?.distance?.toFixed(1)} km)
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
                  Route Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-orange-600">{route.total_distance.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Kilometers</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                    <p className="text-2xl font-bold text-blue-600">{route.estimated_hours.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Hours</p>
                  </div>
                </div>
                
                {/* Stops */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-green-100 text-green-700">Start</Badge>
                    <span className="truncate text-xs">{startAddress}</span>
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
                  Customers
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
                  Loading locations...
                </div>
              ) : leadsWithCoords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No customers with location data found
                </p>
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
