import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, MapPin, ExternalLink, Globe, Clock, 
  Search, Filter, Star, Building2, Users, Utensils,
  ChevronRight, CalendarDays, Plane
} from 'lucide-react';

// Food Fair data - major international food exhibitions
const foodFairs = [
  {
    id: 1,
    name: 'ANUGA',
    city: 'Cologne',
    country: 'Germany',
    countryCode: 'DE',
    date: '2025-10-04',
    endDate: '2025-10-08',
    website: 'https://www.anuga.com',
    description: 'The world\'s largest and most important trade fair for the food industry',
    descriptionTr: 'Gıda sektörü için dünyanın en büyük ve en önemli ticaret fuarı',
    descriptionDe: 'Die weltweit größte und wichtigste Fachmesse für die Lebensmittelindustrie',
    category: 'General Food',
    visitors: '170,000+',
    exhibitors: '7,500+',
    frequency: 'Every 2 years',
    featured: true,
  },
  {
    id: 2,
    name: 'Gulfood',
    city: 'Dubai',
    country: 'UAE',
    countryCode: 'AE',
    date: '2025-02-17',
    endDate: '2025-02-21',
    website: 'https://www.gulfood.com',
    description: 'The world\'s largest annual food & beverage trade show',
    descriptionTr: 'Dünyanın en büyük yıllık gıda ve içecek ticaret fuarı',
    descriptionDe: 'Die weltweit größte jährliche Lebensmittel- und Getränkemesse',
    category: 'Food & Beverage',
    visitors: '100,000+',
    exhibitors: '5,000+',
    frequency: 'Annual',
    featured: true,
  },
  {
    id: 3,
    name: 'FOOD EXPO Greece',
    city: 'Athens',
    country: 'Greece',
    countryCode: 'GR',
    date: '2025-03-15',
    endDate: '2025-03-17',
    website: 'https://www.foodexpo.gr',
    description: 'The leading F&B exhibition in Southeastern Europe',
    descriptionTr: 'Güneydoğu Avrupa\'nın lider gıda ve içecek fuarı',
    descriptionDe: 'Die führende F&B-Messe in Südosteuropa',
    category: 'Food & Beverage',
    visitors: '35,000+',
    exhibitors: '1,200+',
    frequency: 'Annual',
    featured: true,
  },
  {
    id: 4,
    name: 'SIAL Paris',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    date: '2024-10-19',
    endDate: '2024-10-23',
    website: 'https://www.sialparis.com',
    description: 'The largest food innovation exhibition in the world',
    descriptionTr: 'Dünyanın en büyük gıda inovasyon fuarı',
    descriptionDe: 'Die weltweit größte Messe für Lebensmittelinnovation',
    category: 'Food Innovation',
    visitors: '310,000+',
    exhibitors: '7,500+',
    frequency: 'Every 2 years',
    featured: true,
  },
  {
    id: 5,
    name: 'ISM Cologne',
    city: 'Cologne',
    country: 'Germany',
    countryCode: 'DE',
    date: '2025-02-02',
    endDate: '2025-02-05',
    website: 'https://www.ism-cologne.com',
    description: 'World\'s leading trade fair for sweets and snacks',
    descriptionTr: 'Şekerleme ve atıştırmalıklar için dünyanın lider ticaret fuarı',
    descriptionDe: 'Weltleitmesse für Süßwaren und Snacks',
    category: 'Confectionery & Snacks',
    visitors: '38,000+',
    exhibitors: '1,700+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 6,
    name: 'Biofach',
    city: 'Nuremberg',
    country: 'Germany',
    countryCode: 'DE',
    date: '2025-02-11',
    endDate: '2025-02-14',
    website: 'https://www.biofach.de',
    description: 'World\'s leading trade fair for organic food',
    descriptionTr: 'Organik gıda için dünyanın lider ticaret fuarı',
    descriptionDe: 'Weltleitmesse für Bio-Lebensmittel',
    category: 'Organic Food',
    visitors: '47,000+',
    exhibitors: '2,800+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 7,
    name: 'Alimentaria',
    city: 'Barcelona',
    country: 'Spain',
    countryCode: 'ES',
    date: '2026-03-30',
    endDate: '2026-04-02',
    website: 'https://www.alimentaria.com',
    description: 'International Food, Drinks and Food Service Exhibition',
    descriptionTr: 'Uluslararası Gıda, İçecek ve Yemek Servisi Fuarı',
    descriptionDe: 'Internationale Messe für Lebensmittel, Getränke und Foodservice',
    category: 'Food & Beverage',
    visitors: '140,000+',
    exhibitors: '4,000+',
    frequency: 'Every 2 years',
    featured: false,
  },
  {
    id: 8,
    name: 'CIBUS',
    city: 'Parma',
    country: 'Italy',
    countryCode: 'IT',
    date: '2025-05-06',
    endDate: '2025-05-09',
    website: 'https://www.cibus.it',
    description: 'Italy\'s premier food fair showcasing authentic Italian products',
    descriptionTr: 'İtalya\'nın otantik ürünlerini sergileyen premier gıda fuarı',
    descriptionDe: 'Italiens führende Lebensmittelmesse für authentische italienische Produkte',
    category: 'Italian Food',
    visitors: '82,000+',
    exhibitors: '3,000+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 9,
    name: 'FHC China',
    city: 'Shanghai',
    country: 'China',
    countryCode: 'CN',
    date: '2025-11-11',
    endDate: '2025-11-13',
    website: 'https://www.fhcchina.com',
    description: 'Food & Hotel China - Asia\'s largest F&B trade show',
    descriptionTr: 'Food & Hotel China - Asya\'nın en büyük gıda ve içecek fuarı',
    descriptionDe: 'Food & Hotel China - Asiens größte F&B-Messe',
    category: 'Food & Hotel',
    visitors: '100,000+',
    exhibitors: '3,500+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 10,
    name: 'PLMA Amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    date: '2025-05-20',
    endDate: '2025-05-21',
    website: 'https://www.plmainternational.com',
    description: 'World\'s largest private label trade show',
    descriptionTr: 'Dünyanın en büyük özel marka ticaret fuarı',
    descriptionDe: 'Die weltweit größte Handelsmarken-Messe',
    category: 'Private Label',
    visitors: '15,000+',
    exhibitors: '2,700+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 11,
    name: 'IFE London',
    city: 'London',
    country: 'UK',
    countryCode: 'GB',
    date: '2025-03-17',
    endDate: '2025-03-19',
    website: 'https://www.ife.co.uk',
    description: 'UK\'s leading food and drink event',
    descriptionTr: 'Birleşik Krallık\'ın lider gıda ve içecek etkinliği',
    descriptionDe: 'Großbritanniens führende Lebensmittel- und Getränkeveranstaltung',
    category: 'Food & Drink',
    visitors: '27,000+',
    exhibitors: '1,300+',
    frequency: 'Every 2 years',
    featured: false,
  },
  {
    id: 12,
    name: 'Fi Europe',
    city: 'Frankfurt',
    country: 'Germany',
    countryCode: 'DE',
    date: '2025-12-01',
    endDate: '2025-12-03',
    website: 'https://www.figlobal.com',
    description: 'Food Ingredients Europe - the premier ingredients event',
    descriptionTr: 'Food Ingredients Europe - premier gıda katkı maddeleri etkinliği',
    descriptionDe: 'Food Ingredients Europe - die führende Zutatenmesse',
    category: 'Food Ingredients',
    visitors: '25,000+',
    exhibitors: '1,600+',
    frequency: 'Annual',
    featured: true,
  },
  {
    id: 13,
    name: 'WorldFood Moscow',
    city: 'Moscow',
    country: 'Russia',
    countryCode: 'RU',
    date: '2025-09-16',
    endDate: '2025-09-19',
    website: 'https://www.world-food.ru',
    description: 'Russia\'s largest international food exhibition',
    descriptionTr: 'Rusya\'nın en büyük uluslararası gıda fuarı',
    descriptionDe: 'Russlands größte internationale Lebensmittelmesse',
    category: 'Food & Beverage',
    visitors: '30,000+',
    exhibitors: '1,500+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 14,
    name: 'FOODEX Japan',
    city: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    date: '2025-03-11',
    endDate: '2025-03-14',
    website: 'https://www.jma.or.jp/foodex',
    description: 'Asia\'s largest food and beverage trade show',
    descriptionTr: 'Asya\'nın en büyük gıda ve içecek ticaret fuarı',
    descriptionDe: 'Asiens größte Lebensmittel- und Getränkemesse',
    category: 'Food & Beverage',
    visitors: '85,000+',
    exhibitors: '3,300+',
    frequency: 'Annual',
    featured: true,
  },
  {
    id: 15,
    name: 'Fancy Food Show',
    city: 'New York',
    country: 'USA',
    countryCode: 'US',
    date: '2025-06-29',
    endDate: '2025-07-01',
    website: 'https://www.specialtyfood.com',
    description: 'North America\'s largest specialty food & beverage event',
    descriptionTr: 'Kuzey Amerika\'nın en büyük özel gıda ve içecek etkinliği',
    descriptionDe: 'Nordamerikas größte Spezialitäten-Messe',
    category: 'Specialty Food',
    visitors: '47,000+',
    exhibitors: '2,600+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 16,
    name: 'Tavola',
    city: 'Kortrijk',
    country: 'Belgium',
    countryCode: 'BE',
    date: '2025-03-09',
    endDate: '2025-03-11',
    website: 'https://www.tavola-xpo.be',
    description: 'Belgian food & beverage trade fair',
    descriptionTr: 'Belçika gıda ve içecek ticaret fuarı',
    descriptionDe: 'Belgische Lebensmittel- und Getränkemesse',
    category: 'Food & Beverage',
    visitors: '12,000+',
    exhibitors: '550+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 17,
    name: 'InterFood Bulgaria',
    city: 'Sofia',
    country: 'Bulgaria',
    countryCode: 'BG',
    date: '2025-11-12',
    endDate: '2025-11-15',
    website: 'https://www.bulgarreklama.com',
    description: 'Bulgaria\'s leading food industry exhibition',
    descriptionTr: 'Bulgaristan\'ın lider gıda endüstrisi fuarı',
    descriptionDe: 'Bulgariens führende Lebensmittelindustrie-Messe',
    category: 'Food Industry',
    visitors: '15,000+',
    exhibitors: '300+',
    frequency: 'Annual',
    featured: false,
  },
  {
    id: 18,
    name: 'Polagra Food',
    city: 'Poznań',
    country: 'Poland',
    countryCode: 'PL',
    date: '2025-09-29',
    endDate: '2025-10-02',
    website: 'https://www.polagra-food.pl',
    description: 'Central Europe\'s largest food fair',
    descriptionTr: 'Orta Avrupa\'nın en büyük gıda fuarı',
    descriptionDe: 'Mitteleuropas größte Lebensmittelmesse',
    category: 'Food & Beverage',
    visitors: '60,000+',
    exhibitors: '1,000+',
    frequency: 'Annual',
    featured: false,
  },
];

