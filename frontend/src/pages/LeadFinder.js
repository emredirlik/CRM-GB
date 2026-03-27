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
  Globe,
  Filter,
  X
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ALL countries with major cities
const LOCATIONS = {
  // Europe
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Düsseldorf", "Stuttgart", "Dortmund"],
  "Greece": ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Kavala", "Rhodes", "Corfu"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg"],
  "Poland": ["Warsaw", "Krakow", "Lodz", "Wroclaw", "Poznan", "Gdansk", "Szczecin"],
  "Austria": ["Vienna", "Graz", "Salzburg", "Linz", "Innsbruck"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Bordeaux", "Lille"],
  "Belgium": ["Brussels", "Antwerp", "Ghent", "Bruges", "Liege"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Florence", "Venice", "Bologna"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Bilbao"],
  "UK": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool"],
  "Switzerland": ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö", "Uppsala"],
  "Denmark": ["Copenhagen", "Aarhus", "Odense"],
  "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger"],
  "Finland": ["Helsinki", "Tampere", "Turku", "Oulu"],
  "Portugal": ["Lisbon", "Porto", "Braga", "Faro"],
  "Czech Republic": ["Prague", "Brno", "Ostrava", "Plzen"],
  "Hungary": ["Budapest", "Debrecen", "Szeged", "Pécs"],
  "Romania": ["Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Constanta", "Brasov"],
  "Bulgaria": ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse"],
  "Croatia": ["Zagreb", "Split", "Rijeka", "Osijek"],
  "Serbia": ["Belgrade", "Novi Sad", "Niš", "Kragujevac"],
  "Slovenia": ["Ljubljana", "Maribor", "Celje"],
  "Slovakia": ["Bratislava", "Košice", "Prešov"],
  "Ukraine": ["Kyiv", "Kharkiv", "Odessa", "Lviv", "Dnipro"],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg"],
  "Ireland": ["Dublin", "Cork", "Galway", "Limerick"],
  "Luxembourg": ["Luxembourg City"],
  "Malta": ["Valletta", "Birkirkara"],
  "Cyprus": ["Nicosia", "Limassol", "Larnaca"],
  "Iceland": ["Reykjavik"],
  "Estonia": ["Tallinn", "Tartu"],
  "Latvia": ["Riga", "Daugavpils"],
  "Lithuania": ["Vilnius", "Kaunas", "Klaipėda"],
  "Albania": ["Tirana", "Durrës", "Vlorë"],
  "North Macedonia": ["Skopje", "Bitola"],
  "Montenegro": ["Podgorica", "Nikšić"],
  "Bosnia": ["Sarajevo", "Banja Luka"],
  "Kosovo": ["Pristina", "Prizren"],
  "Moldova": ["Chișinău"],
  "Belarus": ["Minsk", "Gomel", "Mogilev"],
  
  // Middle East
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
  "Qatar": ["Doha", "Al Wakrah"],
  "Kuwait": ["Kuwait City", "Hawalli"],
  "Bahrain": ["Manama", "Riffa"],
  "Oman": ["Muscat", "Salalah"],
  "Jordan": ["Amman", "Zarqa", "Irbid"],
  "Lebanon": ["Beirut", "Tripoli", "Sidon"],
  "Israel": ["Tel Aviv", "Jerusalem", "Haifa"],
  "Iraq": ["Baghdad", "Basra", "Erbil", "Mosul"],
  "Iran": ["Tehran", "Mashhad", "Isfahan", "Tabriz"],
  "Syria": ["Damascus", "Aleppo", "Homs"],
  "Yemen": ["Sana'a", "Aden"],
  
  // Africa
  "Egypt": ["Cairo", "Alexandria", "Giza", "Sharm El Sheikh"],
  "Morocco": ["Casablanca", "Marrakech", "Rabat", "Fes", "Tangier"],
  "Tunisia": ["Tunis", "Sfax", "Sousse"],
  "Algeria": ["Algiers", "Oran", "Constantine"],
  "Libya": ["Tripoli", "Benghazi"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria"],
  "Nigeria": ["Lagos", "Abuja", "Kano"],
  "Kenya": ["Nairobi", "Mombasa"],
  "Ghana": ["Accra", "Kumasi"],
  "Ethiopia": ["Addis Ababa"],
  
  // Americas
  "USA": ["New York", "Los Angeles", "Chicago", "Houston", "Miami", "Dallas", "Atlanta"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa"],
  "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Cancún"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario"],
  "Colombia": ["Bogotá", "Medellín", "Cali"],
  "Chile": ["Santiago", "Valparaíso", "Concepción"],
  "Peru": ["Lima", "Arequipa", "Cusco"],
  
  // Asia
  "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Hong Kong"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Nagoya", "Yokohama"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata"],
  "Pakistan": ["Karachi", "Lahore", "Islamabad", "Rawalpindi"],
  "Bangladesh": ["Dhaka", "Chittagong"],
  "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Bali"],
  "Malaysia": ["Kuala Lumpur", "George Town", "Johor Bahru"],
  "Singapore": ["Singapore"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya"],
  "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang"],
  "Philippines": ["Manila", "Cebu", "Davao"],
  "Taiwan": ["Taipei", "Kaohsiung", "Taichung"],
  
  // Oceania
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "New Zealand": ["Auckland", "Wellington", "Christchurch"],
};

