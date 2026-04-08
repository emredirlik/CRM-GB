import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileDown, Calendar as CalendarIcon, MapPin, Clock, CheckCircle, Building2, Mail, Send, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr, de, enUS, pl } from 'date-fns/locale';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Multi-language visit types
const getVisitTypes = (lang) => {
  const types = {
    en: [
      { value: 'meeting', label: 'Meeting' },
      { value: 'delivery', label: 'Delivery' },
      { value: 'support', label: 'Support' },
      { value: 'sales', label: 'Sales Visit' },
      { value: 'follow_up', label: 'Follow-up' },
      { value: 'other', label: 'Other' }
    ],
    tr: [
      { value: 'meeting', label: 'Toplantı' },
      { value: 'delivery', label: 'Teslimat' },
      { value: 'support', label: 'Destek' },
      { value: 'sales', label: 'Satış Ziyareti' },
      { value: 'follow_up', label: 'Takip' },
      { value: 'other', label: 'Diğer' }
    ],
    de: [
      { value: 'meeting', label: 'Besprechung' },
      { value: 'delivery', label: 'Lieferung' },
      { value: 'support', label: 'Support' },
      { value: 'sales', label: 'Verkaufsbesuch' },
      { value: 'follow_up', label: 'Nachverfolgung' },
      { value: 'other', label: 'Sonstige' }
    ],
    pl: [
      { value: 'meeting', label: 'Spotkanie' },
      { value: 'delivery', label: 'Dostawa' },
      { value: 'support', label: 'Wsparcie' },
      { value: 'sales', label: 'Wizyta handlowa' },
      { value: 'follow_up', label: 'Kontynuacja' },
      { value: 'other', label: 'Inne' }
    ]
  };
  return types[lang] || types.en;
};

