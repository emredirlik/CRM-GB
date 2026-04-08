import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Plus, Pencil, Trash2, Search, ShoppingCart, Package, FileDown, MessageCircle, X, Eye, Euro, CreditCard, Mail, Bell, Clock, ChevronDown, LayoutGrid, List, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  partial: 'bg-orange-100 text-orange-700 border-orange-300',
  paid: 'bg-green-100 text-green-700 border-green-300',
  overdue: 'bg-red-100 text-red-700 border-red-300'
};

const paymentStatusLabels = {
  tr: { pending: 'Bekliyor', partial: 'Kısmi', paid: 'Ödendi', overdue: 'Vadesi Geçti' },
  en: { pending: 'Pending', partial: 'Partial', paid: 'Paid', overdue: 'Overdue' },
  de: { pending: 'Ausstehend', partial: 'Teilweise', paid: 'Bezahlt', overdue: 'Überfällig' },
  pl: { pending: 'Oczekuje', partial: 'Częściowo', paid: 'Zapłacono', overdue: 'Zaległe' }
};

// Due date labels
const dueDateLabels = {
  tr: { dueDate: 'Vade', days: 'Gün', overdueSuffix: 'g gecikmiş!' },
  en: { dueDate: 'Due', days: 'Days', overdueSuffix: 'd overdue!' },
  de: { dueDate: 'Fällig', days: 'Tage', overdueSuffix: 'T überfällig!' },
  pl: { dueDate: 'Termin', days: 'Dni', overdueSuffix: 'd zaległy!' }
};

const statusLabels = {
  tr: { pending: 'Beklemede', confirmed: 'Onaylandı', shipped: 'Gönderildi', delivered: 'Teslim Edildi', cancelled: 'İptal' },
  de: { pending: 'Ausstehend', confirmed: 'Bestätigt', shipped: 'Versendet', delivered: 'Geliefert', cancelled: 'Storniert' },
  en: { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
  pl: { pending: 'Oczekujące', confirmed: 'Potwierdzone', shipped: 'Wysłane', delivered: 'Dostarczone', cancelled: 'Anulowane' }
};

const units = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'adet', label: 'Adet' },
  { value: 'paket', label: 'Paket' },
  { value: 'kutu', label: 'Kutu' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'ml', label: 'Mililitre (ml)' }
];

const emptyProductItem = {
  product_name: '',
  product_code: '',
  pieces: 1,
  amount: 1,
  unit: 'kg',
  unit_price: 0
};