// Keyword presets
const KEYWORD_PRESETS = {
  en: [
    { id: 'gyros', label: 'Gyros', keywords: ['gyros', 'gyro'] },
    { id: 'doner', label: 'Döner', keywords: ['döner', 'doner', 'kebab'] },
    { id: 'meat', label: 'Meat Processing', keywords: ['meat', 'meat processing', 'meat factory'] },
    { id: 'poultry', label: 'Poultry', keywords: ['poultry', 'chicken', 'turkey'] },
    { id: 'sausage', label: 'Sausage', keywords: ['sausage', 'wurst', 'salami'] },
    { id: 'halal', label: 'Halal', keywords: ['halal', 'halal meat'] },
    { id: 'spice', label: 'Spice Factory', keywords: ['spice', 'seasoning', 'baharat'] },
    { id: 'food', label: 'Food Production', keywords: ['food', 'food factory', 'food production'] },
  ],
  tr: [
    { id: 'gyros', label: 'Gyros', keywords: ['gyros', 'gyro'] },
    { id: 'doner', label: 'Döner', keywords: ['döner', 'doner', 'kebap'] },
    { id: 'meat', label: 'Et İşleme', keywords: ['et', 'et işleme', 'et fabrikası'] },
    { id: 'poultry', label: 'Tavuk/Kanatlı', keywords: ['tavuk', 'kanatlı', 'hindi'] },
    { id: 'sausage', label: 'Sucuk/Sosis', keywords: ['sucuk', 'sosis', 'salam'] },
    { id: 'halal', label: 'Helal', keywords: ['helal', 'helal et'] },
    { id: 'spice', label: 'Baharat', keywords: ['baharat', 'baharat fabrikası'] },
    { id: 'food', label: 'Gıda Üretimi', keywords: ['gıda', 'gıda fabrikası'] },
  ],
  de: [
    { id: 'gyros', label: 'Gyros', keywords: ['gyros', 'gyro'] },
    { id: 'doner', label: 'Döner', keywords: ['döner', 'doner', 'kebab'] },
    { id: 'meat', label: 'Fleischverarbeitung', keywords: ['fleisch', 'fleischverarbeitung'] },
    { id: 'poultry', label: 'Geflügel', keywords: ['geflügel', 'hähnchen', 'pute'] },
    { id: 'sausage', label: 'Wurst', keywords: ['wurst', 'salami', 'bratwurst'] },
    { id: 'halal', label: 'Halal', keywords: ['halal', 'halal fleisch'] },
    { id: 'spice', label: 'Gewürzfabrik', keywords: ['gewürz', 'gewürzfabrik'] },
    { id: 'food', label: 'Lebensmittelproduktion', keywords: ['lebensmittel', 'lebensmittelfabrik'] },
  ],
  pl: [
    { id: 'gyros', label: 'Gyros', keywords: ['gyros', 'gyro'] },
    { id: 'doner', label: 'Döner', keywords: ['döner', 'doner', 'kebab'] },
    { id: 'meat', label: 'Przetwórstwo mięsa', keywords: ['mięso', 'przetwórstwo mięsa'] },
    { id: 'poultry', label: 'Drób', keywords: ['drób', 'kurczak', 'indyk'] },
    { id: 'sausage', label: 'Kiełbasa', keywords: ['kiełbasa', 'wędliny'] },
    { id: 'halal', label: 'Halal', keywords: ['halal'] },
    { id: 'spice', label: 'Fabryka przypraw', keywords: ['przyprawy', 'fabryka przypraw'] },
    { id: 'food', label: 'Produkcja żywności', keywords: ['żywność', 'fabryka żywności'] },
  ],
};

