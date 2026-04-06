import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Search, 
  Loader2, 
  Building2, 
  Phone, 
  MapPin,
  ExternalLink,
  Plus,
  CheckCircle,
  Factory,
  Globe,
  Sparkles,
  Filter,
  Download,
  Star,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Ülkeler ve şehirler
const COUNTRIES = {
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Düsseldorf", "Stuttgart", "Dortmund", "Essen", "Leipzig"],
  "Greece": ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Kavala"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Gaziantep", "Konya"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Bilbao"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Bordeaux"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg"],
  "Belgium": ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges"],
  "Austria": ["Vienna", "Graz", "Salzburg", "Linz", "Innsbruck"],
  "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool"],
  "Poland": ["Warsaw", "Krakow", "Wroclaw", "Poznan", "Gdansk", "Lodz"],
  "Romania": ["Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Constanta"],
  "Bulgaria": ["Sofia", "Plovdiv", "Varna", "Burgas"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  "Kuwait": ["Kuwait City", "Hawalli"],
  "Qatar": ["Doha", "Al Wakrah"],
};

const texts = {
  tr: {
    title: 'Müşteri Bul',
    subtitle: 'AI destekli fabrika arama motoru',
    country: 'Ülke',
    city: 'Şehir',
    allCities: 'Tüm Şehirler',
    search: 'Ara',
    searching: 'Aranıyor...',
    found: 'fabrika bulundu',
    addSelected: 'Seçilenleri Ekle',
    selectAll: 'Tümünü Seç',
    noResults: 'Sonuç bulunamadı',
    startSearch: 'Aramaya Başlayın',
    startSearchDesc: 'Ülke seçin ve AI ile döner/gyros/kebap fabrikalarını bulun',
    added: 'eklendi',
    error: 'Hata',
    keywords: 'Arama Kelimeleri',
    keywordsPlaceholder: 'döner fabrikası, gyros üretim, kebap...',
    keywordsHelp: 'Virgülle ayırarak birden fazla kelime yazın',
    quickFilters: 'Hızlı Filtreler',
    searchTemplates: 'Arama Şablonları',
    popularCountries: 'Popüler Ülkeler',
    resultsTitle: 'Arama Sonuçları',
    importToLeads: 'Müşterilere Aktar',
  },
  en: {
    title: 'Find Customers',
    subtitle: 'AI-powered factory search engine',
    country: 'Country',
    city: 'City',
    allCities: 'All Cities',
    search: 'Search',
    searching: 'Searching...',
    found: 'factories found',
    addSelected: 'Add Selected',
    selectAll: 'Select All',
    noResults: 'No results found',
    startSearch: 'Start Searching',
    startSearchDesc: 'Select a country and let AI find döner/gyros/kebab factories',
    added: 'added',
    error: 'Error',
    keywords: 'Search Keywords',
    keywordsPlaceholder: 'döner factory, gyros production, kebab...',
    keywordsHelp: 'Separate multiple keywords with commas',
    quickFilters: 'Quick Filters',
    searchTemplates: 'Search Templates',
    popularCountries: 'Popular Countries',
    resultsTitle: 'Search Results',
    importToLeads: 'Import to Leads',
  },
  de: {
    title: 'Kunden finden',
    subtitle: 'KI-gestützte Fabriksuche',
    country: 'Land',
    city: 'Stadt',
    allCities: 'Alle Städte',
    search: 'Suchen',
    searching: 'Suche läuft...',
    found: 'Fabriken gefunden',
    addSelected: 'Ausgewählte hinzufügen',
    selectAll: 'Alle auswählen',
    noResults: 'Keine Ergebnisse',
    startSearch: 'Suche starten',
    startSearchDesc: 'Wählen Sie ein Land und lassen Sie KI Döner/Gyros/Kebab-Fabriken finden',
    added: 'hinzugefügt',
    error: 'Fehler',
    keywords: 'Suchbegriffe',
    keywordsPlaceholder: 'Döner Fabrik, Gyros Produktion, Kebab...',
    keywordsHelp: 'Mehrere Begriffe mit Komma trennen',
    quickFilters: 'Schnellfilter',
    searchTemplates: 'Suchvorlagen',
    popularCountries: 'Beliebte Länder',
    resultsTitle: 'Suchergebnisse',
    importToLeads: 'Zu Leads importieren',
  },
};

