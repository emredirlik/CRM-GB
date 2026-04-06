import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSMTPSettings, saveSMTPSettings, testSMTPConnection } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Mail, TestTube, Save, Loader2, CheckCircle, XCircle, Building2, Target, Euro, Inbox, FileText, Send, BarChart3 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  
  // Report Settings
  const [reportEmail, setReportEmail] = useState('');
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSummary, setReportSummary] = useState(null);
  
  // SMTP/IMAP Settings
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    use_tls: true,
    use_ssl: false,
    imap_host: '',
    imap_port: 993
  });

  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    company_name: 'Gewürzberg GmbH',
    yearly_target: 0,
    current_revenue: 0
  });

  useEffect(() => {
    fetchSettings();
    fetchCompanySettings();
    fetchReportSummary();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSMTPSettings();
      if (response.data) {
        setFormData({
          host: response.data.host || '',
          port: response.data.port || 587,
          username: response.data.username || '',
          password: response.data.password || '',
          from_email: response.data.from_email || '',
          from_name: response.data.from_name || '',
          use_tls: response.data.use_tls !== false,
          use_ssl: response.data.use_ssl || false,
          imap_host: response.data.imap_host || '',
          imap_port: response.data.imap_port || 993
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const response = await axios.get(`${API}/company-settings`);
      if (response.data) {
        setCompanySettings({
          company_name: response.data.company_name || 'Gewürzberg GmbH',
          yearly_target: response.data.yearly_target || 0,
          current_revenue: response.data.current_revenue || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch company settings:', error);
    }
  };

  const fetchReportSummary = async () => {
    try {
      const response = await axios.get(`${API}/reports/summary`);
      setReportSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch report summary:', error);
    }
  };

  const sendReport = async (reportType) => {
    if (!reportEmail) {
      toast.error('Lütfen email adresi girin');
      return;
    }
    
    setSendingReport(true);
    try {
      await axios.post(`${API}/reports/send`, {
        report_type: reportType,
        recipient_email: reportEmail
      });
      toast.success(`${reportType === 'weekly' ? 'Haftalık' : 'Aylık'} rapor gönderildi`);
    } catch (error) {
      toast.error('Rapor gönderilemedi');
    } finally {
      setSendingReport(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSMTPSettings({
        ...formData,
        port: parseInt(formData.port, 10),
        imap_port: parseInt(formData.imap_port, 10)
      });
      toast.success(t('success'), { description: t('settingsSaved') });
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompanySettings = async () => {
    setSavingCompany(true);
    try {
      await axios.post(`${API}/company-settings`, {
        company_name: companySettings.company_name,
        yearly_target: parseFloat(companySettings.yearly_target) || 0
      });
      toast.success('Başarılı', { description: 'Şirket ayarları kaydedildi' });
    } catch (error) {
      toast.error('Hata', { description: 'Ayarlar kaydedilemedi' });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await testSMTPConnection();
      if (response.data.success) {
        toast.success(t('connectionSuccess'), { 
          description: response.data.message,
          icon: <CheckCircle className="w-4 h-4 text-green-600" />
        });
      } else {
        toast.error(t('connectionFailed'), { 
          description: response.data.message,
          icon: <XCircle className="w-4 h-4 text-red-600" />
        });
      }
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const revenueProgress = companySettings.yearly_target > 0 
    ? Math.min(100, (companySettings.current_revenue / companySettings.yearly_target) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="settings-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('settings')}</h1>
        <p className="text-muted-foreground mt-1">Şirket ve e-posta ayarlarınızı yapılandırın</p>
      </div>

      {/* Company Settings Card */}
      <Card data-testid="company-settings-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="font-['Manrope']">Şirket Ayarları</CardTitle>
              <CardDescription>Şirket bilgilerinizi ve yıllık hedeflerinizi belirleyin</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Şirket Adı</Label>
            <Input
              id="company_name"
              name="company_name"
              value={companySettings.company_name}
              onChange={handleCompanyInputChange}
              placeholder="Gewürzberg GmbH"
              data-testid="input-company-name"
            />
          </div>

          {/* Yearly Revenue Target */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              <Label htmlFor="yearly_target" className="text-base font-medium">Yıllık Hedef Ciro</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearly_target" className="text-sm text-muted-foreground">Hedef (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="yearly_target"
                    name="yearly_target"
                    type="number"
                    min="0"
                    step="1000"
                    value={companySettings.yearly_target}
                    onChange={handleCompanyInputChange}
                    placeholder="500000"
                    className="pl-10"
                    data-testid="input-yearly-target"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Mevcut Gelir</Label>
                <div className="h-10 flex items-center px-3 bg-muted/50 rounded-md">
                  <span className="font-semibold text-green-600">{formatCurrency(companySettings.current_revenue)}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {companySettings.yearly_target > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-700">Hedefe İlerleme</span>
                  <span className="font-medium text-green-900">{revenueProgress.toFixed(1)}%</span>
                </div>
                <Progress value={revenueProgress} className="h-3 bg-green-200" />
                <div className="flex justify-between text-xs mt-2 text-green-600">
                  <span>{formatCurrency(companySettings.current_revenue)}</span>
                  <span>{formatCurrency(companySettings.yearly_target)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleSaveCompanySettings}
              disabled={savingCompany}
              data-testid="save-company-settings-btn"
            >
              {savingCompany ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Şirket Ayarlarını Kaydet
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Settings Card */}
      <Card data-testid="smtp-settings-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="font-['Manrope']">{t('smtpSettings')}</CardTitle>
              <CardDescription>E-posta göndermek için SMTP sunucunuzu yapılandırın</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Server Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">{t('smtpHost')}</Label>
              <Input
                id="host"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                placeholder="smtp.ionos.de"
                data-testid="input-smtp-host"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">{t('smtpPort')}</Label>
              <Input
                id="port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleInputChange}
                placeholder="587"
                data-testid="input-smtp-port"
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('smtpUsername')}</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="email@sirketiniz.de"
                data-testid="input-smtp-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('smtpPassword')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                data-testid="input-smtp-password"
              />
            </div>
          </div>

          {/* From Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_email">{t('fromEmail')}</Label>
              <Input
                id="from_email"
                name="from_email"
                type="email"
                value={formData.from_email}
                onChange={handleInputChange}
                placeholder="info@gewuerzberg.de"
                data-testid="input-from-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_name">{t('fromName')}</Label>
              <Input
                id="from_name"
                name="from_name"
                value={formData.from_name}
                onChange={handleInputChange}
                placeholder="Gewürzberg GmbH"
                data-testid="input-from-name"
              />
            </div>
          </div>

          {/* TLS/SSL Switches */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg flex-1">
              <div>
                <Label htmlFor="use_tls" className="text-base font-medium">{t('useTLS')}</Label>
                <p className="text-sm text-muted-foreground">Port 587 için</p>
              </div>
              <Switch
                id="use_tls"
                checked={formData.use_tls}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_tls: checked, use_ssl: checked ? false : prev.use_ssl }))}
                data-testid="switch-use-tls"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg flex-1">
              <div>
                <Label htmlFor="use_ssl" className="text-base font-medium">{t('useSSL')}</Label>
                <p className="text-sm text-muted-foreground">Port 465 için</p>
              </div>
              <Switch
                id="use_ssl"
                checked={formData.use_ssl}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_ssl: checked, use_tls: checked ? false : prev.use_tls }))}
                data-testid="switch-use-ssl"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleTest}
              disabled={testing || !formData.host}
              data-testid="test-connection-btn"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test Ediliyor...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  {t('testConnection')}
                </>
              )}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              data-testid="save-settings-btn"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('saveSettings')}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IMAP Settings Card */}
      <Card data-testid="imap-settings-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="font-['Manrope']">{t('imapSettings')}</CardTitle>
              <CardDescription>Gelen kutusu için IMAP sunucunuzu yapılandırın</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imap_host">{t('imapHost')}</Label>
              <Input
                id="imap_host"
                name="imap_host"
                value={formData.imap_host}
                onChange={handleInputChange}
                placeholder="imap.ionos.de"
                data-testid="input-imap-host"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imap_port">{t('imapPort')}</Label>
              <Input
                id="imap_port"
                name="imap_port"
                type="number"
                value={formData.imap_port}
                onChange={handleInputChange}
                placeholder="993"
                data-testid="input-imap-port"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            IMAP kullanıcı adı ve şifre, SMTP ayarlarıyla aynı kullanılır.
          </p>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card data-testid="help-card">
        <CardContent className="p-4 md:p-6">
          <h3 className="font-semibold font-['Manrope'] mb-3">E-posta Sunucusu Ayarları</h3>
          <div className="text-sm text-muted-foreground space-y-4">
            
            {/* IONOS */}
            <div>
              <p className="font-medium text-foreground mb-2">IONOS:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                <p>SMTP: smtp.ionos.de, Port: 587 (TLS)</p>
                <p>IMAP: imap.ionos.de, Port: 993 (SSL)</p>
              </div>
            </div>

            {/* Strato */}
            <div>
              <p className="font-medium text-foreground mb-2">Strato:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                <p>SMTP: smtp.strato.de, Port: 465 (SSL)</p>
                <p>IMAP: imap.strato.de, Port: 993 (SSL)</p>
              </div>
            </div>

            {/* Gmail */}
            <div>
              <p className="font-medium text-foreground mb-2">Gmail:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                <p>SMTP: smtp.gmail.com, Port: 587 (TLS)</p>
                <p>IMAP: imap.gmail.com, Port: 993 (SSL)</p>
                <p className="text-orange-600 mt-2">Not: Gmail için App Password gereklidir</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Management Reports */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Yönetim Raporları
          </CardTitle>
          <CardDescription>
            Haftalık veya aylık performans raporlarını üst yönetime gönderin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Summary */}
          {reportSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{reportSummary.weekly?.orders || 0}</p>
                <p className="text-xs text-muted-foreground">Bu Hafta Sipariş</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">€{(reportSummary.weekly?.revenue || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Bu Hafta Ciro</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{reportSummary.weekly?.activities || 0}</p>
                <p className="text-xs text-muted-foreground">Bu Hafta Aktivite</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{reportSummary.weekly?.leads || 0}</p>
                <p className="text-xs text-muted-foreground">Yeni Müşteri</p>
              </div>
            </div>
          )}

          {/* Activity Breakdown */}
          {reportSummary?.activity_breakdown && Object.keys(reportSummary.activity_breakdown).length > 0 && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-medium mb-3 text-sm">Bu Haftaki Aktivite Sonuçları</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(reportSummary.activity_breakdown).map(([outcome, count]) => (
                  <div key={outcome} className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    outcome === 'positive' ? 'bg-green-100 text-green-700' :
                    outcome === 'negative' ? 'bg-red-100 text-red-700' :
                    outcome === 'postponed' ? 'bg-amber-100 text-amber-700' :
                    outcome === 'ordered' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {outcome === 'positive' ? 'Olumlu' :
                     outcome === 'negative' ? 'Olumsuz' :
                     outcome === 'postponed' ? 'Ertelenen' :
                     outcome === 'ordered' ? 'Sipariş' :
                     outcome}: {count}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send Report */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rapor Gönderilecek Email</Label>
              <Input
                type="email"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
                placeholder="yonetici@sirket.com"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => sendReport('weekly')} 
                disabled={sendingReport}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {sendingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Haftalık Rapor Gönder
              </Button>
              <Button 
                onClick={() => sendReport('monthly')} 
                disabled={sendingReport}
                variant="outline"
                className="flex-1"
              >
                {sendingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Aylık Rapor Gönder
              </Button>
            </div>
          </div>

          {/* Upcoming Follow-ups */}
          {reportSummary?.upcoming_followups && reportSummary.upcoming_followups.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg">
              <h4 className="font-medium mb-3 text-sm text-amber-800">Yaklaşan Takipler</h4>
              <div className="space-y-2">
                {reportSummary.upcoming_followups.map((fu, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-amber-900">{fu.company_name}</span>
                    <span className="text-amber-600 font-mono text-xs">
                      {fu.next_action_date ? new Date(fu.next_action_date).toLocaleDateString('tr-TR') : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