// Translations
const texts = {
  en: {
    title: 'Find Factories',
    subtitle: 'Find Döner, Gyros and Kebab factories quickly',
    country: 'Country',
    city: 'City',
    selectCountry: 'Select country',
    selectCity: 'Select city',
    orTypeCity: 'or Type City',
    customCity: 'Custom city...',
    keywords: 'Keywords',
    selectKeywords: 'Select factory types to search',
    quickSearch: 'Quick Search',
    search: 'Search Factories',
    searching: 'Searching...',
    foundFactories: 'Found Factories',
    factoriesFound: 'factories found',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    addSelected: 'Add Selected',
    notSelected: 'Not Selected',
    startSearch: 'Start Searching',
    startSearchDesc: 'Select country and city, then click "Search Factories"',
    searchingIn: 'Searching factories in',
    error: 'Error',
    selectCityCountry: 'Select city and country',
    searchComplete: 'Search Complete!',
    factoriesFoundIn: 'factories found in',
    noResults: 'No results found',
    tryDifferent: 'Try a different location',
    searchFailed: 'Search failed',
    imported: 'Imported!',
    factoriesAdded: 'factories added to customer list',
    warning: 'Warning',
    couldNotAdd: 'records could not be added (probably already exists)',
    selectAtLeast: 'Select at least one factory',
    allCountries: 'All Countries',
    filterByRegion: 'Filter by Region',
    europe: 'Europe',
    middleEast: 'Middle East',
    asia: 'Asia',
    africa: 'Africa',
    americas: 'Americas',
    oceania: 'Oceania',
  },
  tr: {
    title: 'Fabrika Bul',
    subtitle: 'Döner, Gyros ve Kebap fabrikalarını hızlıca bulun',
    country: 'Ülke',
    city: 'Şehir',
    selectCountry: 'Ülke seçin',
    selectCity: 'Şehir seçin',
    orTypeCity: 'veya Şehir Yazın',
    customCity: 'Özel şehir...',
    keywords: 'Anahtar Kelimeler',
    selectKeywords: 'Aranacak fabrika türlerini seçin',
    quickSearch: 'Hızlı Arama',
    search: 'Fabrika Bul',
    searching: 'Aranıyor...',
    foundFactories: 'Bulunan Fabrikalar',
    factoriesFound: 'fabrika bulundu',
    selectAll: 'Tümünü Seç',
    deselectAll: 'Seçimi Kaldır',
    addSelected: 'Seçilenleri Ekle',
    notSelected: 'Seçili Değil',
    startSearch: 'Aramaya Başlayın',
    startSearchDesc: 'Ülke ve şehir seçip "Fabrika Bul" butonuna tıklayın',
    searchingIn: 'bölgesinde fabrikalar aranıyor',
    error: 'Hata',
    selectCityCountry: 'Şehir ve ülke seçin',
    searchComplete: 'Arama Tamamlandı!',
    factoriesFoundIn: 'fabrika bulundu',
    noResults: 'Sonuç bulunamadı',
    tryDifferent: 'Farklı bir lokasyon deneyin',
    searchFailed: 'Arama başarısız',
    imported: 'İçe Aktarıldı!',
    factoriesAdded: 'fabrika müşteri listesine eklendi',
    warning: 'Uyarı',
    couldNotAdd: 'kayıt eklenemedi (muhtemelen zaten mevcut)',
    selectAtLeast: 'En az bir fabrika seçin',
    allCountries: 'Tüm Ülkeler',
    filterByRegion: 'Bölgeye Göre Filtrele',
    europe: 'Avrupa',
    middleEast: 'Orta Doğu',
    asia: 'Asya',
    africa: 'Afrika',
    americas: 'Amerika',
    oceania: 'Okyanusya',
  },
  de: {
    title: 'Fabriken finden',
    subtitle: 'Finden Sie Döner-, Gyros- und Kebab-Fabriken schnell',
    country: 'Land',
    city: 'Stadt',
    selectCountry: 'Land auswählen',
    selectCity: 'Stadt auswählen',
    orTypeCity: 'oder Stadt eingeben',
    customCity: 'Andere Stadt...',
    keywords: 'Suchbegriffe',
    selectKeywords: 'Zu suchende Fabriktypen auswählen',
    quickSearch: 'Schnellsuche',
    search: 'Fabriken suchen',
    searching: 'Suche läuft...',
    foundFactories: 'Gefundene Fabriken',
    factoriesFound: 'Fabriken gefunden',
    selectAll: 'Alle auswählen',
    deselectAll: 'Auswahl aufheben',
    addSelected: 'Ausgewählte hinzufügen',
    notSelected: 'Nicht ausgewählt',
    startSearch: 'Suche starten',
    startSearchDesc: 'Land und Stadt auswählen, dann "Fabriken suchen" klicken',
    searchingIn: 'Suche Fabriken in',
    error: 'Fehler',
    selectCityCountry: 'Stadt und Land auswählen',
    searchComplete: 'Suche abgeschlossen!',
    factoriesFoundIn: 'Fabriken gefunden in',
    noResults: 'Keine Ergebnisse',
    tryDifferent: 'Versuchen Sie einen anderen Standort',
    searchFailed: 'Suche fehlgeschlagen',
    imported: 'Importiert!',
    factoriesAdded: 'Fabriken zur Kundenliste hinzugefügt',
    warning: 'Warnung',
    couldNotAdd: 'Einträge konnten nicht hinzugefügt werden',
    selectAtLeast: 'Mindestens eine Fabrik auswählen',
    allCountries: 'Alle Länder',
    filterByRegion: 'Nach Region filtern',
    europe: 'Europa',
    middleEast: 'Naher Osten',
    asia: 'Asien',
    africa: 'Afrika',
    americas: 'Amerika',
    oceania: 'Ozeanien',
  },
  pl: {
    title: 'Znajdź fabryki',
    subtitle: 'Szybko znajdź fabryki Döner, Gyros i Kebab',
    country: 'Kraj',
    city: 'Miasto',
    selectCountry: 'Wybierz kraj',
    selectCity: 'Wybierz miasto',
    orTypeCity: 'lub wpisz miasto',
    customCity: 'Inne miasto...',
    keywords: 'Słowa kluczowe',
    selectKeywords: 'Wybierz typy fabryk do wyszukania',
    quickSearch: 'Szybkie wyszukiwanie',
    search: 'Szukaj fabryk',
    searching: 'Szukanie...',
    foundFactories: 'Znalezione fabryki',
    factoriesFound: 'fabryk znalezionych',
    selectAll: 'Zaznacz wszystko',
    deselectAll: 'Odznacz wszystko',
    addSelected: 'Dodaj wybrane',
    notSelected: 'Nie wybrano',
    startSearch: 'Rozpocznij wyszukiwanie',
    startSearchDesc: 'Wybierz kraj i miasto, następnie kliknij "Szukaj fabryk"',
    searchingIn: 'Szukanie fabryk w',
    error: 'Błąd',
    selectCityCountry: 'Wybierz miasto i kraj',
    searchComplete: 'Wyszukiwanie zakończone!',
    factoriesFoundIn: 'fabryk znalezionych',
    noResults: 'Brak wyników',
    tryDifferent: 'Spróbuj innej lokalizacji',
    searchFailed: 'Wyszukiwanie nie powiodło się',
    imported: 'Zaimportowano!',
    factoriesAdded: 'fabryk dodanych do listy klientów',
    warning: 'Ostrzeżenie',
    couldNotAdd: 'rekordów nie można dodać',
    selectAtLeast: 'Wybierz co najmniej jedną fabrykę',
    allCountries: 'Wszystkie kraje',
    filterByRegion: 'Filtruj według regionu',
    europe: 'Europa',
    middleEast: 'Bliski Wschód',
    asia: 'Azja',
    africa: 'Afryka',
    americas: 'Ameryka',
    oceania: 'Oceania',
  },
};

