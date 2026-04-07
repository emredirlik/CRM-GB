import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Utensils, ExternalLink, RefreshCw, Globe, Clock, 
  TrendingUp, Newspaper, ChefHat, Flame, Star, X, ArrowRight
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

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
    fullContent: 'Berlin hat sich seit den 1970er Jahren zur unbestrittenen Döner-Hauptstadt der Welt entwickelt. Mit über 1.500 Döner-Läden bietet die Stadt nicht nur die höchste Dichte an Döner-Restaurants, sondern auch die größte Vielfalt an Zubereitungsarten. Von traditionellen Drehspieß-Varianten bis hin zu veganen Alternativen - Berlin hat alles zu bieten.',
    fullContentTr: 'Berlin, 1970\'lerden bu yana tartışmasız dünyanın döner başkenti haline geldi. 1.500\'den fazla döner dükkanı ile şehir, yalnızca en yüksek döner restoran yoğunluğunu değil, aynı zamanda en büyük hazırlama çeşitliliğini de sunuyor. Geleneksel döner çeşitlerinden vegan alternatiflere kadar Berlin\'de her şey var.',
    fullContentEn: 'Berlin has developed into the undisputed döner capital of the world since the 1970s. With over 1,500 döner shops, the city offers not only the highest density of döner restaurants, but also the greatest variety of preparation methods. From traditional rotisserie varieties to vegan alternatives - Berlin has it all.',
    fullContentPl: 'Berlin od lat 70. stał się niekwestionowaną światową stolicą dönera. Z ponad 1500 sklepami z dönerem miasto oferuje nie tylko najwyższą gęstość restauracji döner, ale także największą różnorodność metod przygotowania.',
    link: 'https://www.berlin.de/tourismus/infos/3988982-2562311-doenerkebab.html',
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
    fullContent: 'Im Jahr 2017 wurde in Athen, Griechenland, der größte Döner-Spieß der Welt aufgestellt. Mit einem Gewicht von 423 kg und einer Höhe von über 2 Metern brach er den Guinness-Weltrekord. An der Zubereitung waren über 50 Köche beteiligt.',
    fullContentTr: '2017 yılında Atina, Yunanistan\'da dünyanın en büyük döner şişi hazırlandı. 423 kg ağırlığında ve 2 metreden fazla yüksekliğe sahip bu döner, Guinness Dünya Rekoru\'nu kırdı. Hazırlanmasında 50\'den fazla aşçı görev aldı.',
    fullContentEn: 'In 2017, the world\'s largest döner spit was set up in Athens, Greece. Weighing 423 kg and standing over 2 meters tall, it broke the Guinness World Record. Over 50 chefs were involved in its preparation.',
    fullContentPl: 'W 2017 roku w Atenach, Grecji, przygotowano największy szpikulec döner na świecie. Ważący 423 kg i mierzący ponad 2 metry, pobił rekord Guinnessa.',
    link: 'https://www.guinnessworldrecords.com/world-records/largest-doner-kebab',
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
    fullContent: 'Obwohl Gyros und Döner ähnlich aussehen, gibt es wichtige Unterschiede. Gyros stammt aus Griechenland und wird traditionell mit Schweinefleisch zubereitet, gewürzt mit Oregano und Thymian. Döner hingegen kommt aus der Türkei und verwendet Lamm-, Rind- oder Hühnerfleisch mit Kreuzkümmel und Sumach.',
    fullContentTr: 'Gyros ve döner benzer görünseler de önemli farklılıklar var. Gyros Yunanistan kökenlidir ve geleneksel olarak domuz etiyle, kekik ve mercanköşk ile hazırlanır. Döner ise Türkiye\'den gelir ve kuzu, dana veya tavuk eti kullanılarak kimyon ve sumak ile yapılır.',
    fullContentEn: 'Although gyros and döner look similar, there are important differences. Gyros originates from Greece and is traditionally prepared with pork, seasoned with oregano and thyme. Döner, on the other hand, comes from Turkey and uses lamb, beef, or chicken with cumin and sumac.',
    fullContentPl: 'Chociaż gyros i döner wyglądają podobnie, istnieją ważne różnice. Gyros pochodzi z Grecji i jest tradycyjnie przygotowywany z wieprzowiny, przyprawiony oregano i tymiankiem. Döner pochodzi z Turcji i używa jagnięciny, wołowiny lub kurczaka z kminkiem i sumachem.',
    link: 'https://www.tasteatlas.com/gyros',
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
    fullContent: 'Die Döner-Industrie in Deutschland ist ein wirtschaftlicher Gigant. Mit einem jährlichen Umsatz von 7,5 Milliarden Euro und über 60.000 Beschäftigten ist sie größer als viele andere Gastronomie-Segmente. Pro Tag werden etwa 700.000 Döner verkauft.',
    fullContentTr: 'Almanya\'daki döner endüstrisi ekonomik bir devdir. Yıllık 7,5 milyar Euro ciro ve 60.000\'den fazla çalışanı ile birçok gastronomi sektöründen daha büyüktür. Günde yaklaşık 700.000 döner satılmaktadır.',
    fullContentEn: 'The döner industry in Germany is an economic giant. With annual revenue of €7.5 billion and over 60,000 employees, it is larger than many other gastronomy segments. About 700,000 döners are sold per day.',
    fullContentPl: 'Przemysł döner w Niemczech to ekonomiczny gigant. Z rocznymi przychodami 7,5 mld euro i ponad 60 000 pracownikami jest większy niż wiele innych segmentów gastronomii.',
    link: 'https://www.handelsblatt.com/unternehmen/handel-konsumgueter/doener-kebab',
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
    fullContent: 'Kadir Nurman (1933-2013) war ein türkischstämmiger Gastronom in Berlin. Er gilt als Erfinder des modernen Döner Kebab im Fladenbrot, den er 1972 an seinem Stand am Bahnhof Zoo erstmals verkaufte. Seine Idee, das Fleisch in Brot zu servieren, revolutionierte die Fast-Food-Kultur.',
    fullContentTr: 'Kadir Nurman (1933-2013), Berlin\'de yaşayan Türk asıllı bir gastronomcuydu. 1972\'de Bahnhof Zoo\'daki tezgahında ilk kez sattığı pide ekmeği içindeki modern döner kebabın mucidi olarak kabul edilir. Eti ekmek içinde servis etme fikri, fast-food kültürünü devrim niteliğinde değiştirdi.',
    fullContentEn: 'Kadir Nurman (1933-2013) was a Turkish-origin gastronomer in Berlin. He is considered the inventor of the modern döner kebab in flatbread, which he first sold at his stand at Zoo Station in 1972. His idea of serving meat in bread revolutionized fast-food culture.',
    fullContentPl: 'Kadir Nurman (1933-2013) był gastronomem tureckiego pochodzenia w Berlinie. Jest uważany za wynalazcę współczesnego döner kebaba w chlebie, który po raz pierwszy sprzedał w 1972 roku.',
    link: 'https://en.wikipedia.org/wiki/Kadir_Nurman',
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
    fullContent: 'İskender Kebap wurde 1867 von İskender Efendi in Bursa, Türkei, erfunden. Das Gericht besteht aus dünn geschnittenem Dönerfleisch auf Fladenbrot, übergossen mit heißer Tomatensauce und zerlassener Butter, serviert mit Joghurt. Heute ist es weltweit in türkischen Restaurants zu finden.',
    fullContentTr: 'İskender Kebap, 1867\'de Bursa\'da İskender Efendi tarafından icat edildi. Yemek, pide ekmeği üzerinde ince dilimlenmiş döner eti, sıcak domates sosu ve eritilmiş tereyağı ile kaplanarak yoğurtla servis edilir. Bugün dünya genelinde Türk restoranlarında bulunabilir.',
    fullContentEn: 'Iskender Kebab was invented in 1867 by İskender Efendi in Bursa, Turkey. The dish consists of thinly sliced döner meat on flatbread, covered with hot tomato sauce and melted butter, served with yogurt. Today it can be found in Turkish restaurants worldwide.',
    fullContentPl: 'Iskender Kebab został wynaleziony w 1867 roku przez İskender Efendi w Bursie, Turcja. Danie składa się z cienko pokrojonego mięsa döner na chlebie, polane gorącym sosem pomidorowym i roztopionym masłem, podawane z jogurtem.',
    link: 'https://en.wikipedia.org/wiki/Iskender_kebap',
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
    fullContent: 'Döner hat Burger und Pizza als beliebtestes Fast Food in Deutschland überholt. Mit über 700.000 verkauften Döner pro Tag und einem Marktanteil von über 40% im Fast-Food-Segment dominiert der Döner den deutschen Markt. Die Beliebtheit erstreckt sich über alle Altersgruppen.',
    fullContentTr: 'Döner, Almanya\'da en sevilen fast food olarak hamburger ve pizzayı geride bıraktı. Günde 700.000\'den fazla satışı ve fast food segmentinde %40\'ın üzerinde pazar payı ile döner, Alman pazarına hakim. Popülerliği tüm yaş gruplarına yayılıyor.',
    fullContentEn: 'Döner has overtaken burgers and pizza as the most popular fast food in Germany. With over 700,000 döners sold per day and a market share of over 40% in the fast-food segment, döner dominates the German market. Its popularity spans all age groups.',
    fullContentPl: 'Döner wyprzedził burgery i pizzę jako najpopularniejszy fast food w Niemczech. Ze sprzedażą ponad 700 000 dönerów dziennie i udziałem w rynku ponad 40%, döner dominuje na niemieckim rynku.',
    link: 'https://www.spiegel.de/wirtschaft/doener-kebab',
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
    liveNews: 'Güncel Haberler',
    funFacts: 'Eğlenceli Bilgiler',
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
    liveNews: 'Aktuelle Nachrichten',
    funFacts: 'Fun Facts',
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
    liveNews: 'Live News',
    funFacts: 'Fun Facts',
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
    liveNews: 'Wiadomości na żywo',
    funFacts: 'Ciekawostki',
  }
};

