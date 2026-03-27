import React, { useEffect, useState } from 'react';
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
import { Plus, Pencil, Trash2, FileDown, Calendar as CalendarIcon, MapPin, Clock, CheckCircle, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const visitTypes = [
  { value: 'meeting', label: 'Toplantı' },
  { value: 'delivery', label: 'Teslimat' },
  { value: 'support', label: 'Destek' },
  { value: 'sales', label: 'Satış Ziyareti' },
  { value: 'follow_up', label: 'Takip' },
  { value: 'other', label: 'Diğer' }
];

const DailyReports = () => {
  const [reports, setReports] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [formLeadId, setFormLeadId] = useState('');
  const [formVisitType, setFormVisitType] = useState('meeting');
  const [formNotes, setFormNotes] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formNextAction, setFormNextAction] = useState('');

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
      // Update reports for selected date
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

  const handleSave = async () => {
    if (!formLeadId || !formNotes) {
      toast.error('Hata', { description: 'Müşteri ve notlar zorunludur' });
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
        toast.success('Rapor güncellendi');
      } else {
        await axios.post(`${API}/daily-reports`, payload);
        toast.success('Rapor oluşturuldu');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: 'Rapor kaydedilemedi' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/daily-reports/${selectedReport.id}`);
      toast.success('Rapor silindi');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: 'Rapor silinemedi' });
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
      link.setAttribute('download', `gunluk_rapor_${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF indirildi');
    } catch (error) {
      toast.error('Hata', { description: 'PDF indirilemedi' });
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
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Günlük Raporlar</h1>
          <p className="text-muted-foreground mt-1">Müşteri ziyaretleri ve günlük aktiviteler</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-report-btn">
          <Plus className="w-4 h-4 mr-2" />
          Rapor Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
              Tarih Seç
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={tr}
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
                {format(selectedDate, 'dd MMMM yyyy', { locale: tr })}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedDateReports.length} rapor
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
                {format(selectedDate, 'dd MMMM yyyy', { locale: tr })} Raporları
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Bu tarihte rapor yok</p>
                <p className="text-sm mt-1">Yeni rapor eklemek için butona tıklayın</p>
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
                        <strong>Sonraki Adım:</strong> {report.next_action}
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

      {/* All Reports Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Son Raporlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Müşteri</th>
                  <th>Şehir</th>
                  <th>Ziyaret Türü</th>
                  <th>Notlar</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 10).map((report) => (
                  <tr key={report.id}>
                    <td className="font-medium">{report.date}</td>
                    <td>{report.company_name}</td>
                    <td>{report.city}</td>
                    <td>
                      <Badge className={getVisitTypeColor(report.visit_type)}>
                        {getVisitTypeLabel(report.visit_type)}
                      </Badge>
                    </td>
                    <td className="max-w-xs truncate">{report.notes}</td>
                    <td>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => downloadPdf(report.id)}>
                          <FileDown className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(report)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedReport ? 'Raporu Düzenle' : 'Yeni Günlük Rapor'}
            </DialogTitle>
            <DialogDescription>
              {format(selectedDate, 'dd MMMM yyyy', { locale: tr })} için rapor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Müşteri *</Label>
              <Select value={formLeadId} onValueChange={setFormLeadId} disabled={!!selectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
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
              <Label>Ziyaret Türü</Label>
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
              <Label>Notlar *</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={4}
                placeholder="Ziyarette neler yapıldı..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sonuç</Label>
              <Input
                value={formOutcome}
                onChange={(e) => setFormOutcome(e.target.value)}
                placeholder="Görüşme sonucu..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sonraki Adım</Label>
              <Input
                value={formNextAction}
                onChange={(e) => setFormNextAction(e.target.value)}
                placeholder="Yapılacaklar..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Raporu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu raporu silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DailyReports;