const LeadFinder = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  
  const [activeTab, setActiveTab] = useState('database'); // 'database' or 'ai-search'
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [country, setCountry] = useState('Germany');
  const [city, setCity] = useState('');
  const [keywords, setKeywords] = useState('döner fabrikası, gyros üretim, kebap üretim, et işleme');
  const [results, setResults] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  
  // Database tab states
  const [dbLeads, setDbLeads] = useState([]);
  const [dbRegions, setDbRegions] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDbLeads, setSelectedDbLeads] = useState(new Set());

  const cities = COUNTRIES[country] || [];
  
  // Fetch database leads
  const fetchDatabaseLeads = async () => {
    setDbLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedRegion) params.append('region', selectedRegion);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axios.get(`${API}/potential-leads?${params.toString()}`);
      setDbLeads(response.data.leads || []);
      setDbRegions(response.data.regions || []);
    } catch (error) {
      toast.error('Veritabanı yüklenemedi');
    } finally {
      setDbLoading(false);
    }
  };
  
  // Initial load for database tab
  React.useEffect(() => {
    if (activeTab === 'database') {
      fetchDatabaseLeads();
    }
  }, [activeTab, selectedRegion]);
  
  // Search in database
  const handleDbSearch = () => {
    fetchDatabaseLeads();
  };
  
  // Convert potential lead to customer
  const convertToCustomer = async (leadId) => {
    try {
      await axios.post(`${API}/potential-leads/${leadId}/convert`);
      toast.success('Müşteri olarak eklendi!');
      fetchDatabaseLeads();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Dönüştürme başarısız');
    }
  };
  
  // Bulk convert selected leads
  const bulkConvertLeads = async () => {
    if (selectedDbLeads.size === 0) return;
    
    setImporting(true);
    let successCount = 0;
    
    for (const leadId of selectedDbLeads) {
      try {
        await axios.post(`${API}/potential-leads/${leadId}/convert`);
        successCount++;
      } catch (error) {
        console.error('Convert failed:', error);
      }
    }
    
    setImporting(false);
    toast.success(`${successCount} firma müşteri olarak eklendi!`);
    setSelectedDbLeads(new Set());
    fetchDatabaseLeads();
  };
  
  const parseKeywords = (str) => {
    return str.split(',').map(k => k.trim()).filter(k => k.length > 0);
  };

  const handleSearch = async () => {
    if (!country) {
      toast.error(t.error, { description: 'Ülke seçin' });
      return;
    }
    
    const keywordList = parseKeywords(keywords);
    if (keywordList.length === 0) {
      toast.error(t.error, { description: 'En az bir arama kelimesi girin' });
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());

    try {
      const response = await axios.post(`${API}/leads/search`, {
        keywords: keywordList,
        location: city || 'All',
        country: country,
        limit: 500
      });
      
      if (response.data.leads && response.data.leads.length > 0) {
        setResults(response.data.leads);
        toast.success(`${response.data.leads.length} ${t.found}`);
      } else {
        toast.warning(t.noResults);
      }
    } catch (error) {
      toast.error(t.error, { description: error.response?.data?.detail || 'Arama başarısız' });
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
    if (selectedLeads.size === 0) return;
    
    setImporting(true);
    let successCount = 0;
    
    for (const index of selectedLeads) {
      const lead = results[index];
      try {
        await axios.post(`${API}/leads`, {
          company_name: lead.company_name,
          contact_person: lead.contact_person || '',
          email: lead.email || '',
          phone: lead.phone || '',
          address: lead.address || '',
          city: lead.city || '',
          country: lead.country || country,
          website: lead.website || '',
          business_type: lead.business_type || 'Döner/Kebap Üretimi',
          notes: lead.notes || `AI ile bulundu - ${new Date().toLocaleDateString()}`,
          status: 'new'
        });
        successCount++;
      } catch (error) {
        console.error('Failed to import lead:', error);
      }
    }
    
    setImporting(false);
    toast.success(`${successCount} müşteri ${t.added}`);
    setSelectedLeads(new Set());
  };

  // Popular countries with flags
  const popularCountries = [
    { country: 'Germany', flag: '🇩🇪', city: '' },
    { country: 'Greece', flag: '🇬🇷', city: '' },
    { country: 'Turkey', flag: '🇹🇷', city: '' },
    { country: 'Romania', flag: '🇷🇴', city: '' },
    { country: 'Spain', flag: '🇪🇸', city: '' },
    { country: 'Netherlands', flag: '🇳🇱', city: '' },
    { country: 'UAE', flag: '🇦🇪', city: '' },
    { country: 'France', flag: '🇫🇷', city: '' },
  ];

  // Search templates
  const searchTemplates = [
    { label: 'Döner Fabrikası', keywords: 'döner fabrikası, döner produktion, döner üretim', icon: '🥙' },
    { label: 'Gyros Üretim', keywords: 'gyros üretim, gyros factory, γύρος production', icon: '🇬🇷' },
    { label: 'Kebap Fabrikası', keywords: 'kebap fabrikası, kebab production, kebap üretim', icon: '🍢' },
    { label: 'Et İşleme', keywords: 'et işleme, meat processing, fleischverarbeitung', icon: '🥩' },
    { label: 'Helal Et', keywords: 'helal et, halal meat, helal döner üretim', icon: '✓' },
  ];

  return (
    <div className="space-y-6" data-testid="lead-finder-page">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25">
            <Factory className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              {t.subtitle}
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">{Object.keys(COUNTRIES).length} Ülke</span>
            </div>
          </div>
          <div className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI Destekli</span>
            </div>
          </div>
          <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">{dbLeads.length} Fabrika</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <Button
          variant={activeTab === 'database' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('database')}
          className={activeTab === 'database' ? 'bg-indigo-600 text-white' : ''}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Almanya Veritabanı ({dbLeads.length})
        </Button>
        <Button
          variant={activeTab === 'ai-search' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('ai-search')}
          className={activeTab === 'ai-search' ? 'bg-purple-600 text-white' : ''}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI ile Ara
        </Button>
      </div>

      {/* Database Tab Content */}
      {activeTab === 'database' && (
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5" />
                <span className="font-semibold">Almanya Döner & Et Fabrikaları Veritabanı</span>
                <Badge className="bg-white/20 text-white border-0 ml-2">{dbLeads.length} Firma</Badge>
              </div>
              {selectedDbLeads.size > 0 && (
                <Button 
                  size="sm" 
                  onClick={bulkConvertLeads}
                  disabled={importing}
                  className="bg-white text-amber-600 hover:bg-amber-50"
                >
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {selectedDbLeads.size} Firma Ekle
                </Button>
              )}
            </div>
          </div>
          
          <CardContent className="p-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Firma adı veya şehir ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDbSearch()}
                />
              </div>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tüm Bölgeler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Bölgeler</SelectItem>
                  {dbRegions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleDbSearch} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Filtrele
              </Button>
            </div>
            
            {/* Results Grid */}
            {dbLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {dbLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className={`p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer ${
                      selectedDbLeads.has(lead.id) ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                    } ${lead.status === 'converted' ? 'opacity-60' : ''}`}
                    onClick={() => {
                      if (lead.status !== 'converted') {
                        const newSelected = new Set(selectedDbLeads);
                        if (newSelected.has(lead.id)) {
                          newSelected.delete(lead.id);
                        } else {
                          newSelected.add(lead.id);
                        }
                        setSelectedDbLeads(newSelected);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{lead.company_name}</h3>
                      {lead.status === 'converted' ? (
                        <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Eklendi
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            convertToCustomer(lead.id);
                          }}
                        >
                          <Plus className="w-4 h-4 text-amber-600" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{lead.city}</span>
                        {lead.region && <span className="text-amber-600">({lead.region})</span>}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.address && (
                        <div className="text-xs text-gray-400 truncate">{lead.address}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Search Tab Content */}
      {activeTab === 'ai-search' && (
      <Card className="overflow-hidden border-0 shadow-xl shadow-indigo-500/10">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-4">
          <div className="flex items-center gap-2 text-white">
            <Search className="w-5 h-5" />
            <span className="font-semibold">AI-Powered Search</span>
            <Badge className="bg-white/20 text-white border-0 ml-2">Beta</Badge>
          </div>
        </div>
        
        <CardContent className="p-6">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Ülke */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4 text-indigo-500" />
                {t.country}
              </Label>
              <Select value={country} onValueChange={(val) => { setCountry(val); setCity(''); }}>
                <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COUNTRIES).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Şehir */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4 text-indigo-500" />
                {t.city}
              </Label>
              <Select value={city || "all"} onValueChange={(val) => setCity(val === "all" ? "" : val)}>
                <SelectTrigger className="h-11 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                  <SelectValue placeholder={t.allCities} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allCities}</SelectItem>
                  {cities.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Arama Kelimeleri */}
            <div className="space-y-2 lg:col-span-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Search className="w-4 h-4 text-indigo-500" />
                {t.keywords}
              </Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={t.keywordsPlaceholder}
                className="h-11 border-2 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                data-testid="keywords-input"
              />
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30"
            size="lg"
            data-testid="search-factories-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t.searching}
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                {t.search}
              </>
            )}
          </Button>

          {/* Popular Countries */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t.popularCountries}</p>
            <div className="flex flex-wrap gap-2">
              {popularCountries.map(({ country: c, flag }) => (
                <button
                  key={c}
                  onClick={() => { setCountry(c); setCity(''); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    country === c 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                  }`}
                >
                  <span className="mr-2">{flag}</span>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Search Templates */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t.searchTemplates}</p>
            <div className="flex flex-wrap gap-2">
              {searchTemplates.map(({ label, keywords: kw, icon }) => (
                <button
                  key={label}
                  onClick={() => setKeywords(kw)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-50 to-indigo-50 text-indigo-700 hover:from-purple-100 hover:to-indigo-100 border border-indigo-200 transition-all duration-200"
                >
                  <span className="mr-2">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      )}
      {/* End of AI Search Tab - Search Form */}

      {/* Results Section - Inside AI Search Tab */}
      {activeTab === 'ai-search' && results.length > 0 && (
        <Card className="border-0 shadow-xl shadow-gray-200/50">
          <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t.resultsTitle}</h3>
                <p className="text-sm text-gray-500">{results.length} {t.found}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAll}
                className="border-gray-300"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {selectedLeads.size === results.length ? 'Seçimi Kaldır' : t.selectAll}
              </Button>
              <Button 
                onClick={importSelectedLeads} 
                disabled={selectedLeads.size === 0 || importing}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="add-selected-btn"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {selectedLeads.size > 0 ? `${selectedLeads.size} ${t.importToLeads}` : t.addSelected}
              </Button>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((lead, index) => (
                <div
                  key={index}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    selectedLeads.has(index) 
                      ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                      : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg bg-white'
                  }`}
                  onClick={() => toggleSelection(index)}
                  data-testid={`lead-card-${index}`}
                >
                  {/* Selection Indicator */}
                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedLeads.has(index) 
                      ? 'bg-indigo-500 border-indigo-500' 
                      : 'border-gray-300 group-hover:border-indigo-400'
                  }`}>
                    {selectedLeads.has(index) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>

                  {/* Company Info */}
                  <div className="pr-8">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">{lead.company_name}</h4>
                    <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs mb-3">
                      {lead.business_type || 'Fabrika'}
                    </Badge>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{lead.city}{lead.city && lead.country ? ', ' : ''}{lead.country}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.address && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{lead.address}</span>
                        </div>
                      )}
                    </div>

                    {lead.website && lead.website !== 'N/A' && (
                      <a 
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - Only for AI Search */}
      {activeTab === 'ai-search' && !loading && results.length === 0 && (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="py-16 text-center">
            <div className="inline-flex p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
              <Factory className="w-12 h-12 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">{t.startSearch}</h3>
            <p className="text-gray-500 max-w-md mx-auto">{t.startSearchDesc}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State - Only for AI Search */}
      {activeTab === 'ai-search' && loading && (
        <Card className="border-0 shadow-xl">
          <CardContent className="py-16 text-center">
            <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t.searching}</h3>
            <p className="text-muted-foreground">AI ile döner, gyros, kebap fabrikaları aranıyor...</p>
            <div className="mt-4 flex justify-center gap-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadFinder;
