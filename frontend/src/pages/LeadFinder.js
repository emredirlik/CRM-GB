import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  ExternalLink,
  Plus,
  CheckCircle,
  Factory,
  Globe
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Pre-defined countries and cities for quick selection
const LOCATIONS = {
  "Greece": ["Athens", "Thessaloniki", "Patras", "Heraklion"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
  "Poland": ["Warsaw", "Krakow", "Lodz", "Wroclaw", "Poznan"],
  "Austria": ["Vienna", "Graz", "Salzburg"],
  "France": ["Paris", "Lyon", "Marseille"],
  "Belgium": ["Brussels", "Antwerp", "Ghent"],
  "Italy": ["Rome", "Milan", "Naples", "Turin"],
  "Spain": ["Madrid", "Barcelona", "Valencia"]
};

const LeadFinder = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [location, setLocation] = useState('Athens');
  const [country, setCountry] = useState('Greece');
  const [results, setResults] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [searchTime, setSearchTime] = useState(null);

  const cities = LOCATIONS[country] || [];

  const handleSearch = async () => {
    if (!location || !country) {
      toast.error('Hata', { description: 'Şehir ve ülke seçin' });
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());
    const startTime = Date.now();

    try {
      const response = await axios.post(`${API}/leads/search`, {
        keywords: ['gyros', 'döner', 'kebab', 'meat factory'],
        location: location,
        country: country,
        limit: 30
      });
      
      const endTime = Date.now();
      setSearchTime(((endTime - startTime) / 1000).toFixed(1));
      
      if (response.data.leads && response.data.leads.length > 0) {
        setResults(response.data.leads);
        toast.success('Arama Tamamlandı!', { 
          description: `${response.data.leads.length} fabrika bulundu (${((endTime - startTime) / 1000).toFixed(1)}s)` 
        });
      } else {
        toast.warning('Sonuç bulunamadı', { description: 'Farklı bir lokasyon deneyin' });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Arama başarısız', { description: error.response?.data?.detail || 'Bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (index) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const selectAll = () => {
    if (selectedLeads.size === results.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(results.map((_, i) => i)));
    }
  };

  const importSelectedLeads = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Hata', { description: 'En az bir fabrika seçin' });
      return;
    }

    setImporting(true);
    let imported = 0;
    let failed = 0;

    for (const index of selectedLeads) {
      const lead = results[index];
      try {
        await axios.post(`${API}/leads`, {
          company_name: lead.company_name,
          first_name: lead.contact_person?.split(' ')[0] || '',
          last_name: lead.contact_person?.split(' ').slice(1).join(' ') || '',
          email: lead.email || '',
          phone: lead.phone || '',
          address: lead.address || '',
          city: lead.city || location,
          country: lead.country || country,
          tax_number: '',
          notes: `${lead.business_type || 'Factory'} - ${lead.website || 'No website'}`
        });
        imported++;
      } catch (error) {
        failed++;
      }
    }

    setImporting(false);
    
    if (imported > 0) {
      toast.success('İçe Aktarıldı!', { description: `${imported} fabrika müşteri listesine eklendi` });
      // Remove imported leads from results
      const newResults = results.filter((_, i) => !selectedLeads.has(i));
      setResults(newResults);
      setSelectedLeads(new Set());
    }
    if (failed > 0) {
      toast.warning('Uyarı', { description: `${failed} kayıt eklenemedi (muhtemelen zaten mevcut)` });
    }
  };

  return (
    <div className="space-y-6" data-testid="lead-finder-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight font-['Manrope'] flex items-center gap-3">
          <Factory className="w-10 h-10 text-orange-600" />
          Fabrika Bul
        </h1>
        <p className="text-muted-foreground mt-1">
          Döner, Gyros ve Kebap fabrikalarını hızlıca bulun
        </p>
      </div>

      {/* Search Form */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Country Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Ülke
              </Label>
              <Select value={country} onValueChange={(val) => {
                setCountry(val);
                setLocation(LOCATIONS[val]?.[0] || '');
              }}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Ülke seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(LOCATIONS).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Şehir
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom City Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">veya Şehir Yazın</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Özel şehir..."
                className="bg-white"
              />
            </div>

            {/* Search Button */}
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 h-10"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Aranıyor...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Fabrika Bul
                </>
              )}
            </Button>
          </div>

          {/* Quick Search Buttons */}
          <div className="mt-4 pt-4 border-t border-orange-200">
            <p className="text-sm text-muted-foreground mb-2">Hızlı Arama:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { city: 'Athens', country: 'Greece', label: '🇬🇷 Atina' },
                { city: 'Thessaloniki', country: 'Greece', label: '🇬🇷 Selanik' },
                { city: 'Berlin', country: 'Germany', label: '🇩🇪 Berlin' },
                { city: 'Istanbul', country: 'Turkey', label: '🇹🇷 İstanbul' },
                { city: 'Amsterdam', country: 'Netherlands', label: '🇳🇱 Amsterdam' },
                { city: 'Warsaw', country: 'Poland', label: '🇵🇱 Varşova' },
              ].map(({ city, country: c, label }) => (
                <Button
                  key={`${city}-${c}`}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCountry(c);
                    setLocation(city);
                  }}
                  className="bg-white hover:bg-orange-100"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-['Manrope'] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  Bulunan Fabrikalar
                </CardTitle>
                <CardDescription>
                  {results.length} fabrika bulundu {searchTime && `(${searchTime}s)`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedLeads.size === results.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                </Button>
                <Button 
                  onClick={importSelectedLeads} 
                  disabled={selectedLeads.size === 0 || importing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {selectedLeads.size > 0 ? `${selectedLeads.size} Fabrikayı Ekle` : 'Seçili Değil'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((lead, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedLeads.has(index) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                  onClick={() => toggleSelection(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedLeads.has(index) ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {selectedLeads.has(index) && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{lead.company_name}</h3>
                      <Badge variant="secondary" className="text-xs mt-1 mb-2">
                        <Factory className="w-3 h-3 mr-1" />
                        {lead.business_type || 'Factory'}
                      </Badge>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{lead.city}, {lead.country}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{lead.address}</span>
                          </div>
                        )}
                        {lead.website && lead.website !== 'N/A' && (
                          <a 
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Factory className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2">Fabrika Aramaya Başlayın</h3>
            <p className="text-muted-foreground mb-4">
              Yukarıdan ülke ve şehir seçip "Fabrika Bul" butonuna tıklayın
            </p>
            <div className="flex justify-center gap-2">
              <Badge variant="outline">Gyros Fabrikaları</Badge>
              <Badge variant="outline">Döner Üreticileri</Badge>
              <Badge variant="outline">Et İşleme Tesisleri</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Fabrikalar Aranıyor...</h3>
            <p className="text-muted-foreground">
              {location}, {country} bölgesinde fabrikalar taranıyor
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadFinder;
