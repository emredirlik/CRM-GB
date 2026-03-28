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

const EVENT_TYPES = [
  { value: 'visit', label: 'Customer Visit', icon: MapPin, color: 'bg-blue-500' },
  { value: 'meeting', label: 'Meeting', icon: Briefcase, color: 'bg-purple-500' },
  { value: 'call', label: 'Phone Call', icon: Phone, color: 'bg-green-500' },
  { value: 'delivery', label: 'Delivery', icon: Truck, color: 'bg-orange-500' },
  { value: 'task', label: 'Task', icon: CheckCircle, color: 'bg-gray-500' },
];

const Dashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
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

  const periods = [
    { value: 'all', label: 'All' },
    { value: 'month', label: '1 Month' },
    { value: 'quarter', label: '3 Months' },
    { value: 'half_year', label: '6 Months' },
    { value: 'year', label: '1 Year' }
  ];

  const getLocale = () => {
    switch(language) {
      case 'tr': return tr;
      case 'de': return de;
      case 'pl': return pl;
      default: return enUS;
    }
  };

  useEffect(() => {
    fetchStats(period);
    fetchEvents();
    fetchLeads();
    fetchForecast();
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
      label: 'Orders',
      value: stats.total_orders,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverBg: 'hover:bg-purple-100',
      link: '/orders'
    },
    {
      label: 'Revenue',
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
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverBg: 'hover:bg-orange-100',
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
          <p className="text-muted-foreground mt-1">Welcome to Gewürzberg CRM</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={period === p.value ? 'bg-orange-600 hover:bg-orange-700' : ''}
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

      {/* Revenue Target Progress */}
      {stats.yearly_target > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold">Annual Revenue Target</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stats.total_revenue)} of {formatCurrency(stats.yearly_target)}
                  </p>
                </div>
              </div>
              <Badge className="bg-orange-600 text-white">
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
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
              Calendar & Visit Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-6 flex-wrap">
              {/* Calendar Component */}
              <div>
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
              <div className="flex-1 min-w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">
                    {format(selectedDate, 'PPP', { locale: getLocale() })}
                  </p>
                  <Button 
                    size="sm"
                    onClick={openVisitDialog}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Schedule Visit
                  </Button>
                </div>
                
                {/* Event List */}
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events scheduled</p>
                    <p className="text-xs mt-1">Click "Schedule Visit" to plan a customer visit</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto">
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
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${event.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {event.title}
                            </p>
                            {event.company_name && (
                              <p className="text-xs text-muted-foreground">{event.company_name}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
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
        <Card>
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
                  className="text-orange-600"
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
                className="text-orange-600"
              >
                Add your first lead <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {stats.recent_leads.map((lead) => (
                <div 
                  key={lead.id}
                  className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate(`/leads`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Planning Dialog */}
      <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Manrope'] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              Schedule Visit / Event
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Date Display */}
            <div className="p-3 bg-orange-50 rounded-lg text-center">
              <p className="text-sm text-orange-700 font-medium">
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
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saving ? 'Saving...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
