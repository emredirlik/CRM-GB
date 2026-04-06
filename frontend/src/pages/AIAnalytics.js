import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Users, 
  AlertTriangle, 
  Clock, 
  Calendar,
  BarChart3,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Phone,
  Mail,
  ShoppingCart,
  Euro,
  Target,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const texts = {
  tr: {
    title: 'AI Müşteri Analizi',
    subtitle: 'Yapay zeka destekli müşteri içgörüleri',
    healthScore: 'Müşteri Sağlık Skoru',
    churnRisk: 'Kayıp Riski',
    orderPrediction: 'Sipariş Tahmini',
    contactTime: 'İletişim Zamanı',
    salesForecast: 'Satış Tahmini',
    seasonalTrends: 'Sezonsal Trendler',
    refresh: 'Analizi Yenile',
    analyzing: 'Analiz ediliyor...',
    noData: 'Yeterli veri yok',
    highRisk: 'Yüksek Risk',
    mediumRisk: 'Orta Risk',
    lowRisk: 'Düşük Risk',
    healthy: 'Sağlıklı',
    needsAttention: 'İlgi Gerekiyor',
    critical: 'Kritik',
    expectedOrder: 'Tahmini Sipariş',
    lastOrder: 'Son Sipariş',
    avgInterval: 'Ort. Sipariş Aralığı',
    daysOverdue: 'gün gecikmiş',
    daysUntil: 'gün sonra',
    bestTime: 'En İyi Zaman',
    morning: 'Sabah (09:00-12:00)',
    afternoon: 'Öğleden Sonra (14:00-17:00)',
    evening: 'Akşam (17:00-19:00)',
    weekday: 'Hafta içi',
    weekend: 'Hafta sonu',
    monthlyForecast: 'Aylık Tahmin',
    quarterlyForecast: 'Çeyreklik Tahmin',
    totalCustomers: 'Toplam Müşteri',
    atRiskCustomers: 'Risk Altında',
    healthyCustomers: 'Sağlıklı',
    revenue: 'Gelir',
    viewDetails: 'Detayları Gör',
    contactNow: 'Şimdi İletişime Geç',
    sendEmail: 'Mail Gönder',
    jan: 'Oca', feb: 'Şub', mar: 'Mar', apr: 'Nis', may: 'May', jun: 'Haz',
    jul: 'Tem', aug: 'Ağu', sep: 'Eyl', oct: 'Eki', nov: 'Kas', dec: 'Ara'
  },
  en: {
    title: 'AI Customer Analytics',
    subtitle: 'AI-powered customer insights',
    healthScore: 'Customer Health Score',
    churnRisk: 'Churn Risk',
    orderPrediction: 'Order Prediction',
    contactTime: 'Contact Time',
    salesForecast: 'Sales Forecast',
    seasonalTrends: 'Seasonal Trends',
    refresh: 'Refresh Analysis',
    analyzing: 'Analyzing...',
    noData: 'Insufficient data',
    highRisk: 'High Risk',
    mediumRisk: 'Medium Risk',
    lowRisk: 'Low Risk',
    healthy: 'Healthy',
    needsAttention: 'Needs Attention',
    critical: 'Critical',
    expectedOrder: 'Expected Order',
    lastOrder: 'Last Order',
    avgInterval: 'Avg. Order Interval',
    daysOverdue: 'days overdue',
    daysUntil: 'days until',
    bestTime: 'Best Time',
    morning: 'Morning (09:00-12:00)',
    afternoon: 'Afternoon (14:00-17:00)',
    evening: 'Evening (17:00-19:00)',
    weekday: 'Weekday',
    weekend: 'Weekend',
    monthlyForecast: 'Monthly Forecast',
    quarterlyForecast: 'Quarterly Forecast',
    totalCustomers: 'Total Customers',
    atRiskCustomers: 'At Risk',
    healthyCustomers: 'Healthy',
    revenue: 'Revenue',
    viewDetails: 'View Details',
    contactNow: 'Contact Now',
    sendEmail: 'Send Email',
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
    jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec'
  },
  de: {
    title: 'KI Kundenanalyse',
    subtitle: 'KI-gestützte Kundeneinblicke',
    healthScore: 'Kunden-Gesundheitswert',
    churnRisk: 'Abwanderungsrisiko',
    orderPrediction: 'Bestellvorhersage',
    contactTime: 'Kontaktzeit',
    salesForecast: 'Verkaufsprognose',
    seasonalTrends: 'Saisonale Trends',
    refresh: 'Analyse aktualisieren',
    analyzing: 'Wird analysiert...',
    noData: 'Unzureichende Daten',
    highRisk: 'Hohes Risiko',
    mediumRisk: 'Mittleres Risiko',
    lowRisk: 'Niedriges Risiko',
    healthy: 'Gesund',
    needsAttention: 'Braucht Aufmerksamkeit',
    critical: 'Kritisch',
    expectedOrder: 'Erwartete Bestellung',
    lastOrder: 'Letzte Bestellung',
    avgInterval: 'Durchschn. Bestellintervall',
    daysOverdue: 'Tage überfällig',
    daysUntil: 'Tage bis',
    bestTime: 'Beste Zeit',
    morning: 'Morgen (09:00-12:00)',
    afternoon: 'Nachmittag (14:00-17:00)',
    evening: 'Abend (17:00-19:00)',
    weekday: 'Wochentag',
    weekend: 'Wochenende',
    monthlyForecast: 'Monatsprognose',
    quarterlyForecast: 'Quartalsprognose',
    totalCustomers: 'Gesamtkunden',
    atRiskCustomers: 'Gefährdet',
    healthyCustomers: 'Gesund',
    revenue: 'Umsatz',
    viewDetails: 'Details anzeigen',
    contactNow: 'Jetzt kontaktieren',
    sendEmail: 'E-Mail senden',
    jan: 'Jan', feb: 'Feb', mar: 'Mär', apr: 'Apr', may: 'Mai', jun: 'Jun',
    jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Okt', nov: 'Nov', dec: 'Dez'
  }
};