// Multi-language texts
const texts = {
  en: {
    title: 'Daily Reports',
    subtitle: 'Customer visits and daily activities',
    addReport: 'Add Report',
    selectDate: 'Select Date',
    reports: 'reports',
    reportsFor: 'Reports for',
    downloadAll: 'Download All',
    emailAll: 'Email All',
    noReports: 'No reports for this date',
    noReportsHint: 'Click the button to add a new report',
    recentReports: 'Recent Reports',
    date: 'Date',
    customer: 'Customer',
    city: 'City',
    visitType: 'Visit Type',
    notes: 'Notes',
    actions: 'Actions',
    editReport: 'Edit Report',
    newReport: 'New Daily Report',
    reportFor: 'Report for',
    selectCustomer: 'Select customer',
    customerRequired: 'Customer *',
    notesRequired: 'Notes *',
    notesPlaceholder: 'What was done during the visit...',
    outcome: 'Outcome',
    outcomePlaceholder: 'Meeting result...',
    nextStep: 'Next Step',
    nextStepPlaceholder: 'To do...',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    deleteReport: 'Delete Report',
    deleteConfirm: 'Are you sure you want to delete this report?',
    delete: 'Delete',
    reportCreated: 'Report created',
    reportUpdated: 'Report updated',
    reportDeleted: 'Report deleted',
    pdfDownloaded: 'PDF downloaded',
    error: 'Error',
    customerNotesRequired: 'Customer and notes are required',
    couldNotSave: 'Could not save report',
    couldNotDelete: 'Could not delete report',
    couldNotDownload: 'Could not download PDF',
    noReportsToDownload: 'No reports for this date',
    reportsDownloaded: 'reports downloaded as PDF',
    emailDialogTitle: 'Email Daily Reports',
    emailDialogDesc: 'Send all reports for this date via email',
    recipientEmail: 'Recipient Email',
    emailSubject: 'Subject',
    emailMessage: 'Message',
    sendEmail: 'Send Email',
    sending: 'Sending...',
    emailSent: 'Email sent successfully',
    emailFailed: 'Failed to send email',
    emailRequired: 'Email address is required',
    noMonthlyReports: 'No reports for this month',
    monthlyDownloaded: 'reports downloaded as monthly PDF',
    downloadMonthlyReport: 'Download Monthly Report',
  },
  tr: {
    title: 'Günlük Raporlar',
    subtitle: 'Müşteri ziyaretleri ve günlük aktiviteler',
    addReport: 'Rapor Ekle',
    selectDate: 'Tarih Seç',
    reports: 'rapor',
    reportsFor: 'Raporları',
    downloadAll: 'Tümünü İndir',
    emailAll: 'E-posta Gönder',
    noReports: 'Bu tarihte rapor yok',
    noReportsHint: 'Yeni rapor eklemek için butona tıklayın',
    recentReports: 'Son Raporlar',
    date: 'Tarih',
    customer: 'Müşteri',
    city: 'Şehir',
    visitType: 'Ziyaret Türü',
    notes: 'Notlar',
    actions: 'İşlemler',
    editReport: 'Raporu Düzenle',
    newReport: 'Yeni Günlük Rapor',
    reportFor: 'için rapor',
    selectCustomer: 'Müşteri seçin',
    customerRequired: 'Müşteri *',
    notesRequired: 'Notlar *',
    notesPlaceholder: 'Ziyarette neler yapıldı...',
    outcome: 'Sonuç',
    outcomePlaceholder: 'Görüşme sonucu...',
    nextStep: 'Sonraki Adım',
    nextStepPlaceholder: 'Yapılacaklar...',
    cancel: 'İptal',
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    deleteReport: 'Raporu Sil',
    deleteConfirm: 'Bu raporu silmek istediğinize emin misiniz?',
    delete: 'Sil',
    reportCreated: 'Rapor oluşturuldu',
    reportUpdated: 'Rapor güncellendi',
    reportDeleted: 'Rapor silindi',
    pdfDownloaded: 'PDF indirildi',
    error: 'Hata',
    customerNotesRequired: 'Müşteri ve notlar zorunludur',
    couldNotSave: 'Rapor kaydedilemedi',
    couldNotDelete: 'Rapor silinemedi',
    couldNotDownload: 'PDF indirilemedi',
    noReportsToDownload: 'Bu tarihte rapor yok',
    reportsDownloaded: 'rapor PDF olarak indirildi',
    emailDialogTitle: 'Günlük Raporları E-posta ile Gönder',
    emailDialogDesc: 'Bu tarihteki tüm raporları e-posta ile gönder',
    recipientEmail: 'Alıcı E-posta',
    emailSubject: 'Konu',
    emailMessage: 'Mesaj',
    sendEmail: 'E-posta Gönder',
    sending: 'Gönderiliyor...',
    emailSent: 'E-posta başarıyla gönderildi',
    emailFailed: 'E-posta gönderilemedi',
    emailRequired: 'E-posta adresi zorunludur',
    noMonthlyReports: 'Bu ay için rapor yok',
    monthlyDownloaded: 'rapor aylık PDF olarak indirildi',
    downloadMonthlyReport: 'Aylık Rapor İndir',
  },
  de: {
    title: 'Tagesberichte',
    subtitle: 'Kundenbesuche und tägliche Aktivitäten',
    addReport: 'Bericht hinzufügen',
    selectDate: 'Datum wählen',
    reports: 'Berichte',
    reportsFor: 'Berichte für',
    downloadAll: 'Alle herunterladen',
    emailAll: 'Per E-Mail senden',
    noReports: 'Keine Berichte für dieses Datum',
    noReportsHint: 'Klicken Sie auf die Schaltfläche, um einen neuen Bericht hinzuzufügen',
    recentReports: 'Letzte Berichte',
    date: 'Datum',
    customer: 'Kunde',
    city: 'Stadt',
    visitType: 'Besuchsart',
    notes: 'Notizen',
    actions: 'Aktionen',
    editReport: 'Bericht bearbeiten',
    newReport: 'Neuer Tagesbericht',
    reportFor: 'Bericht für',
    selectCustomer: 'Kunde auswählen',
    customerRequired: 'Kunde *',
    notesRequired: 'Notizen *',
    notesPlaceholder: 'Was wurde während des Besuchs gemacht...',
    outcome: 'Ergebnis',
    outcomePlaceholder: 'Besprechungsergebnis...',
    nextStep: 'Nächster Schritt',
    nextStepPlaceholder: 'Zu erledigen...',
    cancel: 'Abbrechen',
    save: 'Speichern',
    saving: 'Speichern...',
    deleteReport: 'Bericht löschen',
    deleteConfirm: 'Sind Sie sicher, dass Sie diesen Bericht löschen möchten?',
    delete: 'Löschen',
    reportCreated: 'Bericht erstellt',
    reportUpdated: 'Bericht aktualisiert',
    reportDeleted: 'Bericht gelöscht',
    pdfDownloaded: 'PDF heruntergeladen',
    error: 'Fehler',
    customerNotesRequired: 'Kunde und Notizen sind erforderlich',
    couldNotSave: 'Bericht konnte nicht gespeichert werden',
    couldNotDelete: 'Bericht konnte nicht gelöscht werden',
    couldNotDownload: 'PDF konnte nicht heruntergeladen werden',
    noReportsToDownload: 'Keine Berichte für dieses Datum',
    reportsDownloaded: 'Berichte als PDF heruntergeladen',
    emailDialogTitle: 'Tagesberichte per E-Mail senden',
    emailDialogDesc: 'Alle Berichte für dieses Datum per E-Mail senden',
    recipientEmail: 'Empfänger-E-Mail',
    emailSubject: 'Betreff',
    emailMessage: 'Nachricht',
    sendEmail: 'E-Mail senden',
    sending: 'Senden...',
    emailSent: 'E-Mail erfolgreich gesendet',
    emailFailed: 'E-Mail konnte nicht gesendet werden',
    emailRequired: 'E-Mail-Adresse ist erforderlich',
    noMonthlyReports: 'Keine Berichte für diesen Monat',
    monthlyDownloaded: 'Berichte als monatliches PDF heruntergeladen',
    downloadMonthlyReport: 'Monatsbericht herunterladen',
  },
  pl: {
    title: 'Raporty dzienne',
    subtitle: 'Wizyty u klientów i codzienne aktywności',
    addReport: 'Dodaj raport',
    selectDate: 'Wybierz datę',
    reports: 'raporty',
    reportsFor: 'Raporty za',
    downloadAll: 'Pobierz wszystko',
    emailAll: 'Wyślij e-mail',
    noReports: 'Brak raportów na ten dzień',
    noReportsHint: 'Kliknij przycisk, aby dodać nowy raport',
    recentReports: 'Ostatnie raporty',
    date: 'Data',
    customer: 'Klient',
    city: 'Miasto',
    visitType: 'Typ wizyty',
    notes: 'Notatki',
    actions: 'Akcje',
    editReport: 'Edytuj raport',
    newReport: 'Nowy raport dzienny',
    reportFor: 'Raport za',
    selectCustomer: 'Wybierz klienta',
    customerRequired: 'Klient *',
    notesRequired: 'Notatki *',
    notesPlaceholder: 'Co zostało zrobione podczas wizyty...',
    outcome: 'Wynik',
    outcomePlaceholder: 'Wynik spotkania...',
    nextStep: 'Następny krok',
    nextStepPlaceholder: 'Do zrobienia...',
    cancel: 'Anuluj',
    save: 'Zapisz',
    saving: 'Zapisywanie...',
    deleteReport: 'Usuń raport',
    deleteConfirm: 'Czy na pewno chcesz usunąć ten raport?',
    delete: 'Usuń',
    reportCreated: 'Raport utworzony',
    reportUpdated: 'Raport zaktualizowany',
    reportDeleted: 'Raport usunięty',
    pdfDownloaded: 'PDF pobrany',
    error: 'Błąd',
    customerNotesRequired: 'Klient i notatki są wymagane',
    couldNotSave: 'Nie można zapisać raportu',
    couldNotDelete: 'Nie można usunąć raportu',
    couldNotDownload: 'Nie można pobrać PDF',
    noReportsToDownload: 'Brak raportów na ten dzień',
    reportsDownloaded: 'raporty pobrane jako PDF',
    emailDialogTitle: 'Wyślij raporty dzienne e-mailem',
    emailDialogDesc: 'Wyślij wszystkie raporty za ten dzień e-mailem',
    recipientEmail: 'E-mail odbiorcy',
    emailSubject: 'Temat',
    emailMessage: 'Wiadomość',
    sendEmail: 'Wyślij e-mail',
    sending: 'Wysyłanie...',
    emailSent: 'E-mail wysłany pomyślnie',
    emailFailed: 'Nie udało się wysłać e-maila',
    emailRequired: 'Adres e-mail jest wymagany',
    noMonthlyReports: 'Brak raportów za ten miesiąc',
    monthlyDownloaded: 'raporty pobrane jako miesięczny PDF',
    downloadMonthlyReport: 'Pobierz raport miesięczny',
  }
};

