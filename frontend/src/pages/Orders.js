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
import { Plus, Pencil, Trash2, Search, ShoppingCart, Package, FileDown, MessageCircle, X, Eye, Euro, CreditCard, Mail, Bell, Clock } from 'lucide-react';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
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
    setEmailSubject(`Sipariş Formu - ${order.company_name || lead?.company || ''}`);
    setIsEmailDialogOpen(true);
  };

  // Send order via email to custom address
  const sendOrderByEmail = async () => {
    if (!emailTo) {
      toast.error('Hata', { description: 'E-posta adresi gerekli' });
      return;
    }
    
    setSendingEmail(true);
    try {
      // Generate PDF and send
      const pdfResponse = await axios.get(`${API}/orders/${selectedOrder.id}/pdf?lang=${language}`, {
        responseType: 'blob'
      });
      
      const formData = new FormData();
      formData.append('to', emailTo);
      formData.append('subject', emailSubject);
      formData.append('body', `<p>Sayın Yetkili,</p><p>Siparişiniz ekte yer almaktadır.</p><p>Saygılarımızla</p>`);
      formData.append('html', 'true');
      formData.append('attachments', new Blob([pdfResponse.data], { type: 'application/pdf' }), `siparis_${selectedOrder.id.slice(0,8)}.pdf`);
      
      await axios.post(`${API}/mail/send-with-attachments`, formData);
      toast.success('Mail Gönderildi', { description: `Sipariş ${emailTo} adresine gönderildi` });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast.error('Hata', { description: 'Mail gönderilemedi' });
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
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Siparişler</h1>
          <p className="text-muted-foreground mt-1">{orders.length} sipariş</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-order-btn">
          <Plus className="w-4 h-4 mr-2" />
          Sipariş Ekle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Sipariş ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-orders"
        />
      </div>

      {/* Orders List */}
      <div data-testid="orders-table-card">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground" data-testid="no-orders">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchTerm ? 'Sipariş bulunamadı' : 'Henüz sipariş yok'}</p>
              </div>
            </CardContent>
          </Card>
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
                    
                    {/* Main Info - Flexible */}
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-1 sm:gap-3">
                      {/* Product */}
                      <div className="sm:col-span-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{formatOrderProducts(order)}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.company_name}</p>
                      </div>
                      
                      {/* Quantity */}
                      <div className="hidden sm:block min-w-0">
                        <p className="text-xs font-semibold text-indigo-600">{formatOrderQuantity(order)}</p>
                      </div>
                      
                      {/* Status */}
                      <div className="hidden sm:block">
                        <Badge className={`${statusColors[order.status]} border-0 text-[10px] px-1.5`}>
                          {statusLabels[language]?.[order.status] || order.status}
                        </Badge>
                      </div>
                      
                      {/* Payment */}
                      <div className="hidden sm:flex items-center gap-1">
                        <Badge className={`${paymentStatusColors[order.payment_status || 'pending']} border text-[10px] px-1.5`}>
                          {paymentStatusLabels[language]?.[order.payment_status || 'pending'] || 'Bekliyor'}
                        </Badge>
                        {getDaysOverdue(order) > 0 && order.payment_status !== 'paid' && (
                          <span className="text-[10px] text-red-600">{getDaysOverdue(order)}g</span>
                        )}
                      </div>
                      
                      {/* Date */}
                      <div className="hidden sm:block text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Select 
                        value={order.status} 
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-auto h-6 px-1.5 text-[10px]">
                          <span className="sr-only">Status</span>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(statusColors).map(status => (
                            <SelectItem key={status} value={status}>
                              <Badge className={`${statusColors[status]} border-0 text-xs`}>
                                {statusLabels[language]?.[status]}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => openPreview(order)} className="h-7 w-7 p-0" title="Önizle">
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadPdf(order.id)} className="h-7 w-7 p-0" title="PDF İndir">
                        <FileDown className="w-3.5 h-3.5 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEmailDialog(order)} className="h-7 w-7 p-0" title="Email Gönder">
                        <Mail className="w-3.5 h-3.5 text-purple-600" />
                      </Button>
                      {getDaysOverdue(order) > 0 && order.payment_status !== 'paid' && (
                        <Button variant="ghost" size="sm" onClick={() => sendPaymentReminder(order.id)} className="h-7 w-7 p-0" title="Ödeme Hatırlatma">
                          <Bell className="w-3.5 h-3.5 text-orange-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(order)} className="h-7 w-7 p-0" title="Düzenle">
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(order)} className="h-7 w-7 p-0" title="Sil">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
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
              {selectedOrder ? 'Sipariş Düzenle' : 'Yeni Sipariş'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? 'Sipariş bilgilerini güncelleyin' : 'Birden fazla ürün ekleyebilirsiniz'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Müşteri Seçimi */}
            {!selectedOrder && (
              <div className="space-y-2">
                <Label>Müşteri *</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger data-testid="select-lead">
                    <SelectValue placeholder="Müşteri seçin" />
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
                <Label className="text-base font-semibold">Ürünler</Label>
                <Button type="button" variant="outline" size="sm" onClick={addProductItem} data-testid="add-product-btn">
                  <Plus className="w-4 h-4 mr-1" />
                  Ürün Ekle
                </Button>
              </div>

              {orderProducts.map((item, index) => (
                <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3" data-testid={`product-item-${index}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Ürün #{index + 1}</span>
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
                      <Label className="text-xs text-muted-foreground">Kayıtlı Ürünlerden Seç</Label>
                      <Select onValueChange={(val) => handleProductSelect(index, val)}>
                        <SelectTrigger className="h-8" data-testid={`select-saved-product-${index}`}>
                          <SelectValue placeholder="Ürün seç (opsiyonel)" />
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
                      <Label className="text-xs">Ürün Adı *</Label>
                      <Input
                        value={item.product_name}
                        onChange={(e) => updateProductItem(index, 'product_name', e.target.value)}
                        placeholder="Gyros Baharat"
                        className="h-8"
                        data-testid={`input-product-name-${index}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ürün Kodu *</Label>
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
                      <Label className="text-xs">Adet</Label>
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
                      <Label className="text-xs">Miktar</Label>
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
                      <Label className="text-xs">Birim</Label>
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
                <Label>Durum</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Beklemede</SelectItem>
                    <SelectItem value="confirmed">Onaylandı</SelectItem>
                    <SelectItem value="shipped">Gönderildi</SelectItem>
                    <SelectItem value="delivered">Teslim Edildi</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notlar */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
                placeholder="Sipariş notları..."
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="cancel-btn">
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-btn">
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Siparişi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu siparişi silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="confirm-delete-btn">
              Sil
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
              Sipariş Önizleme
            </DialogTitle>
            <DialogDescription>
              Sipariş detayları
            </DialogDescription>
          </DialogHeader>
          
          {previewOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Müşteri Bilgileri</h4>
                <p className="text-lg font-bold">{previewOrder.company_name}</p>
                <p className="text-sm text-gray-600">{previewOrder.lead_name}</p>
              </div>

              {/* Products Table */}
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Ürünler</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Ürün</th>
                        <th className="text-left px-4 py-2 font-medium">Kod</th>
                        <th className="text-right px-4 py-2 font-medium">Miktar</th>
                        <th className="text-right px-4 py-2 font-medium">Birim Fiyat</th>
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
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Durum</h4>
                  <Badge className={`${statusColors[previewOrder.status]} border-0`}>
                    {statusLabels[language]?.[previewOrder.status] || previewOrder.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Tarih</h4>
                  <p className="text-sm">{previewOrder.created_at ? new Date(previewOrder.created_at).toLocaleDateString('tr-TR') : '-'}</p>
                </div>
              </div>

              {previewOrder.notes && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">Notlar</h4>
                  <p className="text-sm bg-gray-50 rounded-lg p-3">{previewOrder.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
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
                  className="flex-1"
                  onClick={() => {
                    downloadPdf(previewOrder.id);
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2 text-blue-600" />
                  PDF İndir
                </Button>
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    openEditDialog(previewOrder);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Düzenle
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
            <DialogTitle>Siparişi Mail ile Gönder</DialogTitle>
            <DialogDescription>
              Sipariş PDF'ini istediğiniz e-posta adresine gönderin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>E-posta Adresi</Label>
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="ornek@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Konu</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Mail konusu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={sendOrderByEmail} 
              disabled={sendingEmail || !emailTo}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {sendingEmail ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
