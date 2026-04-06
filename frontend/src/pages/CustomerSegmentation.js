import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, Crown, Heart, Sparkles, AlertTriangle, XCircle, UserPlus, 
  TrendingUp, Euro, ChevronRight, Brain, Target, Clock, Phone,
  RefreshCw, Download
} from 'lucide-react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const segmentIcons = {
  vip: Crown,
  loyal: Heart,
  potential: Sparkles,
  at_risk: AlertTriangle,
  lost: XCircle,
  new: UserPlus
};

const segmentColors = {
  vip: 'bg-amber-500',
  loyal: 'bg-emerald-500',
  potential: 'bg-blue-500',
  at_risk: 'bg-orange-500',
  lost: 'bg-red-500',
  new: 'bg-indigo-500'
};

const CustomerSegmentation = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState({});
  const [summary, setSummary] = useState({});
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const texts = {
    tr: {
      title: 'Müşteri Segmentasyonu',
      subtitle: 'AI destekli müşteri gruplandırma ve strateji önerileri',
      totalCustomers: 'Toplam Müşteri',
      totalRevenue: 'Toplam Ciro',
      avgRevenue: 'Ortalama Ciro',
      viewDetails: 'Detayları Gör',
      recommendations: 'Öneriler',
      actions: 'Yapılacaklar',
      priority: 'Öncelik',
      contactFreq: 'İletişim Sıklığı',
      customers: 'Müşteri',
      revenue: 'Ciro',
      orders: 'Sipariş',
      activities: 'Aktivite',
      refresh: 'Yenile',
      noCustomers: 'Bu segmentte müşteri yok',
      urgent: 'Acil',
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük'
    },
    en: {
      title: 'Customer Segmentation',
      subtitle: 'AI-powered customer grouping and strategy recommendations',
      totalCustomers: 'Total Customers',
      totalRevenue: 'Total Revenue',
      avgRevenue: 'Avg Revenue',
      viewDetails: 'View Details',
      recommendations: 'Recommendations',
      actions: 'Actions',
      priority: 'Priority',
      contactFreq: 'Contact Frequency',
      customers: 'Customers',
      revenue: 'Revenue',
      orders: 'Orders',
      activities: 'Activities',
      refresh: 'Refresh',
      noCustomers: 'No customers in this segment',
      urgent: 'Urgent',
      high: 'High',
      medium: 'Medium',
      low: 'Low'
    }
  };
  const t = texts[language] || texts.tr;

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/ai/customer-segments`);
      setSegments(response.data.segments || {});
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Failed to fetch segments:', error);
      toast.error('Segmentler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const openSegmentDetails = async (segmentKey) => {
    setSelectedSegment({ key: segmentKey, ...segments[segmentKey] });
    setLoadingRecs(true);
    try {
      const response = await axios.get(`${API}/ai/segment-recommendations/${segmentKey}`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="customer-segmentation-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        <Button variant="outline" onClick={fetchSegments}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t.refresh}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t.totalCustomers}</p>
                <p className="text-2xl font-bold text-indigo-600">{summary.total_leads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Euro className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t.totalRevenue}</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.total_revenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{t.avgRevenue}</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.average_revenue_per_customer)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(segments).map(([key, segment]) => {
          const Icon = segmentIcons[key] || Users;
          const colorClass = segmentColors[key] || 'bg-slate-500';
          const customerCount = segment.leads?.length || 0;
          const totalRevenue = segment.leads?.reduce((sum, l) => sum + (l.total_revenue || 0), 0) || 0;
          
          return (
            <Card 
              key={key} 
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => openSegmentDetails(key)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${colorClass} text-white shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold px-3">
                    {customerCount}
                  </Badge>
                </div>
                
                <h3 className="font-bold text-lg mb-1">
                  {language === 'tr' ? segment.name : segment.name_en}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{segment.description}</p>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm text-emerald-600 font-semibold">
                    {formatCurrency(totalRevenue)}
                  </span>
                  <div className="flex items-center text-sm text-indigo-600 group-hover:translate-x-1 transition-transform">
                    {t.viewDetails}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Segment Detail Dialog */}
      <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedSegment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => {
                    const Icon = segmentIcons[selectedSegment.key] || Users;
                    const colorClass = segmentColors[selectedSegment.key] || 'bg-slate-500';
                    return (
                      <div className={`p-2 rounded-lg ${colorClass} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    );
                  })()}
                  {language === 'tr' ? selectedSegment.name : selectedSegment.name_en}
                  <Badge variant="outline">{selectedSegment.leads?.length || 0} {t.customers}</Badge>
                </DialogTitle>
                <DialogDescription>{selectedSegment.description}</DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {/* Recommendations */}
                {loadingRecs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : recommendations && (
                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-600" />
                        {recommendations.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${getPriorityColor(recommendations.priority)} border`}>
                          {t.priority}: {t[recommendations.priority] || recommendations.priority}
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                          <Clock className="w-3 h-3 mr-1" />
                          {recommendations.contact_frequency}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">{t.actions}:</p>
                        <ul className="space-y-1.5">
                          {recommendations.actions?.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-indigo-600">{idx + 1}</span>
                              </div>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Customer List */}
                <div>
                  <h4 className="font-semibold text-sm text-slate-700 mb-3">{t.customers}</h4>
                  {selectedSegment.leads?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{t.noCustomers}</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedSegment.leads?.map((lead) => (
                        <div 
                          key={lead.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                              {lead.first_name?.[0]}{lead.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{lead.company_name}</p>
                              <p className="text-xs text-muted-foreground">{lead.city}, {lead.country}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-emerald-600">{formatCurrency(lead.total_revenue)}</p>
                            <p className="text-xs text-muted-foreground">{lead.order_count} {t.orders}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default CustomerSegmentation;