// Region groupings
const REGIONS = {
  europe: ["Germany", "Greece", "Netherlands", "Poland", "Austria", "France", "Belgium", "Italy", "Spain", "UK", "Switzerland", "Sweden", "Denmark", "Norway", "Finland", "Portugal", "Czech Republic", "Hungary", "Romania", "Bulgaria", "Croatia", "Serbia", "Slovenia", "Slovakia", "Ukraine", "Russia", "Ireland", "Luxembourg", "Malta", "Cyprus", "Iceland", "Estonia", "Latvia", "Lithuania", "Albania", "North Macedonia", "Montenegro", "Bosnia", "Kosovo", "Moldova", "Belarus"],
  middleEast: ["Turkey", "Saudi Arabia", "UAE", "Qatar", "Kuwait", "Bahrain", "Oman", "Jordan", "Lebanon", "Israel", "Iraq", "Iran", "Syria", "Yemen"],
  asia: ["China", "Japan", "South Korea", "India", "Pakistan", "Bangladesh", "Indonesia", "Malaysia", "Singapore", "Thailand", "Vietnam", "Philippines", "Taiwan"],
  africa: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "South Africa", "Nigeria", "Kenya", "Ghana", "Ethiopia"],
  americas: ["USA", "Canada", "Mexico", "Brazil", "Argentina", "Colombia", "Chile", "Peru"],
  oceania: ["Australia", "New Zealand"],
};

