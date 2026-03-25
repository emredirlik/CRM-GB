import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeads, generateEmail, sendEmail, getTemplates } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Sparkles, Send, Eye, Loader2, Users, FileText } from 'lucide-react';

const EmailComposer = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [leads, setLeads] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [emailLanguage, setEmailLanguage] = useState(language);
  const [tone, setTone] = useState('professional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Set selected lead from navigation state
    if (location.state?.selectedLead) {
      setSelectedLeadId(location.state.selectedLead.id);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      const [leadsRes, templatesRes] = await Promise.all([
        getLeads(),
        getTemplates()
      ]);
      setLeads(leadsRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setEmailLanguage(template.language);
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedLeadId) {
      toast.error(t('error'), { description: 'Please select a lead first' });
      return;
    }

    setGenerating(true);
    try {
      const response = await generateEmail({
        lead_id: selectedLeadId,
        language: emailLanguage,
        tone: tone
      });
      setSubject(response.data.subject);
      setBody(response.data.body);
      toast.success(t('success'), { description: 'Email generated successfully' });
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Failed to generate email' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedLeadId) {
      toast.error(t('error'), { description: 'Please select a lead' });
      return;
    }
    if (!subject || !body) {
      toast.error(t('error'), { description: 'Please fill in subject and body' });
      return;
    }

    setSending(true);
    try {
      await sendEmail({
        lead_id: selectedLeadId,
        subject: subject,
        body: body
      });
      toast.success(t('success'), { description: t('emailQueued') });
      // Reset form
      setSubject('');
      setBody('');
      setSelectedLeadId('');
      setSelectedTemplateId('');
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Failed to send email' });
    } finally {
      setSending(false);
    }
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="composer-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="email-composer-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('emailComposer')}</h1>
        <p className="text-muted-foreground mt-1">Create and send personalized emails to your leads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          {/* Lead Selection */}
          <Card data-testid="lead-selection-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('selectLead')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger data-testid="select-lead">
                  <SelectValue placeholder={t('selectLead')} />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name} - {lead.first_name} {lead.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedLead && (
                <div className="mt-4 p-3 bg-muted rounded-md text-sm space-y-1">
                  <p><strong>{selectedLead.company_name}</strong></p>
                  <p>{selectedLead.first_name} {selectedLead.last_name}</p>
                  <p className="text-muted-foreground">{selectedLead.email}</p>
                  <p className="text-muted-foreground">{selectedLead.city}, {selectedLead.country}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card data-testid="template-selection-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Use Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.language.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* AI Generation */}
          <Card data-testid="ai-generation-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-['Manrope'] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('generateWithAI')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('language')}</Label>
                <Select value={emailLanguage} onValueChange={setEmailLanguage}>
                  <SelectTrigger data-testid="select-email-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('tone')}</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger data-testid="select-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">{t('professional')}</SelectItem>
                    <SelectItem value="friendly">{t('friendly')}</SelectItem>
                    <SelectItem value="formal">{t('formal')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerateAI} 
                disabled={!selectedLeadId || generating}
                className="w-full"
                data-testid="generate-ai-btn"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('generateWithAI')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Email Editor */}
        <div className="lg:col-span-2">
          <Card className="h-full" data-testid="email-editor-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-['Manrope']">Email Content</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    data-testid="preview-btn"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('preview')}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSend}
                    disabled={sending || !selectedLeadId || !subject || !body}
                    data-testid="send-email-btn"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t('send')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showPreview ? (
                <div className="border rounded-lg p-6 bg-white min-h-[400px]" data-testid="email-preview">
                  <div className="border-b pb-4 mb-4">
                    <p className="text-sm text-muted-foreground">To: {selectedLead?.email || 'Select a lead'}</p>
                    <p className="text-lg font-semibold mt-2">{subject || 'No subject'}</p>
                  </div>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {body || 'No content'}
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('emailSubject')}</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter email subject"
                      data-testid="input-email-subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">{t('emailBody')}</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={16}
                      placeholder="Enter email content..."
                      className="font-['Inter'] text-sm"
                      data-testid="input-email-body"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailComposer;