const texts = {
  en: {
    title: 'Food Fairs & Exhibitions',
    subtitle: 'Discover upcoming international food industry events',
    search: 'Search fairs...',
    all: 'All',
    upcoming: 'Upcoming',
    featured: 'Featured',
    visitWebsite: 'Visit Website',
    visitors: 'Visitors',
    exhibitors: 'Exhibitors',
    frequency: 'Frequency',
    daysUntil: 'days until',
    ongoing: 'Ongoing Now',
    passed: 'Event Passed',
    noResults: 'No fairs found matching your search',
    filterByCountry: 'Filter by Country',
    clearFilters: 'Clear Filters',
    planTrip: 'Plan Trip',
  },
  tr: {
    title: 'Gıda Fuarları ve Sergiler',
    subtitle: 'Yaklaşan uluslararası gıda sektörü etkinliklerini keşfedin',
    search: 'Fuar ara...',
    all: 'Tümü',
    upcoming: 'Yaklaşan',
    featured: 'Öne Çıkan',
    visitWebsite: 'Web Sitesi',
    visitors: 'Ziyaretçi',
    exhibitors: 'Katılımcı',
    frequency: 'Sıklık',
    daysUntil: 'gün kaldı',
    ongoing: 'Devam Ediyor',
    passed: 'Geçmiş Etkinlik',
    noResults: 'Aramanıza uygun fuar bulunamadı',
    filterByCountry: 'Ülkeye Göre Filtrele',
    clearFilters: 'Filtreleri Temizle',
    planTrip: 'Seyahat Planla',
  },
  de: {
    title: 'Lebensmittelmessen & Ausstellungen',
    subtitle: 'Entdecken Sie kommende internationale Lebensmittelveranstaltungen',
    search: 'Messen suchen...',
    all: 'Alle',
    upcoming: 'Kommende',
    featured: 'Empfohlen',
    visitWebsite: 'Website',
    visitors: 'Besucher',
    exhibitors: 'Aussteller',
    frequency: 'Häufigkeit',
    daysUntil: 'Tage bis',
    ongoing: 'Läuft gerade',
    passed: 'Vergangen',
    noResults: 'Keine Messen gefunden',
    filterByCountry: 'Nach Land filtern',
    clearFilters: 'Filter löschen',
    planTrip: 'Reise planen',
  },
  pl: {
    title: 'Targi Spożywcze',
    subtitle: 'Odkryj nadchodzące międzynarodowe wydarzenia branży spożywczej',
    search: 'Szukaj targów...',
    all: 'Wszystkie',
    upcoming: 'Nadchodzące',
    featured: 'Polecane',
    visitWebsite: 'Strona WWW',
    visitors: 'Odwiedzający',
    exhibitors: 'Wystawcy',
    frequency: 'Częstotliwość',
    daysUntil: 'dni do',
    ongoing: 'Trwa teraz',
    passed: 'Minęło',
    noResults: 'Nie znaleziono targów',
    filterByCountry: 'Filtruj wg kraju',
    clearFilters: 'Wyczyść filtry',
    planTrip: 'Zaplanuj podróż',
  },
};