const AIAnalytics = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [customerInsights, setCustomerInsights] = useState([]);
  const [salesForecast, setSalesForecast] = useState(null);
  const [seasonalData, setSeasonalData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, insightsRes, forecastRes, seasonalRes] = await Promise.all([
        axios.get(`${API}/ai/analytics/summary`),
        axios.get(`${API}/ai/analytics/customer-insights`),
        axios.get(`${API}/ai/analytics/sales-forecast`),
        axios.get(`${API}/ai/analytics/seasonal-trends`)
      ]);
      
      setAnalytics(analyticsRes.data);
      setCustomerInsights(insightsRes.data);
      setSalesForecast(forecastRes.data);
      setSeasonalData(seasonalRes.data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Analiz verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalysis = async () => {
    setAnalyzing(true);
    try {
      await axios.post(`${API}/ai/analytics/refresh`);
      await fetchAnalytics();
      toast.success('Analiz güncellendi');
    } catch (error) {
      toast.error('Analiz güncellenemedi');
    } finally {
      setAnalyzing(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return { text: t.healthy, color: 'bg-green-100 text-green-700' };
    if (score >= 60) return { text: t.needsAttention, color: 'bg-yellow-100 text-yellow-700' };
    if (score >= 40) return { text: t.mediumRisk, color: 'bg-orange-100 text-orange-700' };
    return { text: t.critical, color: 'bg-red-100 text-red-700' };
  };

  const getRiskBadge = (risk) => {
    if (risk === 'high') return { text: t.highRisk, color: 'bg-red-100 text-red-700 border-red-200' };
    if (risk === 'medium') return { text: t.mediumRisk, color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { text: t.lowRisk, color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const handleContactCustomer = (customer) => {
    navigate('/compose', { state: { selectedLead: customer } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-muted-foreground">{t.analyzing}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ai-analytics-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-['Manrope']">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
        <Button onClick={refreshAnalysis} disabled={analyzing} className="bg-indigo-600 hover:bg-indigo-700">
          {analyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {analyzing ? t.analyzing : t.refresh}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">{t.totalCustomers}</p>
                <p className="text-3xl font-bold text-blue-700">{analytics?.total_customers || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">{t.healthyCustomers}</p>
                <p className="text-3xl font-bold text-green-700">{analytics?.healthy_customers || 0}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">{t.atRiskCustomers}</p>
                <p className="text-3xl font-bold text-red-700">{analytics?.at_risk_customers || 0}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">{t.monthlyForecast}</p>
                <p className="text-3xl font-bold text-purple-700">
                  {salesForecast?.next_month?.toLocaleString('de-DE')} €
                </p>
              </div>
              <Target className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="customers" className="py-2">
            <Users className="w-4 h-4 mr-2" />
            {t.healthScore}
          </TabsTrigger>
          <TabsTrigger value="predictions" className="py-2">
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t.orderPrediction}
          </TabsTrigger>
          <TabsTrigger value="forecast" className="py-2">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t.salesForecast}
          </TabsTrigger>
          <TabsTrigger value="trends" className="py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t.seasonalTrends}
          </TabsTrigger>
        </TabsList>

        {/* Customer Health Scores */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-3">
            {customerInsights.map((customer) => {
              const healthLabel = getHealthLabel(customer.health_score);
              const riskBadge = getRiskBadge(customer.churn_risk);
              
              return (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {customer.company_name?.[0]}
                          </div>
                          <div>
                            <h3 className="font-semibold truncate">{customer.company_name}</h3>
                            <p className="text-sm text-muted-foreground">{customer.city}, {customer.country}</p>
                          </div>
                        </div>
                      </div>

                      {/* Health Score */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-center min-w-[100px]">
                          <p className="text-xs text-muted-foreground mb-1">{t.healthScore}</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getHealthColor(customer.health_score)}`} />
                            <span className="text-2xl font-bold">{customer.health_score}</span>
                          </div>
                          <Badge className={`${healthLabel.color} mt-1 text-xs`}>{healthLabel.text}</Badge>
                        </div>

                        {/* Churn Risk */}
                        <div className="text-center min-w-[100px]">
                          <p className="text-xs text-muted-foreground mb-1">{t.churnRisk}</p>
                          <Badge className={`${riskBadge.color} border`}>{riskBadge.text}</Badge>
                        </div>

                        {/* Best Contact Time */}
                        <div className="text-center min-w-[120px]">
                          <p className="text-xs text-muted-foreground mb-1">{t.bestTime}</p>
                          <div className="flex items-center gap-1 justify-center">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm font-medium">{customer.best_contact_time}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleContactCustomer(customer)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => navigate(`/leads`)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <Progress value={customer.health_score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Order Predictions */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-3">
            {customerInsights.filter(c => c.next_order_prediction).map((customer) => (
              <Card key={customer.id} className={`hover:shadow-md transition-shadow ${customer.days_overdue > 0 ? 'border-red-200 bg-red-50/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{customer.company_name}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t.lastOrder}: </span>
                          <span className="font-medium">{customer.last_order_date || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t.avgInterval}: </span>
                          <span className="font-medium">{customer.avg_order_interval} gün</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center sm:text-right">
                      <p className="text-xs text-muted-foreground">{t.expectedOrder}</p>
                      <p className="text-lg font-bold text-indigo-600">{customer.next_order_prediction}</p>
                      {customer.days_overdue > 0 ? (
                        <Badge className="bg-red-100 text-red-700 mt-1">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {customer.days_overdue} {t.daysOverdue}
                        </Badge>
                      ) : customer.days_until_order > 0 ? (
                        <Badge className="bg-green-100 text-green-700 mt-1">
                          {customer.days_until_order} {t.daysUntil}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sales Forecast */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  {t.monthlyForecast}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesForecast?.monthly_forecast && (
                  <div className="space-y-3">
                    {salesForecast.monthly_forecast.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-12 text-sm font-medium">{item.month}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(100, (item.forecast / (salesForecast.max_forecast || 1)) * 100)}%` }}
                          >
                            <span className="text-xs text-white font-medium">
                              {item.forecast.toLocaleString('de-DE')} €
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  {t.quarterlyForecast}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesForecast?.quarterly_forecast && (
                  <div className="grid grid-cols-2 gap-4">
                    {salesForecast.quarterly_forecast.map((item, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{item.quarter}</p>
                        <p className="text-2xl font-bold text-gray-800">{item.forecast.toLocaleString('de-DE')} €</p>
                        <div className={`flex items-center justify-center gap-1 mt-1 ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-sm font-medium">{item.growth}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Seasonal Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                {t.seasonalTrends}
              </CardTitle>
              <CardDescription>
                {language === 'tr' ? 'Aylara göre satış performansı' : 'Sales performance by month'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {seasonalData?.monthly_trends && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {seasonalData.monthly_trends.map((item, idx) => {
                    const maxValue = Math.max(...seasonalData.monthly_trends.map(i => i.value));
                    const heightPercent = (item.value / maxValue) * 100;
                    const months = [t.jan, t.feb, t.mar, t.apr, t.may, t.jun, t.jul, t.aug, t.sep, t.oct, t.nov, t.dec];
                    
                    return (
                      <div key={idx} className="text-center">
                        <div className="h-24 flex items-end justify-center mb-1">
                          <div 
                            className={`w-8 rounded-t-lg transition-all ${item.is_high ? 'bg-green-500' : item.is_low ? 'bg-red-400' : 'bg-indigo-400'}`}
                            style={{ height: `${heightPercent}%` }}
                            title={`${item.value.toLocaleString('de-DE')} €`}
                          />
                        </div>
                        <p className="text-xs font-medium">{months[idx]}</p>
                        <p className="text-[10px] text-muted-foreground">{(item.value / 1000).toFixed(0)}k</p>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {seasonalData?.insights && (
                <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI İçgörüleri
                  </h4>
                  <ul className="space-y-1 text-sm text-indigo-700">
                    {seasonalData.insights.map((insight, idx) => (
                      <li key={idx}>• {insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalytics;
