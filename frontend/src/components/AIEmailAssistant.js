import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sparkles, Mail, Copy, Send, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const texts = {
  en: {
    title: 'AI Email Assistant',
    subtitle: 'Generate professional emails with AI',
    emailType: 'Email Type',
    types: {
      introduction: 'Introduction',
      follow_up: 'Follow-up',
      quotation: 'Quotation/Offer',
      thank_you: 'Thank You',
      promotion: 'Promotion',
      reminder: 'Reminder'
    },
    customerName: 'Customer Name',
    companyName: 'Company Name',
    language: 'Email Language',
    context: 'Additional Context (Optional)',
    contextPlaceholder: 'Any specific details to include...',
    productInfo: 'Product Information (for quotations)',
    productPlaceholder: 'Product details, prices, quantities...',
    generate: 'Generate Email',
    generating: 'Generating...',
    regenerate: 'Regenerate',
    copySubject: 'Copy Subject',
    copyBody: 'Copy Body',
    copyAll: 'Copy All',
    copied: 'Copied!',
    generatedEmail: 'Generated Email',
    subject: 'Subject',
    body: 'Body',
    useEmail: 'Use This Email',
    error: 'Error',
    success: 'Email generated successfully!',
    fillRequired: 'Please fill customer and company name',
  },
  tr: {
    title: 'AI Email Asistanı',
    subtitle: 'AI ile profesyonel emailler oluşturun',
    emailType: 'Email Türü',
    types: {
      introduction: 'Tanışma',
      follow_up: 'Takip',
      quotation: 'Teklif',
      thank_you: 'Teşekkür',
      promotion: 'Promosyon',
      reminder: 'Hatırlatma'
    },
    customerName: 'Müşteri Adı',
    companyName: 'Şirket Adı',
    language: 'Email Dili',
    context: 'Ek Bilgi (İsteğe bağlı)',
    contextPlaceholder: 'Eklenecek özel detaylar...',
    productInfo: 'Ürün Bilgisi (teklifler için)',
    productPlaceholder: 'Ürün detayları, fiyatlar, miktarlar...',
    generate: 'Email Oluştur',
    generating: 'Oluşturuluyor...',
    regenerate: 'Yeniden Oluştur',
    copySubject: 'Konuyu Kopyala',
    copyBody: 'İçeriği Kopyala',
    copyAll: 'Tümünü Kopyala',
    copied: 'Kopyalandı!',
    generatedEmail: 'Oluşturulan Email',
    subject: 'Konu',
    body: 'İçerik',
    useEmail: 'Bu Emaili Kullan',
    error: 'Hata',
    success: 'Email başarıyla oluşturuldu!',
    fillRequired: 'Lütfen müşteri ve şirket adını doldurun',
  },
  de: {
    title: 'KI-E-Mail-Assistent',
    subtitle: 'Erstellen Sie professionelle E-Mails mit KI',
    emailType: 'E-Mail-Typ',
    types: {
      introduction: 'Einführung',
      follow_up: 'Nachverfolgung',
      quotation: 'Angebot',
      thank_you: 'Dankeschön',
      promotion: 'Promotion',
      reminder: 'Erinnerung'
    },
    customerName: 'Kundenname',
    companyName: 'Firmenname',
    language: 'E-Mail-Sprache',
    context: 'Zusätzlicher Kontext (Optional)',
    contextPlaceholder: 'Spezifische Details...',
    productInfo: 'Produktinformation (für Angebote)',
    productPlaceholder: 'Produktdetails, Preise, Mengen...',
    generate: 'E-Mail generieren',
    generating: 'Generiert...',
    regenerate: 'Neu generieren',
    copySubject: 'Betreff kopieren',
    copyBody: 'Inhalt kopieren',
    copyAll: 'Alles kopieren',
    copied: 'Kopiert!',
    generatedEmail: 'Generierte E-Mail',
    subject: 'Betreff',
    body: 'Inhalt',
    useEmail: 'Diese E-Mail verwenden',
    error: 'Fehler',
    success: 'E-Mail erfolgreich generiert!',
    fillRequired: 'Bitte füllen Sie Kunden- und Firmennamen aus',
  },
  pl: {
    title: 'Asystent e-mail AI',
    subtitle: 'Twórz profesjonalne e-maile z AI',
    emailType: 'Typ e-maila',
    types: {
      introduction: 'Wprowadzenie',
      follow_up: 'Kontynuacja',
      quotation: 'Oferta',
      thank_you: 'Podziękowanie',
      promotion: 'Promocja',
      reminder: 'Przypomnienie'
    },
    customerName: 'Nazwa klienta',
    companyName: 'Nazwa firmy',
    language: 'Język e-maila',
    context: 'Dodatkowy kontekst (opcjonalnie)',
    contextPlaceholder: 'Szczegóły do uwzględnienia...',
    productInfo: 'Informacje o produkcie (dla ofert)',
    productPlaceholder: 'Szczegóły produktu, ceny, ilości...',
    generate: 'Generuj e-mail',
    generating: 'Generowanie...',
    regenerate: 'Regeneruj',
    copySubject: 'Kopiuj temat',
    copyBody: 'Kopiuj treść',
    copyAll: 'Kopiuj wszystko',
    copied: 'Skopiowano!',
    generatedEmail: 'Wygenerowany e-mail',
    subject: 'Temat',
    body: 'Treść',
    useEmail: 'Użyj tego e-maila',
    error: 'Błąd',
    success: 'E-mail wygenerowany pomyślnie!',
    fillRequired: 'Proszę wypełnić nazwę klienta i firmy',
  }
};

