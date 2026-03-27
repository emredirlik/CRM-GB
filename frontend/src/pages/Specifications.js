import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Search, FileText, GripVertical, FileDown, Mail, Eye, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const initialSpecData = {
  name: '',
  product_code: '',
  category: '',
  description: '',
  ingredients: [],
  nutritional_info: '',
  allergens: '',
  storage_instructions: '',
  shelf_life: '',
  certifications: ''
};

const Specifications = () => {
  const [specs, setSpecs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [formData, setFormData] = useState(initialSpecData);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [ingredients, setIngredients] = useState([{ name: '', percentage: '', description: '' }]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [specsRes, leadsRes] = await Promise.all([
        axios.get(`${API}/specifications`),
        axios.get(`${API}/leads`)
      ]);
      setSpecs(specsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', percentage: '', description: '' }]);
  };

  const removeIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  // Drag and drop handlers for ingredients
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newIngredients = [...ingredients];
    const draggedItem = newIngredients[draggedIndex];
    newIngredients.splice(draggedIndex, 1);
    newIngredients.splice(index, 0, draggedItem);
    setIngredients(newIngredients);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const openAddDialog = () => {
    setSelectedSpec(null);
    setFormData(initialSpecData);
    setIngredients([{ name: '', percentage: '', description: '' }]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (spec) => {
    setSelectedSpec(spec);
    setFormData({
      name: spec.name,
      product_code: spec.product_code,
      category: spec.category || '',
      description: spec.description || '',
      nutritional_info: spec.nutritional_info || '',
      allergens: spec.allergens || '',
      storage_instructions: spec.storage_instructions || '',
      shelf_life: spec.shelf_life || '',
      certifications: spec.certifications || ''
    });
    setIngredients(spec.ingredients?.length ? spec.ingredients : [{ name: '', percentage: '', description: '' }]);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (spec) => {
    setSelectedSpec(spec);
    setIsDeleteDialogOpen(true);
  };

  const openPreview = (spec) => {
    setSelectedSpec(spec);
    setIsPreviewOpen(true);
  };

  const openEmailDialog = (spec) => {
    setSelectedSpec(spec);
    setEmailSubject(`Product Specification: ${spec.name} (${spec.product_code})`);
    setEmailBody(`Dear Customer,\n\nPlease find attached the product specification for ${spec.name}.\n\nProduct Code: ${spec.product_code}\nCategory: ${spec.category || 'N/A'}\n\nBest regards,\nGewürzberg GmbH`);
    setSelectedLeadId('');
    setIsEmailDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.product_code) {
      toast.error('Error', { description: 'Name and product code are required' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        ingredients: ingredients.filter(i => i.name.trim())
      };

      if (selectedSpec) {
        await axios.put(`${API}/specifications/${selectedSpec.id}`, payload);
        toast.success('Success', { description: 'Specification updated' });
      } else {
        await axios.post(`${API}/specifications`, payload);
        toast.success('Success', { description: 'Specification created' });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error', { description: error.response?.data?.detail || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/specifications/${selectedSpec.id}`);
      toast.success('Success', { description: 'Specification deleted' });
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error', { description: 'Failed to delete' });
    }
  };

  const downloadPdf = async (specId) => {
    try {
      const response = await axios.get(`${API}/specifications/${specId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `specification_${specId.slice(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Success', { description: 'PDF downloaded' });
    } catch (error) {
      toast.error('Error', { description: 'Failed to download PDF' });
    }
  };

  const sendEmail = async () => {
    if (!selectedLeadId) {
      toast.error('Error', { description: 'Please select a customer' });
      return;
    }

    setSendingEmail(true);
    try {
      await axios.post(`${API}/specifications/${selectedSpec.id}/email`, {
        lead_id: selectedLeadId,
        subject: emailSubject,
        body: emailBody
      });
      toast.success('Success', { description: 'Email sent with specification PDF' });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast.error('Error', { description: error.response?.data?.detail || 'Failed to send email' });
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredSpecs = specs.filter(spec => {
    const searchLower = searchTerm.toLowerCase();
    return (
      spec.name?.toLowerCase().includes(searchLower) ||
      spec.product_code?.toLowerCase().includes(searchLower) ||
      spec.category?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="specs-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="specifications-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Product Specifications</h1>
          <p className="text-muted-foreground mt-1">{specs.length} specifications</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-spec-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Specification
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search specifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-specs"
        />
      </div>

      {/* Specifications Grid */}
      {filteredSpecs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchTerm ? 'No specifications found' : 'No specifications yet'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecs.map((spec) => (
            <Card key={spec.id} className="card-hover" data-testid={`spec-card-${spec.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{spec.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">{spec.product_code}</p>
                  </div>
                  {spec.category && (
                    <Badge variant="secondary" className="text-xs">{spec.category}</Badge>
                  )}
                </div>
                
                {spec.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{spec.description}</p>
                )}
                
                {spec.ingredients?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Ingredients ({spec.ingredients.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {spec.ingredients.slice(0, 3).map((ing, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ing.name} {ing.percentage && `(${ing.percentage}%)`}
                        </Badge>
                      ))}
                      {spec.ingredients.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{spec.ingredients.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-end gap-1 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openPreview(spec)} title="Preview">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadPdf(spec.id)} title="Download PDF">
                    <FileDown className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEmailDialog(spec)} title="Send Email">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(spec)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(spec)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="spec-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedSpec ? 'Edit Specification' : 'New Specification'}
            </DialogTitle>
            <DialogDescription>
              Fill in the product specification details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Gyros Spice Mix"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_code">Product Code *</Label>
                <Input
                  id="product_code"
                  name="product_code"
                  value={formData.product_code}
                  onChange={handleInputChange}
                  placeholder="GYR-001"
                  data-testid="input-code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="Spice Blends"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="Product description..."
              />
            </div>
            
            {/* Ingredients - Drag & Drop */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ingredients (Drag to reorder)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-2 bg-white rounded-md border ${
                      draggedIndex === index ? 'opacity-50 border-primary' : 'border-transparent'
                    } cursor-move`}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      placeholder="Ingredient name"
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="%"
                      value={ing.percentage}
                      onChange={(e) => updateIngredient(index, 'percentage', e.target.value)}
                      className="w-16"
                    />
                    <Input
                      placeholder="Description"
                      value={ing.description}
                      onChange={(e) => updateIngredient(index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allergens">Allergens</Label>
                <Input
                  id="allergens"
                  name="allergens"
                  value={formData.allergens}
                  onChange={handleInputChange}
                  placeholder="Gluten, Soy, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf_life">Shelf Life</Label>
                <Input
                  id="shelf_life"
                  name="shelf_life"
                  value={formData.shelf_life}
                  onChange={handleInputChange}
                  placeholder="24 months"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storage_instructions">Storage Instructions</Label>
              <Input
                id="storage_instructions"
                name="storage_instructions"
                value={formData.storage_instructions}
                onChange={handleInputChange}
                placeholder="Store in a cool, dry place"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nutritional_info">Nutritional Information</Label>
              <Textarea
                id="nutritional_info"
                name="nutritional_info"
                value={formData.nutritional_info}
                onChange={handleInputChange}
                rows={2}
                placeholder="Per 100g: Energy, Protein, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="certifications">Certifications</Label>
              <Input
                id="certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                placeholder="Halal, ISO 22000, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Specification Preview</DialogTitle>
          </DialogHeader>
          {selectedSpec && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
                <h2 className="text-2xl font-bold">{selectedSpec.name}</h2>
                <p className="text-muted-foreground font-mono">{selectedSpec.product_code}</p>
                {selectedSpec.category && <Badge className="mt-2">{selectedSpec.category}</Badge>}
              </div>
              
              {selectedSpec.description && (
                <div>
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedSpec.description}</p>
                </div>
              )}
              
              {selectedSpec.ingredients?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Ingredients</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Ingredient</th>
                        <th className="text-left py-1">%</th>
                        <th className="text-left py-1">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSpec.ingredients.map((ing, i) => (
                        <tr key={i} className="border-b border-dashed">
                          <td className="py-1">{ing.name}</td>
                          <td className="py-1">{ing.percentage || '-'}</td>
                          <td className="py-1 text-muted-foreground">{ing.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedSpec.allergens && (
                  <div>
                    <span className="font-semibold">Allergens:</span> {selectedSpec.allergens}
                  </div>
                )}
                {selectedSpec.shelf_life && (
                  <div>
                    <span className="font-semibold">Shelf Life:</span> {selectedSpec.shelf_life}
                  </div>
                )}
                {selectedSpec.storage_instructions && (
                  <div className="col-span-2">
                    <span className="font-semibold">Storage:</span> {selectedSpec.storage_instructions}
                  </div>
                )}
                {selectedSpec.certifications && (
                  <div className="col-span-2">
                    <span className="font-semibold">Certifications:</span> {selectedSpec.certifications}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => downloadPdf(selectedSpec?.id)}>
              <FileDown className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={() => setIsPreviewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Send Specification via Email</DialogTitle>
            <DialogDescription>
              Send {selectedSpec?.name} specification to a customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Customer *</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name} - {lead.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendEmail} disabled={sendingEmail}>
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Specification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSpec?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Specifications;