const countryFlags = {
  DE: '🇩🇪',
  AE: '🇦🇪',
  GR: '🇬🇷',
  FR: '🇫🇷',
  ES: '🇪🇸',
  IT: '🇮🇹',
  CN: '🇨🇳',
  NL: '🇳🇱',
  GB: '🇬🇧',
  RU: '🇷🇺',
  JP: '🇯🇵',
  US: '🇺🇸',
  BE: '🇧🇪',
  BG: '🇧🇬',
  PL: '🇵🇱',
};

const FoodFairs = () => {
  const { language } = useLanguage();
  const t = (key) => texts[language]?.[key] || texts.en[key] || key;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('');

  const getDescription = (fair) => {
    if (language === 'tr' && fair.descriptionTr) return fair.descriptionTr;
    if (language === 'de' && fair.descriptionDe) return fair.descriptionDe;
    return fair.description;
  };

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOngoing = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return today >= start && today <= end;
  };

  const uniqueCountries = [...new Set(foodFairs.map(f => f.country))].sort();

  const filteredFairs = useMemo(() => {
    return foodFairs
      .filter(fair => {
        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          if (!fair.name.toLowerCase().includes(search) && 
              !fair.city.toLowerCase().includes(search) && 
              !fair.country.toLowerCase().includes(search) &&
              !fair.category.toLowerCase().includes(search)) {
            return false;
          }
        }
        
        // Country filter
        if (selectedCountry && fair.country !== selectedCountry) {
          return false;
        }
        
        // Tab filter
        if (filter === 'featured' && !fair.featured) return false;
        if (filter === 'upcoming') {
          const days = getDaysUntil(fair.date);
          if (days < 0 && !isOngoing(fair.date, fair.endDate)) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const daysA = getDaysUntil(a.date);
        const daysB = getDaysUntil(b.date);
        // Sort by upcoming first (positive days), then by how soon
        if (daysA >= 0 && daysB >= 0) return daysA - daysB;
        if (daysA >= 0) return -1;
        if (daysB >= 0) return 1;
        return daysB - daysA;
      });
  }, [searchTerm, filter, selectedCountry]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const locale = language === 'de' ? 'de-DE' : language === 'tr' ? 'tr-TR' : language === 'pl' ? 'pl-PL' : 'en-US';
    return date.toLocaleDateString(locale, options);
  };

  return (
    <div className="space-y-6" data-testid="food-fairs-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            {t('title')}
          </h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="food-fairs-search"
              />
            </div>

            {/* Tab Filters */}
            <div className="flex gap-2">
              {['all', 'upcoming', 'featured'].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  data-testid={`filter-${f}`}
                >
                  {f === 'featured' && <Star className="w-3 h-3 mr-1" />}
                  {t(f)}
                </Button>
              ))}
            </div>

            {/* Country Filter */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              data-testid="country-filter"
            >
              <option value="">{t('filterByCountry')}</option>
              {uniqueCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>

            {(selectedCountry || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedCountry(''); setSearchTerm(''); }}
              >
                {t('clearFilters')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-slate-500">
        {filteredFairs.length} {language === 'tr' ? 'fuar bulundu' : language === 'de' ? 'Messen gefunden' : 'fairs found'}
      </p>

      {/* Fairs Grid */}
      {filteredFairs.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">{t('noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFairs.map((fair) => {
            const daysUntil = getDaysUntil(fair.date);
            const ongoing = isOngoing(fair.date, fair.endDate);
            const passed = daysUntil < 0 && !ongoing;

            return (
              <Card 
                key={fair.id} 
                className={`border-slate-200 hover:shadow-lg transition-all overflow-hidden group ${fair.featured ? 'ring-2 ring-orange-500/50' : ''} ${passed ? 'opacity-60' : ''}`}
                data-testid={`fair-card-${fair.id}`}
              >
                {/* Header Banner */}
                <div className={`h-2 ${ongoing ? 'bg-green-500' : passed ? 'bg-slate-400' : 'bg-gradient-to-r from-orange-500 to-red-600'}`} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                        {fair.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                        <span className="text-lg">{countryFlags[fair.countryCode]}</span>
                        <MapPin className="w-3 h-3" />
                        <span>{fair.city}, {fair.country}</span>
                      </div>
                    </div>
                    {fair.featured && (
                      <Badge className="bg-orange-100 text-orange-700 border-0">
                        <Star className="w-3 h-3 mr-1" />
                        {t('featured')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Date & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">{formatDate(fair.date)} - {formatDate(fair.endDate)}</span>
                    </div>
                    {ongoing ? (
                      <Badge className="bg-green-100 text-green-700 border-0 animate-pulse">
                        {t('ongoing')}
                      </Badge>
                    ) : passed ? (
                      <Badge variant="secondary">{t('passed')}</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-0">
                        {daysUntil} {t('daysUntil')}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {getDescription(fair)}
                  </p>

                  {/* Category */}
                  <Badge variant="outline" className="bg-slate-50">
                    {fair.category}
                  </Badge>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Users className="w-3 h-3" />
                      <span><strong>{fair.visitors}</strong> {t('visitors')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 className="w-3 h-3" />
                      <span><strong>{fair.exhibitors}</strong> {t('exhibitors')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(fair.website, '_blank')}
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      {t('visitWebsite')}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                    {!passed && (
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => window.open(`https://www.google.com/travel/flights?q=flights+to+${fair.city}`, '_blank')}
                      >
                        <Plane className="w-3 h-3 mr-1" />
                        {t('planTrip')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FoodFairs;
