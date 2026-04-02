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
  Sparkles
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Ülkeler ve şehirler
const COUNTRIES = {
  // Europe
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
  "Czech Republic": ["Prague", "Brno", "Ostrava", "Pilsen"],
  "Hungary": ["Budapest", "Debrecen", "Szeged", "Miskolc"],
  "Romania": ["Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Constanta"],
  "Bulgaria": ["Sofia", "Plovdiv", "Varna", "Burgas"],
  "Croatia": ["Zagreb", "Split", "Rijeka", "Osijek"],
  "Serbia": ["Belgrade", "Novi Sad", "Niš"],
  "Slovenia": ["Ljubljana", "Maribor"],
  "Slovakia": ["Bratislava", "Košice"],
  "Portugal": ["Lisbon", "Porto", "Braga"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö"],
  "Denmark": ["Copenhagen", "Aarhus", "Odense"],
  "Norway": ["Oslo", "Bergen", "Trondheim"],
  "Finland": ["Helsinki", "Espoo", "Tampere"],
  // Middle East
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  "Kuwait": ["Kuwait City", "Hawalli"],
  "Qatar": ["Doha", "Al Wakrah"],
  "Bahrain": ["Manama", "Riffa"],
  "Oman": ["Muscat", "Salalah"],
  "Jordan": ["Amman", "Zarqa", "Irbid"],
  "Lebanon": ["Beirut", "Tripoli", "Sidon"],
  "Israel": ["Tel Aviv", "Jerusalem", "Haifa"],
  "Egypt": ["Cairo", "Alexandria", "Giza"],
  // North Africa
  "Morocco": ["Casablanca", "Rabat", "Marrakech", "Fes"],
  "Tunisia": ["Tunis", "Sfax", "Sousse"],
  "Algeria": ["Algiers", "Oran", "Constantine"],
  // Other
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
};

const texts = {
  tr: {
    title: 'Fabrika Bul',
    subtitle: 'Döner, Gyros ve Kebap fabrikalarını AI ile bulun',
    country: 'Ülke',
    city: 'Şehir',
    allCities: 'Tüm Şehirler',
    search: 'Fabrika Ara',
    searching: 'AI arıyor...',
    found: 'fabrika bulundu',
    addSelected: 'Seçilenleri Ekle',
    selectAll: 'Tümünü Seç',
    noResults: 'Sonuç bulunamadı',
    startSearch: 'Aramaya başlayın',
    startSearchDesc: 'Ülke seçin ve AI döner/gyros/kebap fabrikalarını bulsun',
    added: 'eklendi',
    error: 'Hata',
    keywords: 'Arama Kelimeleri',
    keywordsPlaceholder: 'döner fabrikası, gyros üretim, kebap, et işleme...',
    keywordsHelp: 'Virgülle ayırarak birden fazla kelime yazabilirsiniz',
  },
  en: {
    title: 'Find Factories',
    subtitle: 'Find Döner, Gyros and Kebab factories with AI',
    country: 'Country',
    city: 'City',
    allCities: 'All Cities',
    search: 'Search Factories',
    searching: 'AI searching...',
    found: 'factories found',
    addSelected: 'Add Selected',
    selectAll: 'Select All',
    noResults: 'No results found',
    startSearch: 'Start searching',
    startSearchDesc: 'Select a country and let AI find döner/gyros/kebab factories',
    added: 'added',
    error: 'Error',
    keywords: 'Search Keywords',
    keywordsPlaceholder: 'döner factory, gyros production, kebab, meat processing...',
    keywordsHelp: 'Separate multiple keywords with commas',
  },
  de: {
    title: 'Fabriken finden',
    subtitle: 'Finden Sie Döner-, Gyros- und Kebab-Fabriken mit KI',
    country: 'Land',
    city: 'Stadt',
    allCities: 'Alle Städte',
    search: 'Fabriken suchen',
    searching: 'KI sucht...',
    found: 'Fabriken gefunden',
    addSelected: 'Ausgewählte hinzufügen',
    selectAll: 'Alle auswählen',
    noResults: 'Keine Ergebnisse',
    startSearch: 'Suche starten',
    startSearchDesc: 'Wählen Sie ein Land und lassen Sie KI Döner/Gyros/Kebab-Fabriken finden',
    added: 'hinzugefügt',
    error: 'Fehler',
    keywords: 'Suchbegriffe',
    keywordsPlaceholder: 'Döner Fabrik, Gyros Produktion, Kebab, Fleischverarbeitung...',
    keywordsHelp: 'Mehrere Begriffe mit Komma trennen',
  },
};

const LeadFinder = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [country, setCountry] = useState('Germany');
  const [city, setCity] = useState('');
  const [keywords, setKeywords] = useState('döner fabrikası, gyros üretim, kebap üretim, et işleme');
  const [results, setResults] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState(new Set());

  const cities = COUNTRIES[country] || [];
  
  // Parse keywords from comma-separated string
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
        limit: 500  // No limit - get all available results
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
    if (selectedLeads.size === 0) {
      toast.error(t.error, { description: 'En az bir fabrika seçin' });
      return;
    }

    setImporting(true);
    let imported = 0;

    for (const index of selectedLeads) {
      const lead = results[index];
      try {
        await axios.post(`${API}/leads`, {
          company_name: lead.company_name,
          first_name: lead.contact_person?.split(' ')[0] || 'Contact',
          last_name: lead.contact_person?.split(' ').slice(1).join(' ') || '',
          email: lead.email || '',
          phone: lead.phone || '',
          address: lead.address || '',
          city: lead.city || city || '',
          country: lead.country || country,
          tax_number: '',
          notes: `${lead.business_type || 'Factory'} - ${lead.website || ''}`
        });
        imported++;
      } catch (error) {
        console.error('Import error:', error);
      }
    }

    setImporting(false);
    
    if (imported > 0) {
      toast.success(`${imported} ${t.added}`);
      const newResults = results.filter((_, i) => !selectedLeads.has(i));
      setResults(newResults);
      setSelectedLeads(new Set());
    }
  };

  return (
    <div className="space-y-6 font-body" data-testid="lead-finder-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#BA4323] rounded-md">
          <Factory className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-zinc-900">{t.title}</h1>
          <p className="text-zinc-500 text-sm">{t.subtitle}</p>
        </div>
      </div>

      {/* Search Card */}
      <div className="bg-white border border-zinc-200 rounded-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#BA4323]" />
          <span className="font-medium text-zinc-900">AI-Powered Search</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Ülke */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-zinc-700 text-sm font-medium">
              <Globe className="w-4 h-4" />
              {t.country}
            </Label>
            <Select value={country} onValueChange={(val) => { setCountry(val); setCity(''); }}>
              <SelectTrigger className="bg-white border-zinc-200 focus:ring-2 focus:ring-[#BA4323]/20 focus:border-[#BA4323]">
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
            <Label className="flex items-center gap-2 text-zinc-700 text-sm font-medium">
              <MapPin className="w-4 h-4" />
              {t.city}
            </Label>
            <Select value={city || "all"} onValueChange={(val) => setCity(val === "all" ? "" : val)}>
              <SelectTrigger className="bg-white border-zinc-200 focus:ring-2 focus:ring-[#BA4323]/20 focus:border-[#BA4323]">
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

          {/* Custom City */}
          <div className="space-y-2">
            <Label className="text-zinc-700 text-sm font-medium">veya şehir yazın</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Şehir adı..."
              className="bg-white border-zinc-200 focus:ring-2 focus:ring-[#BA4323]/20 focus:border-[#BA4323]"
            />
          </div>

          {/* Arama Kelimeleri */}
          <div className="space-y-2 lg:col-span-2">
            <Label className="flex items-center gap-2 text-zinc-700 text-sm font-medium">
              <Search className="w-4 h-4" />
              {t.keywords}
            </Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder={t.keywordsPlaceholder}
              className="bg-white border-zinc-200 focus:ring-2 focus:ring-[#BA4323]/20 focus:border-[#BA4323]"
              data-testid="keywords-input"
            />
            <p className="text-xs text-zinc-500">{t.keywordsHelp}</p>
          </div>
        </div>
        
        {/* Search Button - Full Width */}
        <div className="mt-4">
          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="bg-[#BA4323] hover:bg-[#8C3118] text-white h-10 w-full md:w-auto rounded-md transition-colors duration-200"
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
        </div>

        {/* Quick Buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-200">
          <span className="text-xs tracking-[0.1em] uppercase font-medium text-zinc-500 mr-2">Hızlı Seç:</span>
          {[
            { city: 'Berlin', country: 'Germany', flag: '🇩🇪' },
            { city: 'Athens', country: 'Greece', flag: '🇬🇷' },
            { city: 'Istanbul', country: 'Turkey', flag: '🇹🇷' },
            { city: 'Bucharest', country: 'Romania', flag: '🇷🇴' },
            { city: 'Madrid', country: 'Spain', flag: '🇪🇸' },
            { city: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
            { city: 'Dubai', country: 'UAE', flag: '🇦🇪' },
          ].map(({ city: c, country: co, flag }) => (
            <Button
              key={`${c}-${co}`}
              variant="outline"
              size="sm"
              onClick={() => { setCountry(co); setCity(c); }}
              className="bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700 transition-colors duration-200"
            >
              {flag} {c}
            </Button>
          ))}
        </div>
        
        {/* Keyword Presets */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-200">
          <span className="text-xs tracking-[0.1em] uppercase font-medium text-zinc-500 mr-2">Şablonlar:</span>
          {[
            { label: 'Döner Fabrikası', keywords: 'döner fabrikası, döner produktion, döner üretim' },
            { label: 'Gyros Üretim', keywords: 'gyros üretim, gyros factory, γύρος' },
            { label: 'Kebap Fabrikası', keywords: 'kebap fabrikası, kebab production, kebap üretim' },
            { label: 'Et İşleme', keywords: 'et işleme, meat processing, fleischverarbeitung' },
            { label: 'Helal Et', keywords: 'helal et, halal meat, helal döner' },
          ].map(({ label, keywords: kw }) => (
            <Button
              key={label}
              variant="outline"
              size="sm"
              onClick={() => setKeywords(kw)}
              className="bg-white hover:bg-[#BA4323]/10 text-[#BA4323] border-[#BA4323]/30 transition-colors duration-200"
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span className="font-heading font-semibold text-zinc-900">{results.length} {t.found}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="border-zinc-200">
                {selectedLeads.size === results.length ? 'Seçimi Kaldır' : t.selectAll}
              </Button>
              <Button 
                onClick={importSelectedLeads} 
                disabled={selectedLeads.size === 0 || importing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
                data-testid="add-selected-btn"
              >
                {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {selectedLeads.size > 0 ? `${selectedLeads.size} ${t.addSelected}` : t.addSelected}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((lead, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border transition-all cursor-pointer hover:-translate-y-0.5 ${
                  selectedLeads.has(index) 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-zinc-200 hover:border-[#BA4323]/50 hover:shadow-md bg-white'
                }`}
                onClick={() => toggleSelection(index)}
                data-testid={`lead-card-${index}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedLeads.has(index) ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300'
                  }`}>
                    {selectedLeads.has(index) && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate text-zinc-900">{lead.company_name}</h3>
                    <Badge variant="secondary" className="text-xs mt-1 mb-2 bg-[#BA4323]/10 text-[#BA4323] border-0">
                      <Factory className="w-3 h-3 mr-1" />
                      {lead.business_type || 'Factory'}
                    </Badge>
                    
                    <div className="space-y-1 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{lead.city}, {lead.country}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.website && lead.website !== 'N/A' && (
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#BA4323] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div className="bg-white border border-dashed border-zinc-300 rounded-md py-16 text-center">
          <Factory className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
          <h3 className="text-xl font-heading font-semibold mb-2 text-zinc-900">{t.startSearch}</h3>
          <p className="text-zinc-500">{t.startSearchDesc}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-zinc-200 rounded-md py-16 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#BA4323] animate-pulse" />
          <h3 className="text-xl font-heading font-semibold mb-2 text-zinc-900">{t.searching}</h3>
          <p className="text-zinc-500">Döner, Gyros, Kebap fabrikaları aranıyor...</p>
        </div>
      )}
    </div>
  );
};

export default LeadFinder;
