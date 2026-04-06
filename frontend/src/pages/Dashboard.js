import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, Mail, TrendingUp, ShoppingCart, Euro, Target, Calendar as CalendarIcon, Clock, Plus, CheckCircle, ArrowRight, X, MapPin, Phone, Truck, Briefcase, TrendingDown, BarChart3, Sparkles, AlertTriangle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { tr, de, enUS, pl } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EVENT_TYPES_BASE = [
  { value: 'visit', labelKey: 'customerVisit', icon: MapPin, color: 'bg-blue-500' },
  { value: 'meeting', labelKey: 'meeting', icon: Briefcase, color: 'bg-purple-500' },
  { value: 'call', labelKey: 'phoneCall', icon: Phone, color: 'bg-green-500' },
  { value: 'delivery', labelKey: 'delivery', icon: Truck, color: 'bg-indigo-500' },
  { value: 'task', labelKey: 'task', icon: CheckCircle, color: 'bg-gray-500' },
];

const Dashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Translate event types dynamically
  const EVENT_TYPES = EVENT_TYPES_BASE.map(et => ({ ...et, label: t(et.labelKey) }));
  
  const [stats, setStats] = useState({
    total_leads: 0,
    emails_sent: 0,
    emails_failed: 0,
    recent_leads: [],
    total_orders: 0,
    total_revenue: 0,
    yearly_target: 0
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  
  // Calendar & Agenda state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  
  // Churn Analysis state
  const [atRiskCustomers, setAtRiskCustomers] = useState([]);
  const [loadingChurn, setLoadingChurn] = useState(false);
  const [leads, setLeads] = useState([]);
  
  // Visit Planning Dialog
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({
    title: '',
    event_type: 'visit',
    lead_id: '',
    time: '09:00',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Sales Forecast
  const [forecast, setForecast] = useState(null);
  const [loadingForecast, setLoadingForecast] = useState(false);
  
  // Dashboard Alerts
  const [alerts, setAlerts] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);

  const periods = [
    { value: 'all', label: t('allTime') },
    { value: 'month', label: t('oneMonth') },
    { value: 'quarter', label: t('threeMonths') },
    { value: 'half_year', label: t('sixMonths') },
    { value: 'year', label: t('oneYear') }
  ];

  const getLocale = () => {
    switch(language) {
      case 'tr': return tr;
      case 'de': return de;
      case 'pl': return pl;
      default: return enUS;
    }
  };

  // Shipments state
  const [shipments, setShipments] = useState([]);
  
  useEffect(() => {
    fetchStats(period);
    fetchEvents();
    fetchLeads();
    fetchForecast();
    fetchShipments();
    fetchAlerts();
    fetchFinanceSummary();
  }, [period]);

  const fetchStats = async (selectedPeriod) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/dashboard/stats?period=${selectedPeriod}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchShipments = async () => {
    try {
      const response = await axios.get(`${API}/shipments`);
      setShipments(response.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      setShipments([]);
    }
  };
  
  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/alerts`);
      setAlerts(response.data?.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };
  
  const fetchFinanceSummary = async () => {
    try {
      const response = await axios.get(`${API}/finance/summary`);
      setFinanceSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch finance summary:', error);
    }
  };
  
  const fetchForecast = async () => {
    setLoadingForecast(true);
    try {
      const response = await axios.get(`${API}/sales/forecast`);
      setForecast(response.data);
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    } finally {
      setLoadingForecast(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/agenda`);
      setEvents(response.data || []);
    } catch (error) {
      setEvents([]);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API}/leads`);
      setLeads(response.data || []);
    } catch (error) {
      setLeads([]);
    }
  };

  const openVisitDialog = () => {
    setVisitForm({
      title: '',
      event_type: 'visit',
      lead_id: '',
      time: '09:00',
      notes: ''
    });
    setIsVisitDialogOpen(true);
  };

  const handleVisitSubmit = async () => {
    if (!visitForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(`${API}/agenda`, {
        title: visitForm.title,
        due_date: selectedDate.toISOString(),
        completed: false,
        event_type: visitForm.event_type,
        lead_id: visitForm.lead_id || null,
        time: visitForm.time,
        notes: visitForm.notes
      });
      
      setEvents([response.data, ...events]);
      setIsVisitDialogOpen(false);
      toast.success('Visit scheduled successfully!');
    } catch (error) {
      toast.error('Failed to schedule visit');
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = async (eventId) => {
    try {
      const event = events.find(e => e.id === eventId);
      await axios.put(`${API}/agenda/${eventId}`, {
        completed: !event.completed
      });
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, completed: !e.completed } : e
      ));
    } catch (error) {
      toast.error('Failed to update event');
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await axios.delete(`${API}/agenda/${eventId}`);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  // Get events for selected date
  const selectedDateEvents = events.filter(event => {
    if (!event.due_date) return false;
    return isSameDay(new Date(event.due_date), selectedDate);
  });

  // Get dates that have events for calendar highlighting
  const eventDates = events
    .filter(e => e.due_date)
    .map(e => new Date(e.due_date));

  // Get upcoming visits (next 7 days)
  const upcomingVisits = events
    .filter(e => {
      if (!e.due_date || e.completed) return false;
      const eventDate = new Date(e.due_date);
      const today = new Date();
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      return eventDate >= today && eventDate <= weekLater && e.event_type === 'visit';
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const revenueProgress = stats.yearly_target > 0 
    ? Math.min(100, (stats.total_revenue / stats.yearly_target) * 100) 
    : 0;

  const getEventTypeInfo = (type) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[4];
  };

  const statCards = [
    {
      label: t('totalLeads'),
      value: stats.total_leads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-100',
      link: '/leads'
    },
    {
      label: t('totalOrders'),
      value: stats.total_orders,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBg: 'hover:bg-purple-100',
      link: '/orders'
    },
    {
      label: t('revenue'),
      value: formatCurrency(stats.total_revenue || 0),
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverBg: 'hover:bg-green-100',
      isText: true,
      link: '/orders'
    },
    {
      label: t('emailsSent'),
      value: stats.emails_sent,
      icon: Mail,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      hoverBg: 'hover:bg-indigo-100',
      link: '/email-history'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header with Period Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-1">{t('welcomeTo')} Gewürzberg CRM</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={period === p.value ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`card-hover cursor-pointer transition-all ${stat.hoverBg}`}
            onClick={() => navigate(stat.link)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                    {stat.isText ? stat.value : stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <Card 
              key={idx} 
              className={`border-l-4 ${
                alert.severity === 'high' ? 'border-l-red-500 bg-red-50' :
                alert.severity === 'medium' ? 'border-l-orange-500 bg-orange-50' :
                'border-l-blue-500 bg-blue-50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      alert.severity === 'high' ? 'text-red-600' :
                      alert.severity === 'medium' ? 'text-orange-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(alert.action_url || '/')}
                  >
                    {t('viewDetails') || 'Detaylar'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Finance Summary Widget */}
      {financeSummary && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Euro className="w-5 h-5 text-green-600" />
              {language === 'tr' ? 'Finansal Özet' : 'Financial Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Toplam Ciro' : 'Total Revenue'}</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(financeSummary.total_revenue)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Ödenen' : 'Paid'}</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(financeSummary.total_paid)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Bekleyen' : 'Pending'}</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(financeSummary.total_pending)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs text-muted-foreground">{language === 'tr' ? 'Ödeme Oranı' : 'Payment Rate'}</p>
                <p className="text-xl font-bold text-blue-700">
                  {financeSummary.total_revenue > 0 
                    ? Math.round((financeSummary.total_paid / financeSummary.total_revenue) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
            
            {/* Top Customers */}
            {financeSummary.customer_ranking?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">{language === 'tr' ? 'En Değerli Müşteriler' : 'Top Customers'}</p>
                <div className="space-y-2">
                  {financeSummary.customer_ranking.slice(0, 3).map((customer, idx) => (
                    <div key={customer.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-gray-300 text-gray-700' :
                          'bg-orange-300 text-orange-800'
                        }`}>{idx + 1}</span>
                        <span className="font-medium text-sm">{customer.company_name}</span>
                      </div>
                      <span className="font-bold text-green-700">{formatCurrency(customer.total_revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Revenue Target Progress */}
      {stats.yearly_target > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-indigo-600" />
                <div>
                  <h3 className="font-semibold">Annual Revenue Target</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stats.total_revenue)} of {formatCurrency(stats.yearly_target)}
                  </p>
                </div>
              </div>
              <Badge className="bg-indigo-600 text-white">
                {revenueProgress.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={revenueProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* AI Sales Forecast */}
      {forecast && forecast.forecast && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Sales Forecast
              <Badge variant="outline" className="ml-2 text-xs">
                {forecast.forecast.confidence}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Prediction */}
              <div className="p-4 bg-white rounded-lg border border-purple-100">
                <p className="text-sm text-muted-foreground mb-1">{forecast.forecast.next_month_name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-purple-700">
                    {formatCurrency(forecast.forecast.predicted_revenue)}
                  </p>
                  {forecast.forecast.trend === 'up' ? (
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  ) : forecast.forecast.trend === 'down' ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ~{forecast.forecast.predicted_orders} orders expected
                </p>
              </div>
              
              {/* Summary */}
              <div className="p-4 bg-white rounded-lg border border-purple-100">
                <p className="text-sm text-muted-foreground mb-1">Monthly Average</p>
                <p className="text-xl font-semibold text-gray-700">
                  {formatCurrency(forecast.summary?.avg_monthly_revenue || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {forecast.summary?.avg_monthly_orders || 0} orders/month
                </p>
              </div>
              
              {/* Total */}
              <div className="p-4 bg-white rounded-lg border border-purple-100">
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-xl font-semibold text-gray-700">
                  {formatCurrency(forecast.summary?.total_revenue || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {forecast.summary?.total_orders || 0} orders total
                </p>
              </div>
            </div>
            
            {/* Mini Chart - Historical Data */}
            {forecast.historical_data && forecast.historical_data.length > 0 && (
              <div className="mt-4 pt-4 border-t border-purple-100">
                <p className="text-xs text-muted-foreground mb-2">Revenue History (Last 6 months)</p>
                <div className="flex items-end gap-1 h-16">
                  {forecast.historical_data.slice(-6).map((month, idx) => {
                    const maxRev = Math.max(...forecast.historical_data.slice(-6).map(m => m.revenue));
                    const height = maxRev > 0 ? (month.revenue / maxRev) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-purple-400 rounded-t transition-all hover:bg-purple-500"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${month.month}: ${formatCurrency(month.revenue)}`}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {month.month.slice(5)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Calendar & Upcoming Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              Calendar & Visit Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Calendar Component */}
              <div className="flex-shrink-0 w-full lg:w-auto">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={getLocale()}
                  className="rounded-md border"
                  modifiers={{
                    hasEvent: eventDates
                  }}
                  modifiersStyles={{
                    hasEvent: { 
                      backgroundColor: '#fed7aa',
                      borderRadius: '50%'
                    }
                  }}
                />
              </div>
              
              {/* Events for Selected Date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-sm font-medium">
                    {format(selectedDate, 'PPP', { locale: getLocale() })}
                  </p>
                  <Button 
                    size="sm"
                    onClick={openVisitDialog}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Schedule Visit
                  </Button>
                </div>
                
                {/* Event List */}
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('noEventsToday')}</p>
                    <p className="text-xs mt-1">{t('addEvent')}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {selectedDateEvents.map((event) => {
                      const typeInfo = getEventTypeInfo(event.event_type);
                      const TypeIcon = typeInfo.icon;
                      
                      return (
                        <div 
                          key={event.id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors border ${
                            event.completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white hover:bg-muted/50'
                          }`}
                        >
                          <button 
                            onClick={() => toggleEvent(event.id)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${typeInfo.color} text-white`}
                          >
                            {event.completed ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <TypeIcon className="w-3 h-3" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <p className={`font-medium text-sm truncate ${event.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {event.title}
                            </p>
                            {event.company_name && (
                              <p className="text-xs text-muted-foreground truncate">{event.company_name}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {event.time && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {event.time}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs capitalize">
                                {event.event_type}
                              </Badge>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Visits Sidebar */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
              Upcoming Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingVisits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming visits</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={openVisitDialog}
                  className="text-indigo-600"
                >
                  Schedule your first visit
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingVisits.map((visit) => (
                  <div 
                    key={visit.id}
                    className="p-3 bg-blue-50 rounded-lg border border-blue-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{visit.title}</p>
                        {visit.company_name && (
                          <p className="text-xs text-blue-700">{visit.company_name}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs bg-white">
                        {format(new Date(visit.due_date), 'MMM d')}
                      </Badge>
                    </div>
                    {visit.time && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {visit.time}
                      </p>
                    )}
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/route-planner')}
                >
                  Plan Route <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads & Recent Emails Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="w-5 h-5 text-blue-600" />
              {t('recentLeads')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('noLeadsYet')}</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/leads')}
                  className="text-indigo-600"
                >
                  {t('addLead')} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_leads.slice(0, 5).map((lead) => (
                  <div 
                    key={lead.id}
                    className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer flex items-center gap-3"
                    onClick={() => navigate(`/leads`)}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {lead.first_name?.[0]}{lead.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{lead.company_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.city}, {lead.country}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate('/leads')}
                >
                  {t('viewAll') || 'Tümünü Gör'} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Emails */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Mail className="w-5 h-5 text-indigo-600" />
                {t('recentEmails') || 'Son Mailler'}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/compose')}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {t('aiMailComposer') || 'AI ile Mail'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.emails_sent === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('noEmails') || 'Henüz mail yok'}</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/mail')}
                  className="text-indigo-600"
                >
                  Mail {t('compose') || 'Yaz'} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-2xl font-bold text-green-600">{stats.emails_sent}</p>
                    <p className="text-xs text-green-700">{t('emailsSent')}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-2xl font-bold text-red-600">{stats.emails_failed}</p>
                    <p className="text-xs text-red-700">{t('emailsFailed')}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate('/mail')}
                >
                  {t('mail') || 'Mail'} {t('inbox') || 'Kutusu'} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visit Planning Dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Manrope'] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Schedule Visit / Event
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date Display */}
            <div className="p-3 bg-indigo-50 rounded-lg text-center">
              <p className="text-sm text-indigo-700 font-medium">
                {format(selectedDate, 'EEEE, MMMM d, yyyy', { locale: getLocale() })}
              </p>
            </div>
            
            {/* Event Type */}
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select 
                value={visitForm.event_type} 
                onValueChange={(v) => setVisitForm({...visitForm, event_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={visitForm.title}
                onChange={(e) => setVisitForm({...visitForm, title: e.target.value})}
                placeholder="e.g., Sales meeting, Product demo..."
                data-testid="visit-title-input"
              />
            </div>
            
            {/* Customer (Optional) */}
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <Select 
                value={visitForm.lead_id} 
                onValueChange={(v) => setVisitForm({...visitForm, lead_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No customer</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name} - {lead.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Time */}
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={visitForm.time}
                onChange={(e) => setVisitForm({...visitForm, time: e.target.value})}
              />
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={visitForm.notes}
                onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVisitDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVisitSubmit}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipments Section */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            Recent Shipments
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/shipments')}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {shipments.length > 0 ? (
            <div className="space-y-3">
              {shipments.map((shipment, index) => {
                const statusColors = {
                  'delivered': 'bg-green-100 text-green-700',
                  'in_transit': 'bg-blue-100 text-blue-700',
                  'out_for_delivery': 'bg-indigo-100 text-indigo-700',
                  'pending': 'bg-yellow-100 text-yellow-700',
                  'exception': 'bg-red-100 text-red-700',
                };
                const statusLabels = {
                  'delivered': 'Delivered',
                  'in_transit': 'In Transit',
                  'out_for_delivery': 'Out for Delivery',
                  'pending': 'Pending',
                  'exception': 'Exception',
                };
                return (
                  <div 
                    key={shipment._id || index} 
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/shipments')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Truck className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{shipment.tracking_number}</p>
                        <p className="text-xs text-muted-foreground">{shipment.lead_name || 'Customer'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{shipment.location || '-'}</p>
                      </div>
                      <Badge className={statusColors[shipment.status] || 'bg-gray-100 text-gray-700'}>
                        {statusLabels[shipment.status] || shipment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-muted-foreground">No shipments found</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => navigate('/shipments')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Shipment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
