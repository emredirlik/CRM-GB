import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLeads, createLead, updateLead, deleteLead } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Pencil, Trash2, Mail, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('leads')}</h1>
          <p className="text-muted-foreground mt-1">{leads.length} {t('totalLeads').toLowerCase()}</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-lead-btn">
          <Plus className="w-4 h-4 mr-2" />
          {t('addLead')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-input"
        />
      </div>

      {/* Leads Table */}
      <Card data-testid="leads-table-card">
        <CardContent className="p-0">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="no-leads">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{searchTerm ? 'No leads found' : t('noLeadsYet')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table" data-testid="leads-table">
                <thead>
                  <tr>
                    <th>{t('companyName')}</th>
                    <th>{t('firstName')} {t('lastName')}</th>
                    <th>{t('email')}</th>
                    <th>{t('taxNumber')}</th>
                    <th>{t('city')}</th>
                    <th>{t('country')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                      <td className="font-medium">{lead.company_name}</td>
                      <td>{lead.first_name} {lead.last_name}</td>
                      <td className="text-muted-foreground">{lead.email}</td>
                      <td className="text-muted-foreground font-mono text-xs">{lead.tax_number}</td>
                      <td>{lead.city}</td>
                      <td>{lead.country}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(lead)}
                            data-testid={`send-email-${lead.id}`}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(lead)}
                            data-testid={`edit-lead-${lead.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(lead)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`delete-lead-${lead.id}`}
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
        <DialogContent className="max-w-2xl" data-testid="lead-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedLead ? t('editLead') : t('addLead')}
            </DialogTitle>
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
    </div>
  );
};

export default Leads;
