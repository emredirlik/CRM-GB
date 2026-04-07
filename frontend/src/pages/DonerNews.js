import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Utensils, ExternalLink, RefreshCw, Globe, Clock, 
  TrendingUp, Newspaper, ChefHat, Flame, Star
} from 'lucide-react';

// Fun döner/kebab news and facts
const donerNews = [
  {
    id: 1,
    title: 'Berlin ist die Döner-Hauptstadt der Welt',
    titleTr: 'Berlin Dünyanın Döner Başkenti',
    titleEn: 'Berlin is the Döner Capital of the World',
    titlePl: 'Berlin jest światową stolicą dönera',
    description: 'Mit über 1.500 Döner-Läden hat Berlin die höchste Dichte an Döner-Restaurants weltweit.',
    descriptionTr: '1.500\'den fazla döner dükkanı ile Berlin dünya genelinde en yüksek döner restoran yoğunluğuna sahip.',
    descriptionEn: 'With over 1,500 döner shops, Berlin has the highest density of döner restaurants worldwide.',
    descriptionPl: 'Z ponad 1500 sklepami z dönerem Berlin ma najwyższą gęstość restauracji döner na świecie.',
    category: 'stats',
    icon: '🇩🇪',
    date: '2026-04-01'
  },
  {
    id: 2,
    title: 'Der größte Döner der Welt wiegt 423 kg',
    titleTr: 'Dünyanın En Büyük Döneri 423 kg',
    titleEn: 'The World\'s Largest Döner Weighs 423 kg',
    titlePl: 'Największy döner na świecie waży 423 kg',
    description: 'Der Guinness-Weltrekord wurde 2017 in Griechenland aufgestellt.',
    descriptionTr: 'Guinness Dünya Rekoru 2017\'de Yunanistan\'da kırıldı.',
    descriptionEn: 'The Guinness World Record was set in Greece in 2017.',
    descriptionPl: 'Rekord Guinnessa został ustanowiony w Grecji w 2017 roku.',
    category: 'record',
    icon: '🏆',
    date: '2026-03-28'
  },
  {
    id: 3,
    title: 'Gyros vs Döner: Der ewige Streit',
    titleTr: 'Gyros vs Döner: Sonsuz Tartışma',
    titleEn: 'Gyros vs Döner: The Eternal Debate',
    titlePl: 'Gyros vs Döner: Wieczna debata',
    description: 'Gyros wird mit Schweinefleisch zubereitet, während Döner traditionell Lamm oder Rind verwendet.',
    descriptionTr: 'Gyros domuz etiyle yapılırken, döner geleneksel olarak kuzu veya dana eti kullanır.',
    descriptionEn: 'Gyros is made with pork, while döner traditionally uses lamb or beef.',
    descriptionPl: 'Gyros jest robiony z wieprzowiny, podczas gdy döner tradycyjnie używa jagnięciny lub wołowiny.',
    category: 'culture',
    icon: '🇬🇷',
    date: '2026-03-25'
  },
  {
    id: 4,
    title: 'Döner-Industrie: 7,5 Milliarden € Umsatz',
    titleTr: 'Döner Endüstrisi: 7,5 Milyar € Ciro',
    titleEn: 'Döner Industry: €7.5 Billion Revenue',
    titlePl: 'Przemysł döner: 7,5 mld € przychodu',
    description: 'Die deutsche Döner-Industrie beschäftigt über 60.000 Menschen.',
    descriptionTr: 'Alman döner endüstrisi 60.000\'den fazla kişiyi istihdam ediyor.',
    descriptionEn: 'The German döner industry employs over 60,000 people.',
    descriptionPl: 'Niemiecki przemysł döner zatrudnia ponad 60 000 osób.',
    category: 'business',
    icon: '💰',
    date: '2026-03-20'
  },
  {
    id: 5,
    title: 'Kadir Nurman: Der Erfinder des Döner',
    titleTr: 'Kadir Nurman: Dönerin Mucidi',
    titleEn: 'Kadir Nurman: The Inventor of Döner',
    titlePl: 'Kadir Nurman: Wynalazca dönera',
    description: 'Der türkischstämmige Berliner erfand 1972 den ersten Döner Kebab im Brot.',
    descriptionTr: 'Berlin\'deki Türk asıllı girişimci 1972\'de ekmek arası ilk döner kebabı icat etti.',
    descriptionEn: 'The Turkish-origin Berliner invented the first döner kebab in bread in 1972.',
    descriptionPl: 'Berlińczyk tureckiego pochodzenia wynalazł pierwszego dönera w chlebie w 1972 roku.',
    category: 'history',
    icon: '👨‍🍳',
    date: '2026-03-15'
  },
  {
    id: 6,
    title: 'Iskender Kebab: Das königliche Gericht',
    titleTr: 'İskender Kebap: Kraliyet Yemeği',
    titleEn: 'Iskender Kebab: The Royal Dish',
    titlePl: 'Iskender Kebab: Królewskie danie',
    description: 'Der Iskender Kebab wurde im 19. Jahrhundert in Bursa erfunden und ist nach seinem Erfinder benannt.',
    descriptionTr: 'İskender Kebap 19. yüzyılda Bursa\'da icat edildi ve mucidinin adını taşıyor.',
    descriptionEn: 'Iskender Kebab was invented in Bursa in the 19th century and named after its creator.',
    descriptionPl: 'Iskender Kebab został wynaleziony w Bursie w XIX wieku i nosi imię swojego twórcy.',
    category: 'history',
    icon: '🍖',
    date: '2026-03-10'
  },
  {
    id: 7,
    title: 'Döner ist das beliebteste Fast Food',
    titleTr: 'Döner En Popüler Fast Food',
    titleEn: 'Döner is the Most Popular Fast Food',
    titlePl: 'Döner to najpopularniejszy fast food',
    description: 'In Deutschland werden täglich über 700.000 Döner verkauft, mehr als Burger und Pizza zusammen!',
    descriptionTr: 'Almanya\'da günde 700.000\'den fazla döner satılıyor, hamburger ve pizzadan daha fazla!',
    descriptionEn: 'Over 700,000 döners are sold daily in Germany, more than burgers and pizza combined!',
    descriptionPl: 'W Niemczech codziennie sprzedaje się ponad 700 000 dönerów, więcej niż burgerów i pizzy razem!',
    category: 'stats',
    icon: '📊',
    date: '2026-03-05'
  },
  {
    id: 8,
    title: 'Der teuerste Döner der Welt',
    titleTr: 'Dünyanın En Pahalı Döneri',
    titleEn: 'The World\'s Most Expensive Döner',
    titlePl: 'Najdroższy döner na świecie',
    description: 'Ein Luxus-Restaurant in Dubai bietet einen mit Blattgold verzierten Döner für 1.500€ an.',
    descriptionTr: 'Dubai\'deki lüks bir restoran altın yapraklarla süslenmiş döner 1.500€\'ya satıyor.',
    descriptionEn: 'A luxury restaurant in Dubai offers a döner decorated with gold leaf for €1,500.',
    descriptionPl: 'Luksusowa restauracja w Dubaju oferuje dönera ozdobionego płatkami złota za 1500 €.',
    category: 'luxury',
    icon: '✨',
    date: '2026-03-01'
  },
  {
    id: 9,
    title: 'Shawarma, Gyros, Döner: Die Unterschiede',
    titleTr: 'Shawarma, Gyros, Döner: Farklar',
    titleEn: 'Shawarma, Gyros, Döner: The Differences',
    titlePl: 'Shawarma, Gyros, Döner: Różnice',
    description: 'Alle drei sind Drehspießgerichte, aber mit verschiedenen Gewürzen und Beilagen aus verschiedenen Kulturen.',
    descriptionTr: 'Üçü de döner şiş yemekleri, ancak farklı kültürlerden farklı baharatlar ve garnitürlerle.',
    descriptionEn: 'All three are rotisserie dishes, but with different spices and accompaniments from different cultures.',
    descriptionPl: 'Wszystkie trzy to dania z rożna, ale z różnymi przyprawami i dodatkami z różnych kultur.',
    category: 'culture',
    icon: '🌍',
    date: '2026-02-25'
  },
  {
    id: 10,
    title: 'Adana Kebab: Die scharfe Variante',
    titleTr: 'Adana Kebap: Acılı Versiyon',
    titleEn: 'Adana Kebab: The Spicy Version',
    titlePl: 'Adana Kebab: Ostra wersja',
    description: 'Der Adana Kebab aus der Türkei ist bekannt für seine würzige Schärfe und wird am Spieß gegrillt.',
    descriptionTr: 'Türkiye\'den Adana Kebap baharatlı acılığı ile ünlü ve şişte pişirilir.',
    descriptionEn: 'Adana Kebab from Turkey is known for its spicy heat and is grilled on a skewer.',
    descriptionPl: 'Adana Kebab z Turcji słynie z pikantnej ostrości i jest grillowany na szpikulcu.',
    category: 'food',
    icon: '🌶️',
    date: '2026-02-20'
  }
];

