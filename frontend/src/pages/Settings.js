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
import { Settings as SettingsIcon, Mail, TestTube, Save, Loader2, CheckCircle, XCircle, Building2, Target, Euro } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  
  // SMTP Settings
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    use_tls: true
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
          use_tls: response.data.use_tls !== false
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
        port: parseInt(formData.port, 10)
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
              <CardDescription>E-posta göndermek için SMTP sunucunuzu yapılandırın (Gmail, Kurumsal, vb.)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Server Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">{t('smtpHost')}</Label>
              <Input
                id="host"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                placeholder="smtp.gmail.com veya mail.sirketiniz.com"
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('smtpUsername')}</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="email@sirketiniz.com"
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
                placeholder="Şifre veya App Password"
                data-testid="input-smtp-password"
              />
            </div>
          </div>

          {/* From Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_email">{t('fromEmail')}</Label>
              <Input
                id="from_email"
                name="from_email"
                type="email"
                value={formData.from_email}
                onChange={handleInputChange}
                placeholder="info@sirketiniz.com"
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

          {/* TLS Switch */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="use_tls" className="text-base font-medium">{t('useTLS')}</Label>
              <p className="text-sm text-muted-foreground">Güvenli bağlantı için TLS şifreleme kullan</p>
            </div>
            <Switch
              id="use_tls"
              checked={formData.use_tls}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_tls: checked }))}
              data-testid="switch-use-tls"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
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

      {/* Help Card */}
      <Card data-testid="help-card">
        <CardContent className="p-6">
          <h3 className="font-semibold font-['Manrope'] mb-3">E-posta Sunucusu Ayarları</h3>
          <div className="text-sm text-muted-foreground space-y-4">
            
            {/* Gmail */}
            <div>
              <p className="font-medium text-foreground mb-2">Gmail SMTP:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                <p>Host: smtp.gmail.com</p>
                <p>Port: 587</p>
                <p>TLS: Açık</p>
                <p className="text-orange-600 mt-2">Not: Gmail için App Password gereklidir</p>
              </div>
            </div>

            {/* Corporate */}
            <div>
              <p className="font-medium text-foreground mb-2">Kurumsal E-posta (Örnek):</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                <p>Host: mail.sirketiniz.com</p>
                <p>Port: 587 veya 465 (SSL için)</p>
                <p>TLS: Açık (veya SSL için 465 portu)</p>
              </div>
            </div>

            {/* Outlook/Microsoft 365 */}
            <div>
              <p className="font-medium text-foreground mb-2">Outlook / Microsoft 365:</p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                <p>Host: smtp.office365.com</p>
                <p>Port: 587</p>
                <p>TLS: Açık</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