const Orders = () => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list or grid
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailLanguage, setEmailLanguage] = useState('tr'); // Language for email
  const [sendingEmail, setSendingEmail] = useState(false);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Multi-product form state
  const [leadId, setLeadId] = useState('');
  const [orderProducts, setOrderProducts] = useState([{ ...emptyProductItem }]);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderStatus, setOrderStatus] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, leadsRes, productsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/leads`),
        axios.get(`${API}/products`)
      ]);
      setOrders(ordersRes.data);
      setLeads(leadsRes.data);
      setAvailableProducts(productsRes.data);
    } catch (error) {
      toast.error('Hata', { description: 'Veri yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLeadId('');
    setOrderProducts([{ ...emptyProductItem }]);
    setOrderNotes('');
    setOrderStatus('pending');
  };

  const openPreview = (order) => {
    setPreviewOrder(order);
    setIsPreviewOpen(true);
  };

  const openAddDialog = () => {
    setSelectedOrder(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (order) => {
    setSelectedOrder(order);
    setLeadId(order.lead_id);
    setOrderNotes(order.notes || '');
    setOrderStatus(order.status);
    
    // Load products from order
    if (order.products && order.products.length > 0) {
      setOrderProducts(order.products.map(p => ({
        product_name: p.product_name || '',
        product_code: p.product_code || '',
        pieces: p.pieces || 1,
        amount: p.amount || 1,
        unit: p.unit || 'kg',
        unit_price: p.unit_price || 0
      })));
    } else {
      // Legacy single product
      setOrderProducts([{
        product_name: order.product_name || '',
        product_code: order.product_code || '',
        pieces: order.pieces || 1,
        amount: order.amount || order.quantity || 1,
        unit: order.unit || 'kg',
        unit_price: order.unit_price || 0
      }]);
    }
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (order) => {
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };

  // Product item handlers
  const addProductItem = () => {
    setOrderProducts([...orderProducts, { ...emptyProductItem }]);
  };

  const removeProductItem = (index) => {
    if (orderProducts.length > 1) {
      setOrderProducts(orderProducts.filter((_, i) => i !== index));
    }
  };

  const updateProductItem = (index, field, value) => {
    const updated = [...orderProducts];
    updated[index] = { ...updated[index], [field]: value };
    setOrderProducts(updated);
  };

  const handleProductSelect = (index, productId) => {
    const product = availableProducts.find(p => p.id === productId);
    if (product) {
      const updated = [...orderProducts];
      updated[index] = {
        ...updated[index],
        product_name: product.name,
        product_code: product.code,
        unit: product.default_unit || 'kg',
        unit_price: product.default_price || 0
      };
      setOrderProducts(updated);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!leadId) {
      toast.error('Hata', { description: 'Lütfen müşteri seçin' });
      return;
    }
    
    const validProducts = orderProducts.filter(p => p.product_name && p.product_code);
    if (validProducts.length === 0) {
      toast.error('Hata', { description: 'En az bir ürün ekleyin' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        lead_id: leadId,
        products: validProducts.map(p => ({
          product_name: p.product_name,
          product_code: p.product_code,
          pieces: parseInt(p.pieces) || 1,
          amount: parseFloat(p.amount) || 1,
          unit: p.unit || 'kg',
          unit_price: parseFloat(p.unit_price) || 0
        })),
        notes: orderNotes
      };

      if (selectedOrder) {
        payload.status = orderStatus;
        await axios.put(`${API}/orders/${selectedOrder.id}`, payload);
        toast.success('Başarılı', { description: 'Sipariş güncellendi' });
      } else {
        await axios.post(`${API}/orders`, payload);
        toast.success('Başarılı', { description: 'Sipariş oluşturuldu' });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: error.response?.data?.detail || 'İşlem başarısız' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/orders/${selectedOrder.id}`);
      toast.success('Başarılı', { description: 'Sipariş silindi' });
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: 'Sipariş silinemedi' });
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { status: newStatus });
      toast.success('Başarılı', { description: 'Durum güncellendi' });
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: 'Durum güncellenemedi' });
    }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}/payment`, { payment_status: newPaymentStatus });
      toast.success('Başarılı', { description: 'Ödeme durumu güncellendi' });
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: 'Ödeme durumu güncellenemedi' });
    }
  };

  // Set payment due date (10, 15, 30 days from order creation)
  const handlePaymentDueDaysChange = async (orderId, days) => {
    try {
      const order = orders.find(o => o.id === orderId);
      const createdAt = new Date(order?.created_at || new Date());
      const dueDate = new Date(createdAt);
      dueDate.setDate(dueDate.getDate() + parseInt(days));
      const dueDateStr = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      await axios.put(`${API}/orders/${orderId}/payment`, { payment_due_date: dueDateStr });
      toast.success('Başarılı', { description: `Son ödeme tarihi ${days} gün olarak ayarlandı` });
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: 'Son ödeme tarihi güncellenemedi' });
    }
  };

  const downloadPdf = async (orderId) => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}/pdf?lang=${language}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `siparis_${orderId.slice(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Başarılı', { description: 'PDF indirildi' });
    } catch (error) {
      toast.error('Hata', { description: 'PDF indirilemedi' });
    }
  };

  const sendWhatsApp = async (orderId) => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}/whatsapp`);
      window.open(response.data.whatsapp_url, '_blank');
      toast.success('Başarılı', { description: 'WhatsApp açılıyor...' });
    } catch (error) {
      toast.error('Hata', { description: 'WhatsApp linki oluşturulamadı' });
    }
  };

  // Send payment reminder
  const sendPaymentReminder = async (orderId) => {
    try {
      const settings = await axios.get(`${API}/company-settings`);
      const adminEmail = settings.data?.email || settings.data?.smtp_username;
      
      const response = await axios.post(`${API}/orders/${orderId}/send-payment-reminder?admin_email=${adminEmail}`);
      if (response.data.customer_sent) {
        toast.success('Hatırlatma Gönderildi', { description: `Müşteriye ödeme hatırlatma maili gönderildi (${response.data.days_overdue} gün gecikmiş)` });
      } else {
        toast.warning('Kısmi Başarı', { description: 'Müşteri e-postası bulunamadı, sadece admin bilgilendirildi' });
      }
      if (response.data.admin_sent) {
        toast.info('Admin Bildirimi', { description: 'Size de bildirim gönderildi' });
      }
    } catch (error) {
      toast.error('Hata', { description: 'Hatırlatma gönderilemedi' });
    }
  };

  // Open email dialog for order
  const openEmailDialog = (order) => {
    setSelectedOrder(order);
    const lead = leads.find(l => l.id === order.lead_id);
    setEmailTo(lead?.email || '');
    setEmailLanguage(language); // Default to current UI language
    const subjectByLang = {
      tr: `Sipariş Formu - ${order.company_name || lead?.company || ''}`,
      en: `Order Form - ${order.company_name || lead?.company || ''}`,
      de: `Bestellformular - ${order.company_name || lead?.company || ''}`,
      pl: `Formularz zamówienia - ${order.company_name || lead?.company || ''}`
    };
    setEmailSubject(subjectByLang[language] || subjectByLang.en);
    setIsEmailDialogOpen(true);
  };

  // Send order via email with PDF attachment - saves to IMAP Drafts
  const sendOrderByEmail = async () => {
    setSendingEmail(true);
    try {
      // Get PDF
      const pdfResponse = await axios.get(`${API}/orders/${selectedOrder.id}/pdf?lang=${emailLanguage}`, {
        responseType: 'blob'
      });
      
      const bodyByLang = {
        tr: `<p>Sayın Yetkili,</p><p>Siparişiniz ekte yer almaktadır.</p><p>Saygılarımızla,<br>Gewürzberg GmbH</p>`,
        en: `<p>Dear Sir/Madam,</p><p>Please find your order attached.</p><p>Best regards,<br>Gewürzberg GmbH</p>`,
        de: `<p>Sehr geehrte Damen und Herren,</p><p>Im Anhang finden Sie Ihre Bestellung.</p><p>Mit freundlichen Grüßen,<br>Gewürzberg GmbH</p>`,
        pl: `<p>Szanowni Państwo,</p><p>W załączniku znajduje się Państwa zamówienie.</p><p>Z poważaniem,<br>Gewürzberg GmbH</p>`
      };
      
      const formData = new FormData();
      formData.append('to', emailTo || '');
      formData.append('subject', emailSubject);
      formData.append('body', bodyByLang[emailLanguage] || bodyByLang.en);
      formData.append('attachments', new Blob([pdfResponse.data], { type: 'application/pdf' }), `siparis_${selectedOrder.id.slice(0,8)}.pdf`);
      
      const response = await axios.post(`${API}/mail/send-to-drafts`, formData);
      toast.success(t('success'), { description: response.data.message });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Mail hazırlanamadı' });
    } finally {
      setSendingEmail(false);
    }
  };

  // Calculate days overdue for an order
  const getDaysOverdue = (order) => {
    if (!order.payment_due_date) return 0;
    const today = new Date();
    const dueDate = new Date(order.payment_due_date);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const searchLower = searchTerm.toLowerCase();
    return orders.filter(order => (
      order.company_name?.toLowerCase().includes(searchLower) ||
      order.product_name?.toLowerCase().includes(searchLower) ||
      order.product_code?.toLowerCase().includes(searchLower)
    ));
  }, [orders, searchTerm]);

  // Total revenue calculation removed per user request - no totals shown

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatOrderProducts = (order) => {
    if (order.products && order.products.length > 0) {
      if (order.products.length === 1) {
        const p = order.products[0];
        return `${p.product_name}`;
      }
      return `${order.products.length} ürün`;
    }
    return order.product_name || '-';
  };

  const formatOrderQuantity = (order) => {
    if (order.products && order.products.length > 0) {
      if (order.products.length === 1) {
        const p = order.products[0];
        const pieces = p.pieces || 1;
        const amount = p.amount || 1;
        return pieces > 1 ? `${pieces} × ${amount} ${p.unit}` : `${amount} ${p.unit}`;
      }
      return `${order.products.length} kalem`;
    }
    const pieces = order.pieces || 1;
    const amount = order.amount || order.quantity || 1;
    const unit = order.unit || 'kg';
    return pieces > 1 ? `${pieces} × ${amount} ${unit}` : `${amount} ${unit}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="orders-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="orders-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('orders')}</h1>
          <p className="text-muted-foreground mt-1">{orders.length} {t('orders').toLowerCase()}</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-order-btn">
          <Plus className="w-4 h-4 mr-2" />
          {t('addOrder')}
        </Button>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('searchOrders')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-orders"
          />
        </div>
        <div className="flex gap-1">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Orders List/Grid */}
      <div data-testid="orders-table-card">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground" data-testid="no-orders">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchTerm ? t('noResults') : t('noOrdersYet')}</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="orders-grid">
            {filteredOrders.map((order) => {
              const lead = leads.find(l => l.id === order.lead_id);
              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openPreview(order)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[language]?.[order.status] || order.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openPreview(order); }}>
                            <Eye className="w-4 h-4 mr-2" /> {t('preview')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); sendWhatsApp(order.id); }}>
                            <MessageCircle className="w-4 h-4 mr-2 text-green-600" /> WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); downloadPdf(order.id); }}>
                            <FileDown className="w-4 h-4 mr-2 text-blue-600" /> PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEmailDialog(order); }}>
                            <Mail className="w-4 h-4 mr-2 text-purple-600" /> Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(order); }}>
                            <Pencil className="w-4 h-4 mr-2" /> {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDeleteDialog(order); }} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" /> {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-semibold truncate">{lead?.company_name || 'Müşteri'}</h3>
                    <p className="text-sm text-muted-foreground truncate">{order.items?.map(i => i.product_name).join(', ')}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">{order.created_at?.split('T')[0]}</span>
                      <span className="font-bold text-indigo-600">{order.total_amount?.toFixed(2)} €</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1" data-testid="orders-table">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-sm transition-shadow" data-testid={`order-row-${order.id}`}>
                <CardContent className="p-2 sm:p-3">
                  {/* Compact Row Layout */}
                  <div className="flex items-center gap-2">
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-indigo-600" />
                    </div>
                    
                    {/* Main Info */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      {/* Mobile: Show product and company name vertically */}
                      <div className="sm:hidden">
                        <p className="font-semibold text-sm leading-tight truncate">{formatOrderProducts(order)}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.company_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge className={`${statusColors[order.status]} border-0 text-[8px] px-1`}>
                            {statusLabels[language]?.[order.status] || order.status}
                          </Badge>
                          <span className="text-[10px] font-medium text-indigo-600">{formatOrderQuantity(order)}</span>
                        </div>
                      </div>
                      
                      {/* Desktop: Grid layout */}
                      <div className="hidden sm:grid sm:grid-cols-6 gap-2">
                        {/* Product */}
                        <div className="col-span-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{formatOrderProducts(order)}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.company_name}</p>
                        </div>
                        
                        {/* Quantity */}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-indigo-600">{formatOrderQuantity(order)}</p>
                        </div>
                        
                        {/* Status */}
                        <div>
                          <Badge className={`${statusColors[order.status]} border-0 text-[10px] px-1.5`}>
                            {statusLabels[language]?.[order.status] || order.status}
                          </Badge>
                        </div>
                        
                        {/* Payment Status with Dropdown */}
                        <div className="flex items-center gap-1">
                          <Select 
                            value={order.payment_status || 'pending'} 
                            onValueChange={(value) => handlePaymentStatusChange(order.id, value)}
                          >
                            <SelectTrigger className={`w-auto h-6 px-1.5 text-[10px] ${paymentStatusColors[order.payment_status || 'pending']} border`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(paymentStatusColors).map(ps => (
                                <SelectItem key={ps} value={ps}>
                                  <Badge className={`${paymentStatusColors[ps]} border text-xs`}>
                                    {paymentStatusLabels[language]?.[ps]}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {getDaysOverdue(order) > 0 && order.payment_status !== 'paid' && (
                            <span className="text-[10px] text-red-600 font-bold animate-pulse">{getDaysOverdue(order)}{dueDateLabels[language]?.overdueSuffix || 'd overdue!'}</span>
                          )}
                        </div>
                        
                        {/* Payment Due Days Dropdown */}
                        <div className="flex items-center gap-1">
                          <Select 
                            value={order.payment_due_days?.toString() || ''}
                            onValueChange={(value) => handlePaymentDueDaysChange(order.id, value)}
                          >
                            <SelectTrigger className="w-auto h-6 px-1.5 text-[10px] border-dashed border-gray-300">
                              <Clock className="w-3 h-3 mr-1" />
                              <SelectValue placeholder={dueDateLabels[language]?.dueDate || 'Due'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 {dueDateLabels[language]?.days || 'Days'}</SelectItem>
                              <SelectItem value="15">15 {dueDateLabels[language]?.days || 'Days'}</SelectItem>
                              <SelectItem value="30">30 {dueDateLabels[language]?.days || 'Days'}</SelectItem>
                              <SelectItem value="45">45 {dueDateLabels[language]?.days || 'Days'}</SelectItem>
                              <SelectItem value="60">60 {dueDateLabels[language]?.days || 'Days'}</SelectItem>
                            </SelectContent>
                          </Select>
                          {order.payment_due_date && (
                            <span className="text-[9px] text-muted-foreground">
                              {new Date(order.payment_due_date).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : language === 'pl' ? 'pl-PL' : 'tr-TR')}
                            </span>
                          )}
                        </div>
                        
                        {/* Date */}
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : language === 'pl' ? 'pl-PL' : 'tr-TR')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions - All buttons visible */}
                    <div className="flex items-center gap-0 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openPreview(order)} className="h-6 w-6 p-0" title="Önizle">
                        <Eye className="w-3 h-3 text-indigo-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => sendWhatsApp(order.id)} className="h-6 w-6 p-0" title="WhatsApp">
                        <MessageCircle className="w-3 h-3 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadPdf(order.id)} className="h-6 w-6 p-0" title="PDF">
                        <FileDown className="w-3 h-3 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEmailDialog(order)} className="h-6 w-6 p-0" title="Email">
                        <Mail className="w-3 h-3 text-purple-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(order)} className="h-6 w-6 p-0" title="Düzenle">
                        <Pencil className="w-3 h-3 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(order)} className="h-6 w-6 p-0" title="Sil">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog - Multi-Product */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="order-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedOrder ? t('editOrder') : t('addOrder')}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? t('updateOrderInfo') || 'Update order information' : t('addMultipleProducts') || 'You can add multiple products'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Müşteri Seçimi */}
            {!selectedOrder && (
              <div className="space-y-2">
                <Label>{t('customer')} *</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger data-testid="select-lead">
                    <SelectValue placeholder={t('selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.company_name} - {lead.first_name} {lead.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Products List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('products') || 'Products'}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addProductItem} data-testid="add-product-btn">
                  <Plus className="w-4 h-4 mr-1" />
                  {t('addProduct')}
                </Button>
              </div>

              {orderProducts.map((item, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3" data-testid={`product-item-${index}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">{t('product') || 'Product'} #{index + 1}</span>
                    {orderProducts.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeProductItem(index)}
                        className="text-destructive hover:text-destructive h-6 w-6 p-0"
                        data-testid={`remove-product-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Kayıtlı Ürün Seçimi */}
                  {availableProducts.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('selectFromSaved') || 'Select from saved products'}</Label>
                      <Select onValueChange={(val) => handleProductSelect(index, val)}>
                        <SelectTrigger className="h-8" data-testid={`select-saved-product-${index}`}>
                          <SelectValue placeholder={t('selectProduct') || 'Select product (optional)'} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Ürün Bilgileri */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('productName')} *</Label>
                      <Input
                        value={item.product_name}
                        onChange={(e) => updateProductItem(index, 'product_name', e.target.value)}
                        placeholder="Gyros Baharat"
                        className="h-8"
                        data-testid={`input-product-name-${index}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('productCode')} *</Label>
                      <Input
                        value={item.product_code}
                        onChange={(e) => updateProductItem(index, 'product_code', e.target.value)}
                        placeholder="GYR-001"
                        className="h-8"
                        data-testid={`input-product-code-${index}`}
                      />
                    </div>
                  </div>

                  {/* Miktar */}
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('pieces') || 'Pieces'}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.pieces}
                        onChange={(e) => updateProductItem(index, 'pieces', parseInt(e.target.value) || 1)}
                        className="h-8"
                        data-testid={`input-pieces-${index}`}
                      />
                    </div>
                    <div className="flex items-center justify-center pb-1 text-lg font-bold text-muted-foreground">×</div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('quantity')}</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => updateProductItem(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="h-8"
                        data-testid={`input-amount-${index}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('unit')}</Label>
                      <Select value={item.unit} onValueChange={(val) => updateProductItem(index, 'unit', val)}>
                        <SelectTrigger className="h-8" data-testid={`select-unit-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(u => (
                            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">€/{item.unit}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateProductItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="h-8"
                        data-testid={`input-unit-price-${index}`}
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Durum (sadece düzenleme) */}
            {selectedOrder && (
              <div className="space-y-2">
                <Label>{t('status')}</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{statusLabels[language]?.pending}</SelectItem>
                    <SelectItem value="confirmed">{statusLabels[language]?.confirmed}</SelectItem>
                    <SelectItem value="shipped">{statusLabels[language]?.shipped}</SelectItem>
                    <SelectItem value="delivered">{statusLabels[language]?.delivered}</SelectItem>
                    <SelectItem value="cancelled">{statusLabels[language]?.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notlar */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                placeholder={t('orderNotes')}
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="cancel-btn">
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-btn">
              {saving ? t('saving') || 'Saving...' : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteOrder') || 'Delete Order'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="confirm-delete-btn">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl" data-testid="preview-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              {t('preview') || 'Preview'}
            </DialogTitle>
            <DialogDescription>
              {t('orderDetails') || 'Order details'}
            </DialogDescription>
          </DialogHeader>
          
          {previewOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">{t('customerInfo') || 'Customer Info'}</h4>
                <p className="text-lg font-bold">{previewOrder.company_name}</p>
                <p className="text-sm text-gray-600">{previewOrder.lead_name}</p>
              </div>

              {/* Products Table */}
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">{t('products') || 'Products'}</h4>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium whitespace-nowrap">{t('product') || 'Product'}</th>
                        <th className="text-left px-4 py-2 font-medium whitespace-nowrap">{t('productCode')}</th>
                        <th className="text-right px-4 py-2 font-medium whitespace-nowrap">{t('quantity')}</th>
                        <th className="text-right px-4 py-2 font-medium whitespace-nowrap">{t('unitPrice')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewOrder.products && previewOrder.products.length > 0 ? (
                        previewOrder.products.map((product, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-3">{product.product_name}</td>
                            <td className="px-4 py-3 text-gray-500">{product.product_code || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              {product.pieces > 1 ? `${product.pieces} × ` : ''}{product.amount} {product.unit}
                            </td>
                            <td className="px-4 py-3 text-right text-indigo-600 font-medium">
                              {formatCurrency(product.unit_price)}/{product.unit}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-t">
                          <td className="px-4 py-3">{previewOrder.product_name}</td>
                          <td className="px-4 py-3 text-gray-500">{previewOrder.product_code || '-'}</td>
                          <td className="px-4 py-3 text-right">{previewOrder.quantity || previewOrder.amount} {previewOrder.unit}</td>
                          <td className="px-4 py-3 text-right text-indigo-600 font-medium">
                            {formatCurrency(previewOrder.unit_price)}/{previewOrder.unit}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">{t('status')}</h4>
                  <Badge className={`${statusColors[previewOrder.status]} border-0`}>
                    {statusLabels[language]?.[previewOrder.status] || previewOrder.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">{t('date')}</h4>
                  <p className="text-sm">{previewOrder.created_at ? new Date(previewOrder.created_at).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : language === 'pl' ? 'pl-PL' : 'tr-TR') : '-'}</p>
                </div>
              </div>

              {previewOrder.notes && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">{t('notes')}</h4>
                  <p className="text-sm bg-gray-50 rounded-lg p-3">{previewOrder.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 min-w-[120px]"
                  onClick={() => {
                    sendWhatsApp(previewOrder.id);
                    setIsPreviewOpen(false);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[120px]"
                  onClick={() => {
                    downloadPdf(previewOrder.id);
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2 text-blue-600" />
                  {t('downloadPdf')}
                </Button>
                <Button
                  className="flex-1 min-w-[120px] bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    openEditDialog(previewOrder);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {t('edit')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Send Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('sendOrderByEmail')}</DialogTitle>
            <DialogDescription>
              {t('sendOrderEmailDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('email')}</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('subject')}</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={t('emailSubjectPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('emailLanguage') || 'E-posta Dili'}</Label>
              <Select value={emailLanguage} onValueChange={setEmailLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="pl">🇵🇱 Polski</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={sendOrderByEmail} 
              disabled={sendingEmail || !emailTo}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {sendingEmail ? t('sendingEmail') : t('send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