const categoryColors = {
  stats: 'bg-blue-100 text-blue-700',
  record: 'bg-yellow-100 text-yellow-700',
  culture: 'bg-purple-100 text-purple-700',
  business: 'bg-green-100 text-green-700',
  history: 'bg-orange-100 text-orange-700',
  food: 'bg-red-100 text-red-700',
  luxury: 'bg-pink-100 text-pink-700'
};

const categoryLabels = {
  tr: { stats: 'İstatistik', record: 'Rekor', culture: 'Kültür', business: 'İş', history: 'Tarih', food: 'Yemek', luxury: 'Lüks' },
  de: { stats: 'Statistik', record: 'Rekord', culture: 'Kultur', business: 'Business', history: 'Geschichte', food: 'Essen', luxury: 'Luxus' },
  en: { stats: 'Stats', record: 'Record', culture: 'Culture', business: 'Business', history: 'History', food: 'Food', luxury: 'Luxury' },
  pl: { stats: 'Statystyki', record: 'Rekord', culture: 'Kultura', business: 'Biznes', history: 'Historia', food: 'Jedzenie', luxury: 'Luksus' }
};

const texts = {
  tr: {
    title: 'Döner & Kebab Haberleri',
    subtitle: 'Döner dünyasından eğlenceli haberler ve ilginç bilgiler',
    refresh: 'Yenile',
    readMore: 'Devamını Oku',
    funFact: 'Eğlenceli Bilgi',
    didYouKnow: 'Biliyor muydunuz?',
    dailyDoner: 'Günlük Döner Satışı',
    inGermany: 'Almanya\'da',
  },
  de: {
    title: 'Döner & Kebab Nachrichten',
    subtitle: 'Lustige Nachrichten und interessante Fakten aus der Döner-Welt',
    refresh: 'Aktualisieren',
    readMore: 'Mehr lesen',
    funFact: 'Fun Fact',
    didYouKnow: 'Wussten Sie schon?',
    dailyDoner: 'Täglicher Döner-Verkauf',
    inGermany: 'In Deutschland',
  },
  en: {
    title: 'Döner & Kebab News',
    subtitle: 'Fun news and interesting facts from the döner world',
    refresh: 'Refresh',
    readMore: 'Read More',
    funFact: 'Fun Fact',
    didYouKnow: 'Did you know?',
    dailyDoner: 'Daily Döner Sales',
    inGermany: 'In Germany',
  },
  pl: {
    title: 'Wiadomości o Döner & Kebab',
    subtitle: 'Zabawne wiadomości i ciekawe fakty ze świata dönera',
    refresh: 'Odśwież',
    readMore: 'Czytaj więcej',
    funFact: 'Ciekawostka',
    didYouKnow: 'Czy wiesz, że?',
    dailyDoner: 'Dzienna sprzedaż dönerów',
    inGermany: 'W Niemczech',
  }
};

