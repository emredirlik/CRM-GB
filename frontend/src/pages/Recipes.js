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
import { Plus, Pencil, Trash2, Search, BookOpen, Copy, ChefHat, Droplets, Timer, Gauge, Package, FileDown, Mail } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const initialFormData = {
  lead_id: '',
  name: '',
  product_code: '',
  meat_amount: 0,
  water_amount: 0,
  spice_amount: 0,
  binding_amount: 0,
  mixing_time: 0,
  motor_speed: 0,
  additional_ingredients: [],
  instructions: '',
  notes: ''
};

const Recipes = () => {
  const { t, language } = useLanguage();
  const [recipes, setRecipes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [newIngredient, setNewIngredient] = useState({ name: '', amount: '', unit: 'kg' });
  const [saving, setSaving] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recipesRes, leadsRes] = await Promise.all([
        axios.get(`${API}/recipes`),
        axios.get(`${API}/leads`)
      ]);
      setRecipes(recipesRes.data);
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

  const openAddDialog = () => {
    setSelectedRecipe(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (recipe) => {
    setSelectedRecipe(recipe);
    setFormData({
      lead_id: recipe.lead_id,
      name: recipe.name,
      product_code: recipe.product_code,
      meat_amount: recipe.meat_amount,
      water_amount: recipe.water_amount,
      spice_amount: recipe.spice_amount,
      binding_amount: recipe.binding_amount,
      mixing_time: recipe.mixing_time,
      motor_speed: recipe.motor_speed,
      additional_ingredients: recipe.additional_ingredients || [],
      instructions: recipe.instructions || '',
      notes: recipe.notes || ''
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (recipe) => {
    setSelectedRecipe(recipe);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (recipe) => {
    setSelectedRecipe(recipe);
    setIsDeleteDialogOpen(true);
  };

  const addIngredient = () => {
    if (newIngredient.name && newIngredient.amount) {
      setFormData(prev => ({
        ...prev,
        additional_ingredients: [
          ...prev.additional_ingredients,
          { ...newIngredient, amount: parseFloat(newIngredient.amount) }
        ]
      }));
      setNewIngredient({ name: '', amount: '', unit: 'kg' });
    }
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_ingredients: prev.additional_ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.lead_id || !formData.name || !formData.product_code) {
      toast.error('Hata', { description: 'Lütfen tüm zorunlu alanları doldurun' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        meat_amount: parseFloat(formData.meat_amount) || 0,
        water_amount: parseFloat(formData.water_amount) || 0,
        spice_amount: parseFloat(formData.spice_amount) || 0,
        binding_amount: parseFloat(formData.binding_amount) || 0,
        mixing_time: parseInt(formData.mixing_time) || 0,
        motor_speed: parseInt(formData.motor_speed) || 0
      };

      if (selectedRecipe) {
        await axios.put(`${API}/recipes/${selectedRecipe.id}`, payload);
        toast.success('Başarılı', { description: 'Reçete güncellendi' });
      } else {
        await axios.post(`${API}/recipes`, payload);
        toast.success('Başarılı', { description: 'Reçete oluşturuldu' });
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
      await axios.delete(`${API}/recipes/${selectedRecipe.id}`);
      toast.success('Başarılı', { description: 'Reçete silindi' });
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Hata', { description: 'Reçete silinemedi' });
    }
  };

  const handleDuplicate = async (recipe) => {
    // Show lead selection for duplication
    const leadId = prompt('Hangi müşteriye kopyalamak istiyorsunuz? Müşteri ID girin veya iptal için boş bırakın.');
    if (leadId) {
      try {
        await axios.post(`${API}/recipes/${recipe.id}/duplicate?new_lead_id=${leadId}`);
        toast.success('Başarılı', { description: 'Reçete kopyalandı' });
        fetchData();
      } catch (error) {
        toast.error('Hata', { description: 'Reçete kopyalanamadı' });
      }
    }
  };

  const downloadRecipePdf = async (recipeId) => {
    try {
      const response = await axios.get(`${API}/recipes/${recipeId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recete_${recipeId.slice(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Başarılı', { description: 'PDF indirildi' });
    } catch (error) {
      toast.error('Hata', { description: 'PDF indirilemedi' });
    }
  };

  const openEmailDialog = (recipe) => {
    setSelectedRecipe(recipe);
    const lead = leads.find(l => l.id === recipe.lead_id);
    setSelectedLeadId(recipe.lead_id || '');
    setEmailSubject(`Reçete: ${recipe.name} (${recipe.product_code})`);
    setEmailBody(`Sayın ${lead?.company_name || 'Müşteri'},\n\nEkte ${recipe.name} reçetesini bulabilirsiniz.\n\nÜrün Kodu: ${recipe.product_code}\n\nSaygılarımızla,\nGewürzberg GmbH`);
    setIsEmailDialogOpen(true);
  };

  const sendRecipeEmail = async () => {
    if (!selectedLeadId) {
      toast.error('Hata', { description: 'Lütfen müşteri seçin' });
      return;
    }

    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead?.email) {
      toast.error('Hata', { description: 'Müşterinin email adresi yok' });
      return;
    }

    setSendingEmail(true);
    try {
      await axios.post(`${API}/recipes/${selectedRecipe.id}/email?to_email=${encodeURIComponent(lead.email)}`);
      toast.success('Başarılı', { description: 'Reçete email ile gönderildi' });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast.error('Hata', { description: error.response?.data?.detail || 'Email gönderilemedi' });
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const searchLower = searchTerm.toLowerCase();
    return (
      recipe.name?.toLowerCase().includes(searchLower) ||
      recipe.company_name?.toLowerCase().includes(searchLower) ||
      recipe.product_code?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="recipes-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="recipes-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Reçeteler</h1>
          <p className="text-muted-foreground mt-1">{recipes.length} müşteri reçetesi</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-recipe-btn">
          <Plus className="w-4 h-4 mr-2" />
          Reçete Ekle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Reçete ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-recipes"
        />
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchTerm ? 'Reçete bulunamadı' : 'Henüz reçete yok'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} className="card-hover cursor-pointer" onClick={() => openViewDialog(recipe)} data-testid={`recipe-card-${recipe.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-['Manrope']">{recipe.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{recipe.company_name}</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{recipe.product_code}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-red-500" />
                    <span>Et: {recipe.meat_amount} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span>Su: {recipe.water_amount} L</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    <span>Baharat: {recipe.spice_amount} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-500" />
                    <span>Binding: {recipe.binding_amount} kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-green-500" />
                    <span>{recipe.mixing_time} dk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    <span>{recipe.motor_speed} rpm</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => downloadRecipePdf(recipe.id)} title="PDF İndir">
                    <FileDown className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEmailDialog(recipe)} title="Email Gönder">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(recipe)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicate(recipe)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(recipe)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Recipe Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="view-recipe-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope'] flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {selectedRecipe?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedRecipe?.company_name} • {selectedRecipe?.product_code}
            </DialogDescription>
          </DialogHeader>
          {selectedRecipe && (
            <div className="space-y-6 py-4">
              {/* Ana Malzemeler */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ChefHat className="w-5 h-5 text-red-600" />
                    <span className="font-medium">Et Miktarı</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.meat_amount} kg</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Su Miktarı</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.water_amount} L</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Baharat Miktarı</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.spice_amount} kg</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Binding Miktarı</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.binding_amount} kg</p>
                </div>
              </div>

              {/* Üretim Parametreleri */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Karışım Süresi</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.mixing_time} dakika</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Motor Hızı</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.motor_speed} rpm</p>
                </div>
              </div>

              {/* Ek Malzemeler */}
              {selectedRecipe.additional_ingredients?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Ek Malzemeler</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.additional_ingredients.map((ing, i) => (
                      <Badge key={i} variant="secondary">
                        {ing.name}: {ing.amount} {ing.unit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Talimatlar */}
              {selectedRecipe.instructions && (
                <div>
                  <h4 className="font-medium mb-2">Üretim Talimatları</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedRecipe.instructions}
                  </p>
                </div>
              )}

              {/* Notlar */}
              {selectedRecipe.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notlar</h4>
                  <p className="text-sm text-muted-foreground">{selectedRecipe.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="recipe-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedRecipe ? 'Reçete Düzenle' : 'Yeni Reçete'}
            </DialogTitle>
            <DialogDescription>
              Müşteriye özel üretim reçetesi oluşturun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Müşteri ve Temel Bilgiler */}
            <div className="grid grid-cols-3 gap-4">
              {!selectedRecipe && (
                <div className="space-y-2">
                  <Label>Müşteri *</Label>
                  <Select value={formData.lead_id} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((lead) => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.company_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Reçete Adı *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Gyros Özel Karışım"
                />
              </div>
              <div className="space-y-2">
                <Label>Ürün Kodu *</Label>
                <Input
                  name="product_code"
                  value={formData.product_code}
                  onChange={handleInputChange}
                  placeholder="GYR-OZEL-001"
                />
              </div>
            </div>

            {/* Ana Malzemeler */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Ana Malzemeler</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-red-500" />
                    Et Miktarı (kg)
                  </Label>
                  <Input
                    name="meat_amount"
                    type="number"
                    step="0.1"
                    value={formData.meat_amount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Su Miktarı (L)
                  </Label>
                  <Input
                    name="water_amount"
                    type="number"
                    step="0.1"
                    value={formData.water_amount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" />
                    Baharat Miktarı (kg)
                  </Label>
                  <Input
                    name="spice_amount"
                    type="number"
                    step="0.01"
                    value={formData.spice_amount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-500" />
                    Binding Miktarı (kg)
                  </Label>
                  <Input
                    name="binding_amount"
                    type="number"
                    step="0.01"
                    value={formData.binding_amount}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Üretim Parametreleri */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Üretim Parametreleri</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-green-500" />
                    Karışım Süresi (dakika)
                  </Label>
                  <Input
                    name="mixing_time"
                    type="number"
                    value={formData.mixing_time}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    Motor Hızı (rpm)
                  </Label>
                  <Input
                    name="motor_speed"
                    type="number"
                    value={formData.motor_speed}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Ek Malzemeler */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="font-medium">Ek Malzemeler</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Malzeme adı"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  placeholder="Miktar"
                  type="number"
                  step="0.01"
                  value={newIngredient.amount}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-24"
                />
                <Select value={newIngredient.unit} onValueChange={(value) => setNewIngredient(prev => ({ ...prev, unit: value }))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={addIngredient}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.additional_ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.additional_ingredients.map((ing, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeIngredient(i)}>
                      {ing.name}: {ing.amount} {ing.unit} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Talimatlar */}
            <div className="space-y-2">
              <Label>Üretim Talimatları</Label>
              <Textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={3}
                placeholder="Üretim adımlarını yazın..."
              />
            </div>

            {/* Notlar */}
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder="Ek notlar..."
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
            <AlertDialogTitle>Reçeteyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu reçeteyi silmek istediğinize emin misiniz?
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

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Reçeteyi Email ile Gönder</DialogTitle>
            <DialogDescription>
              {selectedRecipe?.name} reçetesini müşteriye email ile gönderin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <BookOpen className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-medium text-sm">{selectedRecipe?.name}</p>
                <p className="text-xs text-muted-foreground">PDF olarak eklenecek</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Müşteri Seçin *</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
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
              <Label>Konu</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mesaj</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={sendRecipeEmail} disabled={sendingEmail}>
              {sendingEmail ? 'Gönderiliyor...' : 'Email Gönder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;
