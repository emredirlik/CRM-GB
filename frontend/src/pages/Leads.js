import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeads, createLead, updateLead, deleteLead } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, Trash2, Mail, Users, Search, FileDown, Eye, MapPin, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const initialFormData = {
  first_name: '',
  last_name: '',
  company_name: '',
  tax_number: '',
  address: '',
  email: '',
  city: '',
  country: '',
  notes: ''
};

const Leads = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [leadDetails, setLeadDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Bulk email state
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailBody, setBulkEmailBody] = useState('');
  const [sendingBulkEmail, setSendingBulkEmail] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await getLeads();
      setLeads(response.data);
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to fetch leads' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDialog = () => {
    setSelectedLead(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (lead) => {
    setSelectedLead(lead);
    setFormData({
      first_name: lead.first_name,
      last_name: lead.last_name,
      company_name: lead.company_name,
      tax_number: lead.tax_number,
      address: lead.address,
      email: lead.email,
      city: lead.city,
      country: lead.country,
      notes: lead.notes || ''
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (lead) => {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedLead) {
        await updateLead(selectedLead.id, formData);
        toast.success(t('success'), { description: t('leadUpdated') });
      } else {
        await createLead(formData);
        toast.success(t('success'), { description: t('leadAdded') });
      }
      setIsDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLead(selectedLead.id);
      toast.success(t('success'), { description: t('leadDeleted') });
      setIsDeleteDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to delete lead' });
    }
  };

  const handleSendEmail = (lead) => {
    navigate('/compose', { state: { selectedLead: lead } });
  };

  const downloadLeadPdf = async (leadId) => {
    try {
      const response = await axios.get(`${API}/leads/${leadId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `musteri_${leadId.slice(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('success'), { description: 'PDF downloaded' });
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to download PDF' });
    }
  };

  const openLeadDetails = async (lead) => {
    setIsDetailDialogOpen(true);
    setLoadingDetails(true);
    try {
      const response = await axios.get(`${API}/leads/${lead.id}/details`);
      setLeadDetails(response.data);
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to load details' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const openGoogleMaps = (lead) => {
    const address = `${lead.address || ''} ${lead.city || ''} ${lead.country || ''}`.trim();
    if (!address) {
      toast.error(t('error'), { description: t('noResults') });
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const toggleLeadSelection = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const selectAllLeads = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const openBulkEmailDialog = () => {
    if (selectedLeads.size === 0) {
      toast.error(t('error'), { description: t('selectAll') });
      return;
    }
    setBulkEmailSubject('');
    setBulkEmailBody('');
    setIsBulkEmailOpen(true);
  };

  const sendBulkEmail = async () => {
    setSendingBulkEmail(true);
    let sent = 0;
    let failed = 0;

    for (const leadId of selectedLeads) {
      const lead = leads.find(l => l.id === leadId);
      if (lead?.email) {
        try {
          await axios.post(`${API}/leads/${leadId}/send-email`, {
            subject: bulkEmailSubject,
            body: bulkEmailBody.replace('{company_name}', lead.company_name)
          });
          sent++;
        } catch (error) {
          failed++;
        }
      }
    }

    setSendingBulkEmail(false);
    setIsBulkEmailOpen(false);
    setSelectedLeads(new Set());

    if (sent > 0) {
      toast.success('Başarılı', { description: `${sent} müşteriye email gönderildi` });
    }
    if (failed > 0) {
      toast.warning('Uyarı', { description: `${failed} email gönderilemedi` });
    }
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.company_name.toLowerCase().includes(searchLower) ||
      lead.first_name.toLowerCase().includes(searchLower) ||
      lead.last_name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.city.toLowerCase().includes(searchLower) ||
      lead.country.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="leads-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="leads-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('leads')}</h1>
          <p className="text-muted-foreground mt-1">{leads.length} {t('totalLeads').toLowerCase()}</p>
        </div>
        <div className="flex gap-2">
          {selectedLeads.size > 0 && (
            <Button variant="outline" onClick={openBulkEmailDialog}>
              <Mail className="w-4 h-4 mr-2" />
              {selectedLeads.size} {t('bulkEmail')}
            </Button>
          )}
          <Button variant="outline" onClick={selectAllLeads}>
            {selectedLeads.size === filteredLeads.length ? t('deselectAll') : t('selectAll')}
          </Button>
          <Button onClick={openAddDialog} data-testid="add-lead-btn">
            <Plus className="w-4 h-4 mr-2" />
            {t('addLead')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`${t('search')}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-input"
        />
      </div>

      {/* Leads List */}
      <div data-testid="leads-table-card">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground" data-testid="no-leads">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{searchTerm ? t('noResults') : t('noLeadsYet')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="leads-table">
            {filteredLeads.map((lead) => (
              <Card 
                key={lead.id} 
                className={`hover:shadow-md transition-shadow ${selectedLeads.has(lead.id) ? 'ring-2 ring-orange-400 bg-orange-50/50' : ''}`}
                data-testid={`lead-row-${lead.id}`}
              >
                <CardContent className="p-4">
                  {/* Header: Checkbox & Company */}
                  <div className="flex items-start gap-3 mb-3">
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => toggleLeadSelection(lead.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {lead.first_name?.[0]}{lead.last_name?.[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{lead.company_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.first_name} {lead.last_name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3 pl-7">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('email')}</p>
                      <p className="truncate text-xs font-medium">{lead.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('city')}</p>
                      <p className="truncate text-xs font-medium">{lead.city}, {lead.country}</p>
                    </div>
                    {lead.tax_number && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">{t('taxNumber')}</p>
                        <p className="font-mono text-xs">{lead.tax_number}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50 pl-7">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGoogleMaps(lead)}
                        title="Google Maps"
                        className="h-8 w-8 p-0"
                        data-testid={`navigate-${lead.id}`}
                      >
                        <Navigation className="w-4 h-4 text-orange-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLeadDetails(lead)}
                        title="Detay"
                        className="h-8 w-8 p-0"
                        data-testid={`view-details-${lead.id}`}
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadLeadPdf(lead.id)}
                        title="PDF"
                        className="h-8 w-8 p-0"
                        data-testid={`download-pdf-${lead.id}`}
                      >
                        <FileDown className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendEmail(lead)}
                        title="Email"
                        className="h-8 w-8 p-0"
                        data-testid={`send-email-${lead.id}`}
                      >
                        <Mail className="w-4 h-4 text-indigo-600" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(lead)}
                        className="h-8 w-8 p-0"
                        data-testid={`edit-lead-${lead.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(lead)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        data-testid={`delete-lead-${lead.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="lead-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedLead ? t('editLead') : t('addLead')}
            </DialogTitle>
            <DialogDescription>
              {selectedLead ? 'Update lead information' : 'Add a new lead to your database'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t('firstName')}</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{t('lastName')}</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                data-testid="input-last-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">{t('companyName')}</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_number">{t('taxNumber')}</Label>
              <Input
                id="tax_number"
                name="tax_number"
                value={formData.tax_number}
                onChange={handleInputChange}
                data-testid="input-tax-number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('address')}</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                data-testid="input-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t('city')}</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                data-testid="input-city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('country')}</Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                data-testid="input-country"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="cancel-btn">
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-btn">
              {saving ? 'Saving...' : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteLead')}</AlertDialogTitle>
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

      {/* Lead Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="lead-details-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Customer Details</DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : leadDetails ? (
            <div className="space-y-6">
              {/* Company Info */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                <h3 className="text-xl font-bold text-orange-600">{leadDetails.company_name}</h3>
                <p className="text-lg">{leadDetails.first_name} {leadDetails.last_name}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{leadDetails.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{leadDetails.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p className="font-medium">{leadDetails.city}, {leadDetails.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tax Number</p>
                    <p className="font-medium font-mono">{leadDetails.tax_number || '-'}</p>
                  </div>
                </div>
                {leadDetails.address && (
                  <div className="mt-4">
                    <p className="text-muted-foreground text-sm">Address</p>
                    <p className="font-medium">{leadDetails.address}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{leadDetails.total_orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{leadDetails.total_recipes}</p>
                  <p className="text-xs text-muted-foreground">Recipes</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">€{leadDetails.total_revenue?.toFixed(0) || 0}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>

              {/* Orders */}
              {leadDetails.orders?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Recent Orders ({leadDetails.orders.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {leadDetails.orders.slice(0, 5).map(order => (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <span>{order.product_name}</span>
                        <span className="font-semibold">€{order.total_price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipes */}
              {leadDetails.recipes?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Recipes ({leadDetails.recipes.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {leadDetails.recipes.slice(0, 5).map(recipe => (
                      <div key={recipe.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                        <span>{recipe.name}</span>
                        <span className="text-muted-foreground">{recipe.product_code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {leadDetails.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{leadDetails.notes}</p>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => downloadLeadPdf(leadDetails?.id)}>
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={isBulkEmailOpen} onOpenChange={setIsBulkEmailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Toplu Email Kampanyası</DialogTitle>
            <DialogDescription>
              {selectedLeads.size} müşteriye email gönder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>{selectedLeads.size}</strong> müşteriye aynı anda email gönderilecek
              </p>
            </div>
            <div className="space-y-2">
              <Label>Konu</Label>
              <Input
                value={bulkEmailSubject}
                onChange={(e) => setBulkEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <Textarea
                value={bulkEmailBody}
                onChange={(e) => setBulkEmailBody(e.target.value)}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEmailOpen(false)}>
              İptal
            </Button>
            <Button onClick={sendBulkEmail} disabled={sendingBulkEmail}>
              {sendingBulkEmail ? 'Gönderiliyor...' : `${selectedLeads.size} Email Gönder`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