const AIEmailAssistant = ({ isOpen, onClose, onUseEmail, lead = null }) => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  
  const [emailType, setEmailType] = useState('introduction');
  const [customerName, setCustomerName] = useState(lead?.company_name || '');
  const [companyName, setCompanyName] = useState('Gewürzberg GmbH');
  const [emailLang, setEmailLang] = useState(language);
  const [context, setContext] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState(null);

  const generateEmail = async () => {
    if (!customerName.trim() || !companyName.trim()) {
      toast.error(t.error, { description: t.fillRequired });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/ai/email/generate`, {
        email_type: emailType,
        customer_name: customerName,
        company_name: companyName,
        language: emailLang,
        context: context,
        product_info: productInfo
      });

      if (response.data.success) {
        setGeneratedEmail(response.data);
        toast.success(t.success);
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Email generation error:', error);
      toast.error(t.error, { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(t.copied, { description: label });
  };

  const handleUseEmail = () => {
    if (generatedEmail && onUseEmail) {
      onUseEmail({
        subject: generatedEmail.subject,
        body: generatedEmail.body
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Manrope'] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            {t.title}
          </DialogTitle>
          <DialogDescription>{t.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left: Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.emailType}</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.types).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.customerName} *</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ACME Industries GmbH"
              />
            </div>

            <div className="space-y-2">
              <Label>{t.companyName} *</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Gewürzberg GmbH"
              />
            </div>

            <div className="space-y-2">
              <Label>{t.language}</Label>
              <Select value={emailLang} onValueChange={setEmailLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t.context}</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder={t.contextPlaceholder}
                rows={2}
              />
            </div>

            {(emailType === 'quotation' || emailType === 'promotion') && (
              <div className="space-y-2">
                <Label>{t.productInfo}</Label>
                <Textarea
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  placeholder={t.productPlaceholder}
                  rows={2}
                />
              </div>
            )}

            <Button
              onClick={generateEmail}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.generating}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generatedEmail ? t.regenerate : t.generate}
                </>
              )}
            </Button>
          </div>

          {/* Right: Generated Email */}
          <div className="space-y-4">
            {generatedEmail ? (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-600" />
                      {t.generatedEmail}
                    </span>
                    <Badge className="bg-purple-600">AI</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t.subject}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedEmail.subject, t.subject)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-sm font-medium">
                      {generatedEmail.subject}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t.body}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(generatedEmail.body, t.body)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {generatedEmail.body}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyToClipboard(
                        `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`,
                        'Email'
                      )}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {t.copyAll}
                    </Button>
                    {onUseEmail && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleUseEmail}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {t.useEmail}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                <div className="text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>AI-generated email will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIEmailAssistant;
