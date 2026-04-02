import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  RefreshCw, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Navigation,
  Calendar,
  Search,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const statusConfig = {
  picked_up: { 
    color: 'bg-blue-100 text-blue-700 border-blue-200', 
    icon: Package, 
    label: { en: 'Picked Up', tr: 'Teslim Alındı', de: 'Abgeholt' }
  },
  in_transit: { 
    color: 'bg-amber-100 text-amber-700 border-amber-200', 
    icon: Truck, 
    label: { en: 'In Transit', tr: 'Yolda', de: 'Unterwegs' }
  },
  out_for_delivery: { 
    color: 'bg-purple-100 text-purple-700 border-purple-200', 
    icon: Navigation, 
    label: { en: 'Out for Delivery', tr: 'Dağıtımda', de: 'In Zustellung' }
  },
  delivered: { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    icon: PackageCheck, 
    label: { en: 'Delivered', tr: 'Teslim Edildi', de: 'Zugestellt' }
  },
  exception: { 
    color: 'bg-red-100 text-red-700 border-red-200', 
    icon: AlertCircle, 
    label: { en: 'Exception', tr: 'Sorun Var', de: 'Ausnahme' }
  },
  unknown: { 
    color: 'bg-gray-100 text-gray-700 border-gray-200', 
    icon: Package, 
    label: { en: 'Unknown', tr: 'Bilinmiyor', de: 'Unbekannt' }
  }
};

const texts = {
  en: {
    title: 'Shipment Tracking',
    subtitle: 'Track your DHL shipments in real-time',
    addShipment: 'Add Shipment',
    trackingNumber: 'Tracking Number',
    recipient: 'Recipient',
    address: 'Address',
    status: 'Status',
    lastUpdate: 'Last Update',
    location: 'Current Location',
    estimatedDelivery: 'Est. Delivery',
    refresh: 'Refresh',
    refreshAll: 'Refresh All',
    delete: 'Delete',
    noShipments: 'No shipments yet',
    addFirst: 'Add your first shipment to start tracking',
    events: 'Tracking History',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    deleteConfirm: 'Delete this shipment?',
    deleteDesc: 'This action cannot be undone.',
    quickTrack: 'Quick Track',
    quickTrackPlaceholder: 'Enter tracking number...',
    track: 'Track',
    active: 'Active',
    delivered: 'Delivered',
    all: 'All'
  },
  tr: {
    title: 'Kargo Takip',
    subtitle: 'DHL kargolarınızı anlık takip edin',
    addShipment: 'Kargo Ekle',
    trackingNumber: 'Takip Numarası',
    recipient: 'Alıcı',
    address: 'Adres',
    status: 'Durum',
    lastUpdate: 'Son Güncelleme',
    location: 'Mevcut Konum',
    estimatedDelivery: 'Tahmini Teslimat',
    refresh: 'Yenile',
    refreshAll: 'Tümünü Yenile',
    delete: 'Sil',
    noShipments: 'Henüz kargo yok',
    addFirst: 'Takip başlatmak için ilk kargonuzu ekleyin',
    events: 'Takip Geçmişi',
    notes: 'Notlar',
    save: 'Kaydet',
    cancel: 'İptal',
    deleteConfirm: 'Bu kargo silinsin mi?',
    deleteDesc: 'Bu işlem geri alınamaz.',
    quickTrack: 'Hızlı Takip',
    quickTrackPlaceholder: 'Takip numarası girin...',
    track: 'Takip Et',
    active: 'Aktif',
    delivered: 'Teslim Edildi',
    all: 'Tümü'
  },
  de: {
    title: 'Sendungsverfolgung',
    subtitle: 'Verfolgen Sie Ihre DHL-Sendungen in Echtzeit',
    addShipment: 'Sendung hinzufügen',
    trackingNumber: 'Sendungsnummer',
    recipient: 'Empfänger',
    address: 'Adresse',
    status: 'Status',
    lastUpdate: 'Letzte Aktualisierung',
    location: 'Aktueller Standort',
    estimatedDelivery: 'Geschätzte Lieferung',
    refresh: 'Aktualisieren',
    refreshAll: 'Alle aktualisieren',
    delete: 'Löschen',
    noShipments: 'Noch keine Sendungen',
    addFirst: 'Fügen Sie Ihre erste Sendung hinzu',
    events: 'Sendungsverlauf',
    notes: 'Notizen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    deleteConfirm: 'Diese Sendung löschen?',
    deleteDesc: 'Diese Aktion kann nicht rückgängig gemacht werden.',
    quickTrack: 'Schnelle Verfolgung',
    quickTrackPlaceholder: 'Sendungsnummer eingeben...',
    track: 'Verfolgen',
    active: 'Aktiv',
    delivered: 'Zugestellt',
    all: 'Alle'
  }
};

