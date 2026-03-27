import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Mail, AlertTriangle, TrendingUp, ShoppingCart, Euro, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { t } = useLanguage();
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

  const periods = [
    { value: 'all', label: 'Tümü' },
    { value: 'month', label: '1 Ay' },
    { value: 'quarter', label: '3 Ay' },
    { value: 'half_year', label: '6 Ay' },
    { value: 'year', label: '1 Yıl' }
  ];

  useEffect(() => {
    fetchStats(period);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const revenueProgress = stats.yearly_target > 0 
    ? Math.min(100, (stats.total_revenue / stats.yearly_target) * 100) 
    : 0;

  const statCards = [
    {
      label: t('totalLeads'),
      value: stats.total_leads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Siparişler',
      value: stats.total_orders,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Gelir',
      value: formatCurrency(stats.total_revenue || 0),
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      isText: true
    },
    {
      label: t('emailsSent'),
      value: stats.emails_sent,
      icon: Mail,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
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
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header with Period Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-1">Gewürzberg GmbH - B2B Müşteri Yönetim Sistemi</p>
        </div>
        
        {/* Period Filter */}
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg" data-testid="period-filter">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
          {periods.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p.value)}
              data-testid={`period-${p.value}`}
              className={period === p.value ? "" : "text-muted-foreground"}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Yearly Revenue Target */}
      {stats.yearly_target > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" data-testid="revenue-target-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Yıllık Gelir Hedefi</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.yearly_target)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">Mevcut Gelir</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(stats.total_revenue)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">İlerleme</span>
                <span className="font-medium text-green-900">{revenueProgress.toFixed(1)}%</span>
              </div>
              <Progress value={revenueProgress} className="h-3 bg-green-200" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-hover" data-testid={`stat-card-${index}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className={`mt-2 ${stat.isText ? 'text-2xl font-bold' : 'stat-value'}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Leads */}
      <Card data-testid="recent-leads-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-semibold font-['Manrope']">{t('recentLeads')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recent_leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-leads-message">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('noLeadsYet')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table" data-testid="recent-leads-table">
                <thead>
                  <tr>
                    <th>{t('companyName')}</th>
                    <th>{t('firstName')} {t('lastName')}</th>
                    <th>{t('email')}</th>
                    <th>{t('city')}</th>
                    <th>{t('country')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_leads.map((lead) => (
                    <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                      <td className="font-medium">{lead.company_name}</td>
                      <td>{lead.first_name} {lead.last_name}</td>
                      <td className="text-muted-foreground">{lead.email}</td>
                      <td>{lead.city}</td>
                      <td>{lead.country}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hero Image */}
      <Card className="overflow-hidden" data-testid="hero-image-card">
        <div className="relative h-48 bg-gradient-to-r from-slate-900 to-slate-800">
          <img 
            src="https://images.pexels.com/photos/1287565/pexels-photo-1287565.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="Spices"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold font-['Manrope']">Gewürzberg GmbH</h2>
              <p className="text-slate-300 mt-2">Premium Baharatlar & Gıda Üreticileri için Binding</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
