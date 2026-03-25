import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSMTPSettings, saveSMTPSettings, testSMTPConnection } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Mail, TestTube, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';

const Settings = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    use_tls: true
  });

  useEffect(() => {
    fetchSettings();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
        <p className="text-muted-foreground mt-1">Configure your email sending preferences</p>
      </div>

      {/* SMTP Settings Card */}
      <Card data-testid="smtp-settings-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="font-['Manrope']">{t('smtpSettings')}</CardTitle>
              <CardDescription>Configure your SMTP server to send emails</CardDescription>
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
                placeholder="smtp.gmail.com"
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
                placeholder="your-email@gmail.com"
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
                placeholder="App password"
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
                placeholder="info@yourcompany.com"
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
                placeholder="Berlin Spice Factory"
                data-testid="input-from-name"
              />
            </div>
          </div>

          {/* TLS Switch */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="use_tls" className="text-base font-medium">{t('useTLS')}</Label>
              <p className="text-sm text-muted-foreground">Use TLS encryption for secure connection</p>
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
                  Testing...
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
                  Saving...
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
          <h3 className="font-semibold font-['Manrope'] mb-3">Gmail SMTP Setup</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>To use Gmail SMTP, you need to:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Enable 2-Step Verification in your Google Account</li>
              <li>Generate an App Password at: <code className="text-xs bg-muted px-1 py-0.5 rounded">myaccount.google.com/apppasswords</code></li>
              <li>Use the following settings:</li>
            </ol>
            <div className="bg-muted p-3 rounded-md mt-2 font-mono text-xs">
              <p>Host: smtp.gmail.com</p>
              <p>Port: 587</p>
              <p>TLS: Enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