const LeadFinder = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  const keywordPresets = KEYWORD_PRESETS[language] || KEYWORD_PRESETS.en;
  
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [location, setLocation] = useState('Athens');
  const [country, setCountry] = useState('Greece');
  const [results, setResults] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [searchTime, setSearchTime] = useState(null);
  const [selectedKeywords, setSelectedKeywords] = useState(['gyros', 'doner', 'meat']);
  const [regionFilter, setRegionFilter] = useState('all');

  const cities = LOCATIONS[country] || [];
  
  // Filter countries by region
  const getFilteredCountries = () => {
    if (regionFilter === 'all') return Object.keys(LOCATIONS).sort();
    return REGIONS[regionFilter]?.filter(c => LOCATIONS[c]) || [];
  };

  const toggleKeyword = (id) => {
    setSelectedKeywords(prev => 
      prev.includes(id) 
        ? prev.filter(k => k !== id)
        : [...prev, id]
    );
  };

  const getSelectedKeywordsList = () => {
    return keywordPresets
      .filter(p => selectedKeywords.includes(p.id))
      .flatMap(p => p.keywords);
  };

  const handleSearch = async () => {
    if (!location || !country) {
      toast.error(t.error, { description: t.selectCityCountry });
      return;
    }

    setLoading(true);
    setResults([]);
    setSelectedLeads(new Set());
    const startTime = Date.now();

    try {
      const keywords = getSelectedKeywordsList();
      const response = await axios.post(`${API}/leads/search`, {
        keywords: keywords.length > 0 ? keywords : ['gyros', 'döner', 'kebab', 'meat factory'],
        location: location,
        country: country,
        limit: 50
      });
      
      const endTime = Date.now();
      setSearchTime(((endTime - startTime) / 1000).toFixed(1));
      
      if (response.data.leads && response.data.leads.length > 0) {
        setResults(response.data.leads);
        toast.success(t.searchComplete, { 
          description: `${response.data.leads.length} ${t.factoriesFoundIn} (${((endTime - startTime) / 1000).toFixed(1)}s)` 
        });
      } else {
        toast.warning(t.noResults, { description: t.tryDifferent });
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error(t.searchFailed, { description: error.response?.data?.detail || 'Error' });
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
      toast.error(t.error, { description: t.selectAtLeast });
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
      toast.success(t.imported, { description: `${imported} ${t.factoriesAdded}` });
      const newResults = results.filter((_, i) => !selectedLeads.has(i));
      setResults(newResults);
      setSelectedLeads(new Set());
    }
    if (failed > 0) {
      toast.warning(t.warning, { description: `${failed} ${t.couldNotAdd}` });
    }
  };

  return (
    <div className="space-y-6" data-testid="lead-finder-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight font-['Manrope'] flex items-center gap-3">
          <Factory className="w-10 h-10 text-orange-600" />
          {t.title}
        </h1>
        <p className="text-muted-foreground mt-1">{t.subtitle}</p>
      </div>

      {/* Search Form */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardContent className="p-6">
          {/* Region Filter */}
          <div className="mb-4 pb-4 border-b border-orange-200">
            <Label className="text-sm font-medium mb-2 block">{t.filterByRegion}</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={regionFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRegionFilter('all')}
                className={regionFilter === 'all' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              >
                {t.allCountries}
              </Button>
              {Object.entries(REGIONS).map(([key, _]) => (
                <Button
                  key={key}
                  variant={regionFilter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRegionFilter(key)}
                  className={regionFilter === key ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  {t[key]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Country Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t.country}
              </Label>
              <Select value={country} onValueChange={(val) => {
                setCountry(val);
                setLocation(LOCATIONS[val]?.[0] || '');
              }}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t.selectCountry} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getFilteredCountries().map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t.city}
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t.selectCity} />
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
              <Label className="text-sm font-medium">{t.orTypeCity}</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.customCity}
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

          {/* Keyword Filters */}
          <div className="mt-4 pt-4 border-t border-orange-200">
            <Label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {t.keywords}
            </Label>
            <p className="text-xs text-muted-foreground mb-2">{t.selectKeywords}</p>
            <div className="flex flex-wrap gap-2">
              {keywordPresets.map((preset) => (
                <Button
                  key={preset.id}
                  variant={selectedKeywords.includes(preset.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleKeyword(preset.id)}
                  className={selectedKeywords.includes(preset.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-white'}
                >
                  {selectedKeywords.includes(preset.id) && <CheckCircle className="w-3 h-3 mr-1" />}
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Search Buttons */}
          <div className="mt-4 pt-4 border-t border-orange-200">
            <p className="text-sm text-muted-foreground mb-2">{t.quickSearch}:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { city: 'Athens', country: 'Greece', flag: '🇬🇷' },
                { city: 'Thessaloniki', country: 'Greece', flag: '🇬🇷' },
                { city: 'Berlin', country: 'Germany', flag: '🇩🇪' },
                { city: 'Istanbul', country: 'Turkey', flag: '🇹🇷' },
                { city: 'Bucharest', country: 'Romania', flag: '🇷🇴' },
                { city: 'Sofia', country: 'Bulgaria', flag: '🇧🇬' },
                { city: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦' },
                { city: 'Dubai', country: 'UAE', flag: '🇦🇪' },
              ].map(({ city, country: c, flag }) => (
                <Button
                  key={`${city}-${c}`}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCountry(c);
                    setLocation(city);
                    setRegionFilter('all');
                  }}
                  className="bg-white hover:bg-orange-100"
                >
                  {flag} {city}
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
                  {t.foundFactories}
                </CardTitle>
                <CardDescription>
                  {results.length} {t.factoriesFound} {searchTime && `(${searchTime}s)`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {selectedLeads.size === results.length ? t.deselectAll : t.selectAll}
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
                  {selectedLeads.size > 0 ? `${selectedLeads.size} ${t.addSelected}` : t.notSelected}
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
            <h3 className="text-xl font-semibold mb-2">{t.startSearch}</h3>
            <p className="text-muted-foreground mb-4">{t.startSearchDesc}</p>
            <div className="flex justify-center gap-2">
              {keywordPresets.slice(0, 3).map(p => (
                <Badge key={p.id} variant="outline">{p.label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">{t.searching}</h3>
            <p className="text-muted-foreground">
              {location}, {country} {t.searchingIn}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadFinder;