const Shipments = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [expandedShipment, setExpandedShipment] = useState(null);
  const [filter, setFilter] = useState('all');
  const [quickTrackNumber, setQuickTrackNumber] = useState('');
  const [quickTrackResult, setQuickTrackResult] = useState(null);
  const [quickTracking, setQuickTracking] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    tracking_number: '',
    recipient_name: '',
    recipient_address: '',
    notes: ''
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await axios.get(`${API}/shipments`);
      setShipments(response.data);
    } catch (error) {
      toast.error('Hata', { description: 'Kargolar yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTrack = async () => {
    if (!quickTrackNumber.trim()) return;
    
    setQuickTracking(true);
    setQuickTrackResult(null);
    
    try {
      const response = await axios.get(`${API}/tracking/${quickTrackNumber.trim()}`);
      setQuickTrackResult(response.data);
    } catch (error) {
      toast.error('Hata', { description: 'Takip bilgisi alınamadı' });
    } finally {
      setQuickTracking(false);
    }
  };

  const openAddDialog = () => {
    setSelectedShipment(null);
    setFormData({
      tracking_number: quickTrackNumber || '',
      recipient_name: '',
      recipient_address: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.tracking_number || !formData.recipient_name) {
      toast.error('Hata', { description: 'Takip numarası ve alıcı adı gerekli' });
      return;
    }

    try {
      await axios.post(`${API}/shipments`, formData);
      toast.success('Başarılı', { description: 'Kargo eklendi ve takip başlatıldı' });
      setIsDialogOpen(false);
      setQuickTrackNumber('');
      setQuickTrackResult(null);
      fetchShipments();
    } catch (error) {
      toast.error('Hata', { description: 'Kargo eklenemedi' });
    }
  };

  const handleRefresh = async (shipmentId) => {
    setRefreshing(true);
    try {
      await axios.post(`${API}/shipments/${shipmentId}/refresh`);
      toast.success('Başarılı', { description: 'Takip bilgisi güncellendi' });
      fetchShipments();
    } catch (error) {
      toast.error('Hata', { description: 'Güncelleme başarısız' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      const response = await axios.post(`${API}/shipments/refresh-all`);
      toast.success('Başarılı', { description: `${response.data.updated_count} kargo güncellendi` });
      fetchShipments();
    } catch (error) {
      toast.error('Hata', { description: 'Toplu güncelleme başarısız' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/shipments/${selectedShipment.id}`);
      toast.success('Başarılı', { description: 'Kargo silindi' });
      setIsDeleteDialogOpen(false);
      fetchShipments();
    } catch (error) {
      toast.error('Hata', { description: 'Kargo silinemedi' });
    }
  };

  const filteredShipments = shipments.filter(s => {
    if (filter === 'active') return s.status !== 'delivered';
    if (filter === 'delivered') return s.status === 'delivered';
    return true;
  });

  const getStatusConfig = (status) => statusConfig[status] || statusConfig.unknown;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="shipments-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope'] flex items-center gap-3">
            <Truck className="w-10 h-10 text-amber-600" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshAll} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t.refreshAll}
          </Button>
          <Button onClick={openAddDialog} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="w-4 h-4 mr-2" />
            {t.addShipment}
          </Button>
        </div>
      </div>

      {/* Quick Track */}
      <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium text-amber-800">{t.quickTrack}</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={quickTrackNumber}
                  onChange={(e) => setQuickTrackNumber(e.target.value.toUpperCase())}
                  placeholder={t.quickTrackPlaceholder}
                  className="bg-white font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickTrack()}
                />
                <Button onClick={handleQuickTrack} disabled={quickTracking} className="bg-amber-600 hover:bg-amber-700">
                  {quickTracking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="ml-2">{t.track}</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Quick Track Result */}
          {quickTrackResult && (
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {React.createElement(getStatusConfig(quickTrackResult.status).icon, { className: "w-5 h-5" })}
                  <Badge className={getStatusConfig(quickTrackResult.status).color}>
                    {getStatusConfig(quickTrackResult.status).label[language] || quickTrackResult.status_text}
                  </Badge>
                </div>
                <Button size="sm" variant="outline" onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-1" />
                  Listeye Ekle
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Konum:</span> {quickTrackResult.current_location || '-'}</div>
                <div><span className="text-muted-foreground">Tahmini:</span> {quickTrackResult.estimated_delivery || '-'}</div>
              </div>
              {quickTrackResult.demo_mode && (
                <p className="text-xs text-amber-600 mt-2">* Demo verisi gösteriliyor</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'active', 'delivered'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {t[f]}
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {f === 'all' ? shipments.length : 
               f === 'active' ? shipments.filter(s => s.status !== 'delivered').length :
               shipments.filter(s => s.status === 'delivered').length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Shipments List */}
      {filteredShipments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-amber-300" />
            <h3 className="text-xl font-semibold mb-2">{t.noShipments}</h3>
            <p className="text-muted-foreground mb-4">{t.addFirst}</p>
            <Button onClick={openAddDialog} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              {t.addShipment}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment) => {
            const config = getStatusConfig(shipment.status);
            const StatusIcon = config.icon;
            const isExpanded = expandedShipment === shipment.id;
            
            return (
              <Card key={shipment.id} className={`transition-all ${isExpanded ? 'ring-2 ring-amber-300' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${config.color}`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg">{shipment.tracking_number}</span>
                          <Badge className={config.color}>
                            {config.label[language] || shipment.status_text}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {shipment.recipient_name} • {shipment.recipient_address}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {shipment.current_location && (
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-amber-600" />
                            {shipment.current_location}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(shipment.last_tracked)}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefresh(shipment.id)}
                          disabled={refreshing}
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedShipment(isExpanded ? null : shipment.id)}
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${shipment.tracking_number}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedShipment(shipment); setIsDeleteDialogOpen(true); }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Events */}
                  {isExpanded && shipment.events && shipment.events.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {t.events}
                      </h4>
                      <div className="space-y-2">
                        {shipment.events.map((event, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 mt-2 rounded-full bg-amber-400 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium">{event.description}</p>
                              <p className="text-muted-foreground text-xs">
                                {event.date} {event.time} • {event.location}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Shipment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addShipment}</DialogTitle>
            <DialogDescription>DHL takip numarasını girin</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.trackingNumber} *</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value.toUpperCase() })}
                placeholder="00340434161094015001"
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t.recipient} *</Label>
              <Input
                value={formData.recipient_name}
                onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                placeholder="Müşteri Adı"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t.address}</Label>
              <Input
                value={formData.recipient_address}
                onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
                placeholder="Teslimat Adresi"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t.notes}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Notlar..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Shipments;