const DonerNews = () => {
  const { language } = useLanguage();
  const t = (key) => texts[language]?.[key] || texts.de[key] || key;
  const [randomFact, setRandomFact] = useState(null);

  useEffect(() => {
    // Set a random fun fact on load
    const randomIndex = Math.floor(Math.random() * donerNews.length);
    setRandomFact(donerNews[randomIndex]);
  }, []);

  const getTitle = (item) => {
    if (language === 'tr') return item.titleTr;
    if (language === 'en') return item.titleEn;
    if (language === 'pl') return item.titlePl;
    return item.title;
  };

  const getDescription = (item) => {
    if (language === 'tr') return item.descriptionTr;
    if (language === 'en') return item.descriptionEn;
    if (language === 'pl') return item.descriptionPl;
    return item.description;
  };

  const shuffleFact = () => {
    const randomIndex = Math.floor(Math.random() * donerNews.length);
    setRandomFact(donerNews[randomIndex]);
  };

  return (
    <div className="space-y-6" data-testid="doner-news-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-2xl">
              🥙
            </div>
            {t('title')}
          </h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
        <Button variant="outline" onClick={shuffleFact} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {t('refresh')}
        </Button>
      </div>

      {/* Fun Fact Card */}
      {randomFact && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{randomFact.icon}</div>
              <div className="flex-1">
                <Badge className="bg-amber-500 text-white mb-2">
                  <Star className="w-3 h-3 mr-1" />
                  {t('funFact')}
                </Badge>
                <h2 className="text-xl font-bold text-amber-900 mb-2">{getTitle(randomFact)}</h2>
                <p className="text-amber-800">{getDescription(randomFact)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">700K+</p>
            <p className="text-xs opacity-80">{t('dailyDoner')}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">1,500+</p>
            <p className="text-xs opacity-80">Döner Shops (Berlin)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">€7.5B</p>
            <p className="text-xs opacity-80">{t('inGermany')}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4 text-center">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-3xl font-bold">60K+</p>
            <p className="text-xs opacity-80">Jobs</p>
          </CardContent>
        </Card>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {donerNews.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow overflow-hidden group" data-testid={`news-${item.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <Badge className={`${categoryColors[item.category]} border-0 text-xs mb-2`}>
                    {categoryLabels[language]?.[item.category] || item.category}
                  </Badge>
                  <CardTitle className="text-base group-hover:text-amber-600 transition-colors">
                    {getTitle(item)}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 line-clamp-3 mb-3">
                {getDescription(item)}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(item.date).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'tr' ? 'tr-TR' : language === 'pl' ? 'pl-PL' : 'en-US')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DonerNews;