const DailyReports = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  const visitTypes = getVisitTypes(language);
  
  const getLocale = () => {
    switch(language) {
      case 'tr': return tr;
      case 'de': return de;
      case 'pl': return pl;
      default: return enUS;
    }
  };

  const [reports, setReports] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Form data
  const [formLeadId, setFormLeadId] = useState('');
  const [formVisitType, setFormVisitType] = useState('meeting');
  const [formNotes, setFormNotes] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formNextAction, setFormNextAction] = useState('');
  
  // Email form
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchReportsByDate(selectedDate);
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [reportsRes, leadsRes] = await Promise.all([
        axios.get(`${API}/daily-reports`),
        axios.get(`${API}/leads`)
      ]);
      setReports(reportsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportsByDate = async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await axios.get(`${API}/daily-reports/by-date/${dateStr}`);
    } catch (error) {
      console.error('Failed to fetch reports by date:', error);
    }
  };

  const getReportsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return reports.filter(r => r.date === dateStr);
  };

  const getDatesWithReports = () => {
    const dates = new Set();
    reports.forEach(r => {
      if (r.date) {
        dates.add(r.date);
      }
    });
    return Array.from(dates).map(d => parseISO(d));
  };

  const openAddDialog = () => {
    setSelectedReport(null);
    setFormLeadId('');
    setFormVisitType('meeting');
    setFormNotes('');
    setFormOutcome('');
    setFormNextAction('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (report) => {
    setSelectedReport(report);
    setFormLeadId(report.lead_id);
    setFormVisitType(report.visit_type);
    setFormNotes(report.notes);
    setFormOutcome(report.outcome || '');
    setFormNextAction(report.next_action || '');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (report) => {
    setSelectedReport(report);
    setIsDeleteDialogOpen(true);
  };

  const openEmailDialog = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateReports = getReportsForDate(selectedDate);
    
    if (dateReports.length === 0) {
      toast.error(t.error, { description: t.noReportsToDownload });
      return;
    }
    
    setEmailTo('');
    setEmailSubject(`Daily Reports - ${dateStr}`);
    setEmailMessage(`Please find attached the daily visit reports for ${dateStr}.\n\nTotal visits: ${dateReports.length}`);
    setIsEmailDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formLeadId || !formNotes) {
      toast.error(t.error, { description: t.customerNotesRequired });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        lead_id: formLeadId,
        visit_type: formVisitType,
        notes: formNotes,
        outcome: formOutcome || null,
        next_action: formNextAction || null
      };

      if (selectedReport) {
        await axios.put(`${API}/daily-reports/${selectedReport.id}`, {
          visit_type: formVisitType,
          notes: formNotes,
          outcome: formOutcome || null,
          next_action: formNextAction || null
        });
        toast.success(t.reportUpdated);
      } else {
        await axios.post(`${API}/daily-reports`, payload);
        toast.success(t.reportCreated);
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t.error, { description: t.couldNotSave });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/daily-reports/${selectedReport.id}`);
      toast.success(t.reportDeleted);
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t.error, { description: t.couldNotDelete });
    }
  };

  const downloadPdf = async (reportId) => {
    try {
      const response = await axios.get(`${API}/daily-reports/${reportId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t.pdfDownloaded);
    } catch (error) {
      toast.error(t.error, { description: t.couldNotDownload });
    }
  };

  const downloadDailyPdf = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateReports = getReportsForDate(selectedDate);
    
    if (dateReports.length === 0) {
      toast.error(t.error, { description: t.noReportsToDownload });
      return;
    }

    try {
      const response = await axios.get(`${API}/daily-reports/date/${dateStr}/pdf?lang=${language}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daily_reports_${dateStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${dateReports.length} ${t.reportsDownloaded}`);
    } catch (error) {
      toast.error(t.error, { description: t.couldNotDownload });
    }
  };

  const downloadMonthlyPdf = async () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Filter reports for the current month
    const monthReports = reports.filter(r => r.date && r.date.startsWith(monthStr));
    
    if (monthReports.length === 0) {
      toast.error(t.error, { description: t.noMonthlyReports });
      return;
    }

    try {
      const response = await axios.get(`${API}/daily-reports/month/${year}/${month}/pdf?lang=${language}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `monthly_reports_${monthStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${monthReports.length} ${t.monthlyDownloaded}`);
    } catch (error) {
      toast.error(t.error, { description: t.couldNotDownload });
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast.error(t.error, { description: t.emailRequired });
      return;
    }

    setSendingEmail(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const pdfResponse = await axios.get(`${API}/daily-reports/date/${dateStr}/pdf?lang=${language}`, {
        responseType: 'blob'
      });
      
      const formData = new FormData();
      formData.append('to', emailTo);
      formData.append('subject', emailSubject);
      formData.append('body', `<p>${emailMessage}</p>`);
      formData.append('attachments', new Blob([pdfResponse.data], { type: 'application/pdf' }), `rapor_${dateStr}.pdf`);
      
      const response = await axios.post(`${API}/mail/send-to-drafts`, formData);
      toast.success(response.data.message);
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast.error(t.error, { description: error.response?.data?.detail || t.emailFailed });
    } finally {
      setSendingEmail(false);
    }
  };

  const getVisitTypeLabel = (value) => {
    return visitTypes.find(t => t.value === value)?.label || value;
  };

  const getVisitTypeColor = (type) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-700';
      case 'delivery': return 'bg-green-100 text-green-700';
      case 'support': return 'bg-orange-100 text-orange-700';
      case 'sales': return 'bg-purple-100 text-purple-700';
      case 'follow_up': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const selectedDateReports = getReportsForDate(selectedDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="reports-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="daily-reports-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-report-btn">
          <Plus className="w-4 h-4 mr-2" />
          {t.addReport}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
              {t.selectDate}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={getLocale()}
              className="rounded-md border"
              modifiers={{
                hasReport: getDatesWithReports()
              }}
              modifiersStyles={{
                hasReport: { 
                  backgroundColor: '#fed7aa',
                  borderRadius: '50%'
                }
              }}
            />
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold">
                {format(selectedDate, 'PPP', { locale: getLocale() })}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedDateReports.length} {t.reports}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {t.reportsFor} {format(selectedDate, 'PP', { locale: getLocale() })}
              </CardTitle>
              {selectedDateReports.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadDailyPdf}>
                    <FileDown className="w-4 h-4 mr-2" />
                    {t.downloadAll}
                  </Button>
                  <Button variant="outline" size="sm" onClick={openEmailDialog}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t.emailAll}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t.noReports}</p>
                <p className="text-sm mt-1">{t.noReportsHint}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateReports.map((report) => (
                  <div key={report.id} className="p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{report.company_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {report.city}
                        </div>
                      </div>
                      <Badge className={getVisitTypeColor(report.visit_type)}>
                        {getVisitTypeLabel(report.visit_type)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm mb-3">{report.notes}</p>
                    
                    {report.outcome && (
                      <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>{report.outcome}</span>
                      </div>
                    )}
                    
                    {report.next_action && (
                      <div className="text-sm text-orange-600 mb-2">
                        <strong>{t.nextStep}:</strong> {report.next_action}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-end gap-1 pt-3 border-t">
                      <Button variant="ghost" size="sm" onClick={() => downloadPdf(report.id)}>
                        <FileDown className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(report)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(report)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Reports Summary - Card View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t.recentReports}</CardTitle>
            <Button variant="outline" size="sm" onClick={downloadMonthlyPdf}>
              <FileDown className="w-4 h-4 mr-2" />
                            {t.downloadMonthlyReport}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.noReports}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 10).map((report) => (
                <div key={report.id} className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <CalendarIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{report.company_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{report.date}</span>
                          <span>•</span>
                          <MapPin className="w-3 h-3" />
                          <span>{report.city}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={getVisitTypeColor(report.visit_type)}>
                      {getVisitTypeLabel(report.visit_type)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2 pl-13">{report.notes}</p>
                  
                  <div className="flex items-center justify-end gap-1 pt-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => downloadPdf(report.id)} className="h-8 w-8 p-0">
                      <FileDown className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(report)} className="h-8 w-8 p-0">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(report)} className="h-8 w-8 p-0 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedReport ? t.editReport : t.newReport}
            </DialogTitle>
            <DialogDescription>
              {t.reportFor} {format(selectedDate, 'PPP', { locale: getLocale() })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.customerRequired}</Label>
              <Select value={formLeadId} onValueChange={setFormLeadId} disabled={!!selectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectCustomer} />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name} - {lead.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t.visitType}</Label>
              <Select value={formVisitType} onValueChange={setFormVisitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visitTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t.notesRequired}</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={4}
                placeholder={t.notesPlaceholder}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t.outcome}</Label>
              <Input
                value={formOutcome}
                onChange={(e) => setFormOutcome(e.target.value)}
                placeholder={t.outcomePlaceholder}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t.nextStep}</Label>
              <Input
                value={formNextAction}
                onChange={(e) => setFormNextAction(e.target.value)}
                placeholder={t.nextStepPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope'] flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              {t.emailDialogTitle}
            </DialogTitle>
            <DialogDescription>{t.emailDialogDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-700">
                {format(selectedDate, 'PPP', { locale: getLocale() })} - {selectedDateReports.length} {t.reports}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>{t.recipientEmail} *</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t.emailSubject}</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t.emailMessage}</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t.sendEmail}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteReport}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DailyReports;
