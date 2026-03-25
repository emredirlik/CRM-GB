import React, { useEffect, useState } from 'react';
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
import { Plus, Pencil, Trash2, Package, Search, ShoppingCart } from 'lucide-react';
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

const statusLabels = {
  tr: { pending: 'Beklemede', confirmed: 'Onaylandı', shipped: 'Gönderildi', delivered: 'Teslim Edildi', cancelled: 'İptal' },
  de: { pending: 'Ausstehend', confirmed: 'Bestätigt', shipped: 'Versendet', delivered: 'Geliefert', cancelled: 'Storniert' },
  en: { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }
};

const initialFormData = {
  lead_id: '',
  product_name: '',
  product_code: '',
  quantity: 1,
  unit_price: 0,
  notes: ''
};

const Orders = () => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, leadsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/leads`)
      ]);
      setOrders(ordersRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      toast.error('Error', { description: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDialog = () => {
    setSelectedOrder(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (order) => {
    setSelectedOrder(order);
    setFormData({
      lead_id: order.lead_id,
      product_name: order.product_name,
      product_code: order.product_code,
      quantity: order.quantity,
      unit_price: order.unit_price,
      notes: order.notes || '',
      status: order.status
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (order) => {
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.lead_id || !formData.product_name || !formData.product_code) {
      toast.error('Error', { description: 'Please fill all required fields' });
      return;
    }

    setSaving(true);
    try {
      if (selectedOrder) {
        await axios.put(`${API}/orders/${selectedOrder.id}`, {
          product_name: formData.product_name,
          product_code: formData.product_code,
          quantity: parseInt(formData.quantity),
          unit_price: parseFloat(formData.unit_price),
          status: formData.status,
          notes: formData.notes
        });
        toast.success(t('success'), { description: 'Sipariş güncellendi' });
      } else {
        await axios.post(`${API}/orders`, {
          lead_id: formData.lead_id,
          product_name: formData.product_name,
          product_code: formData.product_code,
          quantity: parseInt(formData.quantity),
          unit_price: parseFloat(formData.unit_price),
          notes: formData.notes
        });
        toast.success(t('success'), { description: 'Sipariş oluşturuldu' });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/orders/${selectedOrder.id}`);
      toast.success(t('success'), { description: 'Sipariş silindi' });
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to delete order' });
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/${orderId}`, { status: newStatus });
      toast.success(t('success'), { description: 'Durum güncellendi' });
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to update status' });
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.company_name.toLowerCase().includes(searchLower) ||
      order.product_name.toLowerCase().includes(searchLower) ||
      order.product_code.toLowerCase().includes(searchLower)
    );
  });

  const totalRevenue = orders.reduce((sum, order) => 
    ['confirmed', 'shipped', 'delivered'].includes(order.status) ? sum + order.total_price : sum, 0
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
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
          <p className="text-muted-foreground mt-1">{orders.length} sipariş • Toplam: {formatCurrency(totalRevenue)}</p>
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

      {/* Orders Table */}
      <Card data-testid="orders-table-card">
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="no-orders">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{searchTerm ? 'Sipariş bulunamadı' : 'Henüz sipariş yok'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table" data-testid="orders-table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th>Ürün Kodu</th>
                    <th>Müşteri</th>
                    <th>Adet</th>
                    <th>Birim Fiyat</th>
                    <th>Toplam</th>
                    <th>Durum</th>
                    <th className="text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} data-testid={`order-row-${order.id}`}>
                      <td className="font-medium">{order.product_name}</td>
                      <td className="font-mono text-xs text-muted-foreground">{order.product_code}</td>
                      <td>
                        <div>
                          <p className="font-medium">{order.company_name}</p>
                          <p className="text-xs text-muted-foreground">{order.lead_name}</p>
                        </div>
                      </td>
                      <td>{order.quantity}</td>
                      <td>{formatCurrency(order.unit_price)}</td>
                      <td className="font-semibold">{formatCurrency(order.total_price)}</td>
                      <td>
                        <Select 
                          value={order.status} 
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <Badge className={`${statusColors[order.status]} border-0`}>
                              {statusLabels[language]?.[order.status] || order.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <Badge className={`${statusColors.pending} border-0`}>
                                {statusLabels[language]?.pending}
                              </Badge>
                            </SelectItem>
                            <SelectItem value="confirmed">
                              <Badge className={`${statusColors.confirmed} border-0`}>
                                {statusLabels[language]?.confirmed}
                              </Badge>
                            </SelectItem>
                            <SelectItem value="shipped">
                              <Badge className={`${statusColors.shipped} border-0`}>
                                {statusLabels[language]?.shipped}
                              </Badge>
                            </SelectItem>
                            <SelectItem value="delivered">
                              <Badge className={`${statusColors.delivered} border-0`}>
                                {statusLabels[language]?.delivered}
                              </Badge>
                            </SelectItem>
                            <SelectItem value="cancelled">
                              <Badge className={`${statusColors.cancelled} border-0`}>
                                {statusLabels[language]?.cancelled}
                              </Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(order)}
                            data-testid={`edit-order-${order.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(order)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-order-${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="order-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedOrder ? 'Sipariş Düzenle' : 'Yeni Sipariş'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? 'Sipariş bilgilerini güncelleyin' : 'Yeni sipariş oluşturun'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedOrder && (
              <div className="space-y-2">
                <Label>Müşteri *</Label>
                <Select value={formData.lead_id} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value }))}>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_name">Ürün Adı *</Label>
                <Input
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  placeholder="Gyros Baharat Karışımı"
                  data-testid="input-product-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_code">Ürün Kodu *</Label>
                <Input
                  id="product_code"
                  name="product_code"
                  value={formData.product_code}
                  onChange={handleInputChange}
                  placeholder="GYR-001"
                  data-testid="input-product-code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Adet *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  data-testid="input-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Birim Fiyat (€) *</Label>
                <Input
                  id="unit_price"
                  name="unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={handleInputChange}
                  data-testid="input-unit-price"
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Toplam Fiyat</p>
              <p className="text-2xl font-bold font-['Manrope']">
                {formatCurrency(formData.quantity * formData.unit_price)}
              </p>
            </div>

            {selectedOrder && (
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
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
    </div>
  );
};

export default Orders;
