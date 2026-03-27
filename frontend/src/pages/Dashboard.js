import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, AlertTriangle, TrendingUp, ShoppingCart, Euro, Target, Calendar, Clock, Plus, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { format, addDays, isToday, isTomorrow, isPast } from 'date-fns';
import { tr, de, enUS, pl } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  const [agenda, setAgenda] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

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
    fetchAgenda();
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

  const fetchAgenda = async () => {
    try {
      const response = await axios.get(`${API}/agenda`);
      setAgenda(response.data || []);
    } catch (error) {
      // Agenda may not exist yet
      setAgenda([]);
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const response = await axios.post(`${API}/agenda`, {
        title: newTask,
        due_date: new Date().toISOString(),
        completed: false
      });
      setAgenda([response.data, ...agenda]);
      setNewTask('');
      setShowTaskInput(false);
      toast.success('Task added');
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const task = agenda.find(t => t.id === taskId);
      await axios.put(`${API}/agenda/${taskId}`, {
        completed: !task.completed
      });
      setAgenda(agenda.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ));
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/agenda/${taskId}`);
      setAgenda(agenda.filter(t => t.id !== taskId));
    } catch (error) {
      toast.error('Failed to delete task');
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
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header with Period Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('dashboard')}</h1>
          <p className="text-muted-foreground mt-1">Gewürzberg GmbH - B2B Customer Management System</p>
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
                  <p className="text-sm font-medium text-green-800">Annual Revenue Target</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.yearly_target)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">Current Revenue</p>
                <p className="text-xl font-bold text-green-900">{formatCurrency(stats.total_revenue)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Progress</span>
                <span className="font-medium text-green-900">{revenueProgress.toFixed(1)}%</span>
              </div>
              <Progress value={revenueProgress} className="h-3 bg-green-200" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - CLICKABLE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`card-hover cursor-pointer transition-all duration-200 ${stat.hoverBg} border-2 border-transparent hover:border-${stat.color.split('-')[1]}-200`}
            onClick={() => navigate(stat.link)}
            data-testid={`stat-card-${index}`}
          >
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
              <div className="mt-3 flex items-center text-xs text-muted-foreground">
                <ArrowRight className="w-3 h-3 mr-1" />
                Click to view details
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda / Tasks */}
        <Card className="lg:col-span-1" data-testid="agenda-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold font-['Manrope'] flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Agenda
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTaskInput(!showTaskInput)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Add Task Input */}
            {showTaskInput && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="New task..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  data-testid="new-task-input"
                />
                <Button size="sm" onClick={addTask}>Add</Button>
              </div>
            )}
            
            {/* Task List */}
            {agenda.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks yet</p>
                <p className="text-xs">Click + to add a task</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {agenda.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      task.completed 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        task.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 hover:border-orange-500'
                      }`}
                    >
                      {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="lg:col-span-2" data-testid="recent-leads-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-semibold font-['Manrope']">{t('recentLeads')}</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
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
                      <tr 
                        key={lead.id} 
                        data-testid={`lead-row-${lead.id}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate('/leads')}
                      >
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
      </div>

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
              <p className="text-slate-300 mt-2">Premium Spices & Binders for Food Manufacturers</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