const DonerNews = () => {
  const { language } = useLanguage();
  const t = (key) => texts[language]?.[key] || texts.de[key] || key;
  const [randomFact, setRandomFact] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [liveNews, setLiveNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);

  useEffect(() => {
    // Set a random fun fact on load
    const randomIndex = Math.floor(Math.random() * donerNews.length);
    setRandomFact(donerNews[randomIndex]);
    
    // Fetch live news
    fetchLiveNews();
  }, [language]);

  const fetchLiveNews = async () => {
    setLoadingNews(true);
    try {
      const response = await axios.get(`${API}/doner-news?lang=${language}`);
      if (response.data.success) {
        setLiveNews(response.data.news);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

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

  const getFullContent = (item) => {
    if (language === 'tr') return item.fullContentTr;
    if (language === 'en') return item.fullContentEn;
    if (language === 'pl') return item.fullContentPl;
    return item.fullContent;
  };

  const shuffleFact = () => {
    const randomIndex = Math.floor(Math.random() * donerNews.length);
    setRandomFact(donerNews[randomIndex]);
  };

  const openNewsDetail = (item) => {
    setSelectedNews(item);
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

      {/* Live News Section */}
      {liveNews.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-red-500" />
            {t('liveNews')}
            <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveNews.map((item) => (
              <Card 
                key={item.id} 
                className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer border-l-4 border-l-red-500"
                onClick={() => window.open(item.url, '_blank')}
              >
                {item.image && (
                  <div className="h-32 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <CardContent className="p-4">
                  <Badge className="bg-slate-100 text-slate-700 border-0 text-xs mb-2">
                    {item.source}
                  </Badge>
                  <h3 className="font-semibold text-sm mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'tr' ? 'tr-TR' : 'en-US')}
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Fun Facts Grid */}
      <div>
        <h2 className="text-xl font-bold mb-4">{t('funFacts')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donerNews.map((item) => (
          <Card 
            key={item.id} 
            className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer" 
            data-testid={`news-${item.id}`}
            onClick={() => openNewsDetail(item)}
          >
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
                <span className="flex items-center gap-1 text-amber-600">
                  {t('readMore')} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </div>

      {/* News Detail Modal */}
      <Dialog open={!!selectedNews} onOpenChange={() => setSelectedNews(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedNews && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <span className="text-5xl">{selectedNews.icon}</span>
                  <div>
                    <Badge className={`${categoryColors[selectedNews.category]} border-0 mb-2`}>
                      {categoryLabels[language]?.[selectedNews.category]}
                    </Badge>
                    <DialogTitle className="text-xl">{getTitle(selectedNews)}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <p className="text-slate-700 leading-relaxed">
                  {getFullContent(selectedNews)}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedNews.date).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'tr' ? 'tr-TR' : language === 'pl' ? 'pl-PL' : 'en-US')}
                  </span>
                  
                  {selectedNews.link && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(selectedNews.link, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('readMore')}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DonerNews;
