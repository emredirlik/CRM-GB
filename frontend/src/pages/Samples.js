import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Package, Plus, Search, MoreVertical, Edit, Trash2, 
  Send, CheckCircle, Clock, XCircle, Filter, Download,
  Building2, Calendar, User, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SAMPLE_STATUS = {
  pending: { label: 'Beklemede', labelDe: 'Ausstehend', labelEn: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  sent: { label: 'Gönderildi', labelDe: 'Gesendet', labelEn: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  delivered: { label: 'Teslim Edildi', labelDe: 'Zugestellt', labelEn: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'İptal', labelDe: 'Storniert', labelEn: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const Samples = () => {
  const { language } = useLanguage();
  const [samples, setSamples] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSample, setEditingSample] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    products: '',
    quantity: '',
    shipping_date: '',
    tracking_number: '',
    status: 'pending',
    notes: ''
  });

  const t = (key) => {
    const texts = {
      tr: {
        title: 'Numuneler',
        subtitle: 'Müşterilere gönderilen numuneleri takip edin',
        addSample: 'Yeni Numune',
        customer: 'Müşteri',
        products: 'Ürünler',
        quantity: 'Miktar',
        shippingDate: 'Gönderim Tarihi',
        trackingNumber: 'Takip No',
        status: 'Durum',
        notes: 'Notlar',
        search: 'Numune ara...',
        allStatus: 'Tüm Durumlar',
        save: 'Kaydet',
        cancel: 'İptal',
        edit: 'Düzenle',
        delete: 'Sil',
        noSamples: 'Henüz numune kaydı yok',
        addFirst: 'İlk numuneyi ekleyin',
        totalSamples: 'Toplam Numune',
        pendingSamples: 'Bekleyen',
        sentSamples: 'Gönderilen',
        deliveredSamples: 'Teslim Edilen',
        selectCustomer: 'Müşteri seçin',
        productsPlaceholder: 'Döner 10kg, Gyros 5kg...',
        exportExcel: 'Excel İndir',
      },
      de: {
        title: 'Muster',
        subtitle: 'Verfolgen Sie die an Kunden gesendeten Muster',
        addSample: 'Neues Muster',
        customer: 'Kunde',
        products: 'Produkte',
        quantity: 'Menge',
        shippingDate: 'Versanddatum',
        trackingNumber: 'Tracking-Nr.',
        status: 'Status',
        notes: 'Notizen',
        search: 'Muster suchen...',
        allStatus: 'Alle Status',
        save: 'Speichern',
        cancel: 'Abbrechen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        noSamples: 'Noch keine Muster',
        addFirst: 'Fügen Sie das erste Muster hinzu',
        totalSamples: 'Gesamt Muster',
        pendingSamples: 'Ausstehend',
        sentSamples: 'Gesendet',
        deliveredSamples: 'Zugestellt',
        selectCustomer: 'Kunde auswählen',
        productsPlaceholder: 'Döner 10kg, Gyros 5kg...',
        exportExcel: 'Excel Export',
      },
      en: {
        title: 'Samples',
        subtitle: 'Track samples sent to customers',
        addSample: 'New Sample',
        customer: 'Customer',
        products: 'Products',
        quantity: 'Quantity',
        shippingDate: 'Shipping Date',
        trackingNumber: 'Tracking No',
        status: 'Status',
        notes: 'Notes',
        search: 'Search samples...',
        allStatus: 'All Status',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        delete: 'Delete',
        noSamples: 'No samples yet',
        addFirst: 'Add the first sample',
        totalSamples: 'Total Samples',
        pendingSamples: 'Pending',
        sentSamples: 'Sent',
        deliveredSamples: 'Delivered',
        selectCustomer: 'Select customer',
        productsPlaceholder: 'Döner 10kg, Gyros 5kg...',
        exportExcel: 'Export Excel',
      }
    };
    return texts[language]?.[key] || texts.tr[key] || key;
  };

  const getStatusLabel = (status) => {
    const s = SAMPLE_STATUS[status];
    if (!s) return status;
    if (language === 'de') return s.labelDe;
    if (language === 'en') return s.labelEn;
    return s.label;
  };

  const fetchSamples = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/samples`);
      setSamples(response.data || []);
    } catch (error) {
      console.error('Error fetching samples:', error);
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/customers`);
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  useEffect(() => {
    fetchSamples();
    fetchCustomers();
  }, [fetchSamples, fetchCustomers]);

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.products) {
      toast.error(language === 'de' ? 'Bitte füllen Sie alle Pflichtfelder aus' : 'Lütfen gerekli alanları doldurun');
      return;
    }

    try {
      const selectedCustomer = customers.find(c => c.id === formData.customer_id);
      const payload = {
        ...formData,
        customer_name: selectedCustomer?.company_name || formData.customer_name
      };

      if (editingSample) {
        await axios.put(`${API}/samples/${editingSample.id}`, payload);
        toast.success(language === 'de' ? 'Muster aktualisiert' : 'Numune güncellendi');
      } else {
        await axios.post(`${API}/samples`, payload);
        toast.success(language === 'de' ? 'Muster hinzugefügt' : 'Numune eklendi');
      }
      
      setIsDialogOpen(false);
      setEditingSample(null);
      resetForm();
      fetchSamples();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Speichern' : 'Kaydetme hatası');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(language === 'de' ? 'Möchten Sie dieses Muster löschen?' : 'Bu numuneyi silmek istiyor musunuz?')) return;
    
    try {
      await axios.delete(`${API}/samples/${id}`);
      toast.success(language === 'de' ? 'Muster gelöscht' : 'Numune silindi');
      fetchSamples();
    } catch (error) {
      toast.error(language === 'de' ? 'Fehler beim Löschen' : 'Silme hatası');
    }
  };

  const handleEdit = (sample) => {
    setEditingSample(sample);
    setFormData({
      customer_id: sample.customer_id || '',
      customer_name: sample.customer_name || '',
      products: sample.products || '',
      quantity: sample.quantity || '',
      shipping_date: sample.shipping_date || '',
      tracking_number: sample.tracking_number || '',
      status: sample.status || 'pending',
      notes: sample.notes || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      customer_name: '',
      products: '',
      quantity: '',
      shipping_date: '',
      tracking_number: '',
      status: 'pending',
      notes: ''
    });
  };

  const filteredSamples = samples.filter(sample => {
    const matchesSearch = 
      sample.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.products?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sample.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: samples.length,
    pending: samples.filter(s => s.status === 'pending').length,
    sent: samples.filter(s => s.status === 'sent').length,
    delivered: samples.filter(s => s.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto" data-testid="samples-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>
        
        <Button 
          onClick={() => { resetForm(); setEditingSample(null); setIsDialogOpen(true); }}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addSample')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-700 to-slate-800 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 opacity-70" />
              <span className="text-sm opacity-80">{t('totalSamples')}</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">{t('pendingSamples')}</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">{t('sentSamples')}</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">{t('deliveredSamples')}</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t('allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            {Object.entries(SAMPLE_STATUS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{getStatusLabel(key)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredSamples.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noSamples')}</h3>
            <p className="text-muted-foreground mb-4">{t('addFirst')}</p>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              {t('addSample')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('customer')}</TableHead>
                <TableHead>{t('products')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('shippingDate')}</TableHead>
                <TableHead>{t('trackingNumber')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSamples.map((sample) => {
                const StatusIcon = SAMPLE_STATUS[sample.status]?.icon || Clock;
                return (
                  <TableRow key={sample.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{sample.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{sample.products}</TableCell>
                    <TableCell>{sample.quantity}</TableCell>
                    <TableCell>{sample.shipping_date || '-'}</TableCell>
                    <TableCell>{sample.tracking_number || '-'}</TableCell>
                    <TableCell>
                      <Badge className={SAMPLE_STATUS[sample.status]?.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {getStatusLabel(sample.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(sample)}>
                            <Edit className="w-4 h-4 mr-2" /> {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(sample.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSample ? t('edit') : t('addSample')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('customer')} *</Label>
              <Select 
                value={formData.customer_id} 
                onValueChange={(v) => setFormData({...formData, customer_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('products')} *</Label>
              <Input 
                value={formData.products}
                onChange={(e) => setFormData({...formData, products: e.target.value})}
                placeholder={t('productsPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('quantity')}</Label>
                <Input 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="10 kg"
                />
              </div>
              <div>
                <Label>{t('shippingDate')}</Label>
                <Input 
                  type="date"
                  value={formData.shipping_date}
                  onChange={(e) => setFormData({...formData, shipping_date: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('trackingNumber')}</Label>
                <Input 
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                  placeholder="DHL123456789"
                />
              </div>
              <div>
                <Label>{t('status')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({...formData, status: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SAMPLE_STATUS).map(([key]) => (
                      <SelectItem key={key} value={key}>{getStatusLabel(key)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t('notes')}</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleSubmit}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Samples;
