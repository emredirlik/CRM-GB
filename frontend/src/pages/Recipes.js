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
import { Plus, Pencil, Trash2, Search, BookOpen, Copy, ChefHat, Droplets, Timer, Gauge, Package, FileDown, Mail, LayoutGrid, List, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// Multi-language texts for Recipes
const texts = {
  tr: {
    title: 'Reçeteler',
    subtitle: 'müşteri reçetesi',
    addRecipe: 'Reçete Ekle',
    searchPlaceholder: 'Reçete ara...',
    noRecipesFound: 'Reçete bulunamadı',
    noRecipesYet: 'Henüz reçete yok',
    newRecipe: 'Yeni Reçete',
    editRecipe: 'Reçete Düzenle',
    recipeDescription: 'Müşteriye özel üretim reçetesi oluşturun',
    customer: 'Müşteri',
    selectCustomer: 'Müşteri seçin',
    recipeName: 'Reçete Adı',
    productCode: 'Ürün Kodu',
    mainIngredients: 'Ana Malzemeler',
    meatAmount: 'Et Miktarı',
    waterAmount: 'Su Miktarı',
    spiceAmount: 'Baharat Miktarı',
    bindingAmount: 'Binding Miktarı',
    productionParams: 'Üretim Parametreleri',
    mixingTime: 'Karışım Süresi',
    motorSpeed: 'Motor Hızı',
    additionalIngredients: 'Ek Malzemeler',
    ingredientName: 'Malzeme adı',
    amount: 'Miktar',
    productionInstructions: 'Üretim Talimatları',
    notes: 'Notlar',
    cancel: 'İptal',
    saving: 'Kaydediliyor...',
    save: 'Kaydet',
    deleteRecipe: 'Reçeteyi Sil',
    deleteConfirm: 'Bu reçeteyi silmek istediğinize emin misiniz?',
    delete: 'Sil',
    sendByEmail: 'Reçeteyi Email ile Gönder',
    sendEmailDesc: 'reçetesini müşteriye email ile gönderin',
    selectCustomerRequired: 'Müşteri Seçin',
    language: 'Dil / Language',
    subject: 'Konu',
    message: 'Mesaj',
    sendEmail: 'Email Gönder',
    sending: 'Gönderiliyor...',
    pdfAttached: 'PDF olarak eklenecek',
    fillRequired: 'Lütfen tüm zorunlu alanları doldurun',
    recipeCreated: 'Reçete oluşturuldu',
    recipeUpdated: 'Reçete güncellendi',
    recipeDeleted: 'Reçete silindi',
    recipeDuplicated: 'Reçete kopyalandı',
    pdfDownloaded: 'PDF indirildi',
    pdfFailed: 'PDF indirilemedi',
    emailSent: 'Reçete email ile gönderildi',
    emailFailed: 'Email gönderilemedi',
    noEmail: 'Müşterinin email adresi yok',
    minute: 'dakika',
    duplicatePrompt: 'Hangi müşteriye kopyalamak istiyorsunuz? Müşteri ID girin veya iptal için boş bırakın.',
    error: 'Hata',
    success: 'Başarılı'
  },
  en: {
    title: 'Recipes',
    subtitle: 'customer recipe',
    addRecipe: 'Add Recipe',
    searchPlaceholder: 'Search recipes...',
    noRecipesFound: 'No recipes found',
    noRecipesYet: 'No recipes yet',
    newRecipe: 'New Recipe',
    editRecipe: 'Edit Recipe',
    recipeDescription: 'Create a custom production recipe for the customer',
    customer: 'Customer',
    selectCustomer: 'Select customer',
    recipeName: 'Recipe Name',
    productCode: 'Product Code',
    mainIngredients: 'Main Ingredients',
    meatAmount: 'Meat Amount',
    waterAmount: 'Water Amount',
    spiceAmount: 'Spice Amount',
    bindingAmount: 'Binding Amount',
    productionParams: 'Production Parameters',
    mixingTime: 'Mixing Time',
    motorSpeed: 'Motor Speed',
    additionalIngredients: 'Additional Ingredients',
    ingredientName: 'Ingredient name',
    amount: 'Amount',
    productionInstructions: 'Production Instructions',
    notes: 'Notes',
    cancel: 'Cancel',
    saving: 'Saving...',
    save: 'Save',
    deleteRecipe: 'Delete Recipe',
    deleteConfirm: 'Are you sure you want to delete this recipe?',
    delete: 'Delete',
    sendByEmail: 'Send Recipe by Email',
    sendEmailDesc: 'recipe to customer via email',
    selectCustomerRequired: 'Select Customer',
    language: 'Language',
    subject: 'Subject',
    message: 'Message',
    sendEmail: 'Send Email',
    sending: 'Sending...',
    pdfAttached: 'Will be attached as PDF',
    fillRequired: 'Please fill all required fields',
    recipeCreated: 'Recipe created',
    recipeUpdated: 'Recipe updated',
    recipeDeleted: 'Recipe deleted',
    recipeDuplicated: 'Recipe duplicated',
    pdfDownloaded: 'PDF downloaded',
    pdfFailed: 'PDF could not be downloaded',
    emailSent: 'Recipe sent via email',
    emailFailed: 'Email could not be sent',
    noEmail: 'Customer does not have an email address',
    minute: 'minute',
    duplicatePrompt: 'Which customer to copy to? Enter customer ID or leave empty to cancel.',
    error: 'Error',
    success: 'Success'
  },
  de: {
    title: 'Rezepte',
    subtitle: 'Kundenrezept',
    addRecipe: 'Rezept hinzufügen',
    searchPlaceholder: 'Rezepte suchen...',
    noRecipesFound: 'Keine Rezepte gefunden',
    noRecipesYet: 'Noch keine Rezepte',
    newRecipe: 'Neues Rezept',
    editRecipe: 'Rezept bearbeiten',
    recipeDescription: 'Erstellen Sie ein kundenspezifisches Produktionsrezept',
    customer: 'Kunde',
    selectCustomer: 'Kunde auswählen',
    recipeName: 'Rezeptname',
    productCode: 'Produktcode',
    mainIngredients: 'Hauptzutaten',
    meatAmount: 'Fleischmenge',
    waterAmount: 'Wassermenge',
    spiceAmount: 'Gewürzmenge',
    bindingAmount: 'Bindungsmenge',
    productionParams: 'Produktionsparameter',
    mixingTime: 'Mischzeit',
    motorSpeed: 'Motorgeschwindigkeit',
    additionalIngredients: 'Zusätzliche Zutaten',
    ingredientName: 'Zutatname',
    amount: 'Menge',
    productionInstructions: 'Produktionsanweisungen',
    notes: 'Notizen',
    cancel: 'Abbrechen',
    saving: 'Speichern...',
    save: 'Speichern',
    deleteRecipe: 'Rezept löschen',
    deleteConfirm: 'Möchten Sie dieses Rezept wirklich löschen?',
    delete: 'Löschen',
    sendByEmail: 'Rezept per E-Mail senden',
    sendEmailDesc: 'Rezept per E-Mail an den Kunden senden',
    selectCustomerRequired: 'Kunde auswählen',
    language: 'Sprache',
    subject: 'Betreff',
    message: 'Nachricht',
    sendEmail: 'E-Mail senden',
    sending: 'Senden...',
    pdfAttached: 'Wird als PDF angehängt',
    fillRequired: 'Bitte füllen Sie alle Pflichtfelder aus',
    recipeCreated: 'Rezept erstellt',
    recipeUpdated: 'Rezept aktualisiert',
    recipeDeleted: 'Rezept gelöscht',
    recipeDuplicated: 'Rezept dupliziert',
    pdfDownloaded: 'PDF heruntergeladen',
    pdfFailed: 'PDF konnte nicht heruntergeladen werden',
    emailSent: 'Rezept per E-Mail gesendet',
    emailFailed: 'E-Mail konnte nicht gesendet werden',
    noEmail: 'Kunde hat keine E-Mail-Adresse',
    minute: 'Minute',
    duplicatePrompt: 'Zu welchem Kunden kopieren? Geben Sie die Kunden-ID ein oder lassen Sie das Feld leer.',
    error: 'Fehler',
    success: 'Erfolg'
  },
  pl: {
    title: 'Przepisy',
    subtitle: 'przepis klienta',
    addRecipe: 'Dodaj przepis',
    searchPlaceholder: 'Szukaj przepisów...',
    noRecipesFound: 'Nie znaleziono przepisów',
    noRecipesYet: 'Brak przepisów',
    newRecipe: 'Nowy przepis',
    editRecipe: 'Edytuj przepis',
    recipeDescription: 'Utwórz niestandardowy przepis produkcyjny dla klienta',
    customer: 'Klient',
    selectCustomer: 'Wybierz klienta',
    recipeName: 'Nazwa przepisu',
    productCode: 'Kod produktu',
    mainIngredients: 'Główne składniki',
    meatAmount: 'Ilość mięsa',
    waterAmount: 'Ilość wody',
    spiceAmount: 'Ilość przypraw',
    bindingAmount: 'Ilość wiązania',
    productionParams: 'Parametry produkcji',
    mixingTime: 'Czas mieszania',
    motorSpeed: 'Prędkość silnika',
    additionalIngredients: 'Dodatkowe składniki',
    ingredientName: 'Nazwa składnika',
    amount: 'Ilość',
    productionInstructions: 'Instrukcje produkcji',
    notes: 'Notatki',
    cancel: 'Anuluj',
    saving: 'Zapisywanie...',
    save: 'Zapisz',
    deleteRecipe: 'Usuń przepis',
    deleteConfirm: 'Czy na pewno chcesz usunąć ten przepis?',
    delete: 'Usuń',
    sendByEmail: 'Wyślij przepis e-mailem',
    sendEmailDesc: 'przepis do klienta e-mailem',
    selectCustomerRequired: 'Wybierz klienta',
    language: 'Język',
    subject: 'Temat',
    message: 'Wiadomość',
    sendEmail: 'Wyślij e-mail',
    sending: 'Wysyłanie...',
    pdfAttached: 'Zostanie załączony jako PDF',
    fillRequired: 'Proszę wypełnić wszystkie wymagane pola',
    recipeCreated: 'Przepis utworzony',
    recipeUpdated: 'Przepis zaktualizowany',
    recipeDeleted: 'Przepis usunięty',
    recipeDuplicated: 'Przepis zduplikowany',
    pdfDownloaded: 'PDF pobrany',
    pdfFailed: 'Nie można pobrać PDF',
    emailSent: 'Przepis wysłany e-mailem',
    emailFailed: 'Nie można wysłać e-maila',
    noEmail: 'Klient nie ma adresu e-mail',
    minute: 'minuta',
    duplicatePrompt: 'Do którego klienta skopiować? Wprowadź ID klienta lub zostaw puste, aby anulować.',
    error: 'Błąd',
    success: 'Sukces'
  }
};

const Recipes = () => {
  const { t: tLang, language } = useLanguage();
  const txt = texts[language] || texts.en;
  const [recipes, setRecipes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
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
  const [emailLang, setEmailLang] = useState('tr'); // Language for email translation

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
      toast.error(txt.error, { description: txt.fillRequired });
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
        toast.success(txt.success, { description: txt.recipeUpdated });
      } else {
        await axios.post(`${API}/recipes`, payload);
        toast.success(txt.success, { description: txt.recipeCreated });
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(txt.error, { description: error.response?.data?.detail || txt.error });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/recipes/${selectedRecipe.id}`);
      toast.success(txt.success, { description: txt.recipeDeleted });
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(txt.error, { description: txt.error });
    }
  };

  const handleDuplicate = async (recipe) => {
    // Show lead selection for duplication
    const leadId = prompt(txt.duplicatePrompt);
    if (leadId) {
      try {
        await axios.post(`${API}/recipes/${recipe.id}/duplicate?new_lead_id=${leadId}`);
        toast.success(txt.success, { description: txt.recipeDuplicated });
        fetchData();
      } catch (error) {
        toast.error(txt.error, { description: txt.error });
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
      toast.success(txt.success, { description: txt.pdfDownloaded });
    } catch (error) {
      toast.error(txt.error, { description: txt.pdfFailed });
    }
  };

  const openEmailDialog = (recipe) => {
    setSelectedRecipe(recipe);
    const lead = leads.find(l => l.id === recipe.lead_id);
    setSelectedLeadId(recipe.lead_id || '');
    setEmailLang('tr'); // Default to Turkish
    
    // Set email content based on language
    const langTemplates = {
      tr: {
        subject: `Reçete: ${recipe.name} (${recipe.product_code})`,
        body: `Sayın ${lead?.company || 'Müşteri'},\n\nEkte ${recipe.name} reçetesini bulabilirsiniz.\n\nÜrün Kodu: ${recipe.product_code}\n\nSaygılarımızla,\nGewürzberg GmbH`
      },
      de: {
        subject: `Rezept: ${recipe.name} (${recipe.product_code})`,
        body: `Sehr geehrte/r ${lead?.company || 'Kunde'},\n\nim Anhang finden Sie das Rezept für ${recipe.name}.\n\nProduktcode: ${recipe.product_code}\n\nMit freundlichen Grüßen,\nGewürzberg GmbH`
      },
      en: {
        subject: `Recipe: ${recipe.name} (${recipe.product_code})`,
        body: `Dear ${lead?.company || 'Customer'},\n\nPlease find attached the recipe for ${recipe.name}.\n\nProduct Code: ${recipe.product_code}\n\nBest regards,\nGewürzberg GmbH`
      },
      pl: {
        subject: `Przepis: ${recipe.name} (${recipe.product_code})`,
        body: `Szanowni Państwo ${lead?.company || 'Klient'},\n\nW załączniku znajduje się przepis na ${recipe.name}.\n\nKod produktu: ${recipe.product_code}\n\nZ poważaniem,\nGewürzberg GmbH`
      }
    };
    
    setEmailSubject(langTemplates.tr.subject);
    setEmailBody(langTemplates.tr.body);
    setIsEmailDialogOpen(true);
  };

  const updateEmailLanguage = (lang) => {
    setEmailLang(lang);
    const lead = leads.find(l => l.id === selectedLeadId);
    
    const langTemplates = {
      tr: {
        subject: `Reçete: ${selectedRecipe?.name} (${selectedRecipe?.product_code})`,
        body: `Sayın ${lead?.company || 'Müşteri'},\n\nEkte ${selectedRecipe?.name} reçetesini bulabilirsiniz.\n\nÜrün Kodu: ${selectedRecipe?.product_code}\n\nSaygılarımızla,\nGewürzberg GmbH`
      },
      de: {
        subject: `Rezept: ${selectedRecipe?.name} (${selectedRecipe?.product_code})`,
        body: `Sehr geehrte/r ${lead?.company || 'Kunde'},\n\nim Anhang finden Sie das Rezept für ${selectedRecipe?.name}.\n\nProduktcode: ${selectedRecipe?.product_code}\n\nMit freundlichen Grüßen,\nGewürzberg GmbH`
      },
      en: {
        subject: `Recipe: ${selectedRecipe?.name} (${selectedRecipe?.product_code})`,
        body: `Dear ${lead?.company || 'Customer'},\n\nPlease find attached the recipe for ${selectedRecipe?.name}.\n\nProduct Code: ${selectedRecipe?.product_code}\n\nBest regards,\nGewürzberg GmbH`
      },
      pl: {
        subject: `Przepis: ${selectedRecipe?.name} (${selectedRecipe?.product_code})`,
        body: `Szanowni Państwo ${lead?.company || 'Klient'},\n\nW załączniku znajduje się przepis na ${selectedRecipe?.name}.\n\nKod produktu: ${selectedRecipe?.product_code}\n\nZ poważaniem,\nGewürzberg GmbH`
      }
    };
    
    setEmailSubject(langTemplates[lang].subject);
    setEmailBody(langTemplates[lang].body);
  };

  const sendRecipeEmail = async () => {
    if (!selectedLeadId) {
      toast.error(txt.error, { description: txt.selectCustomerRequired });
      return;
    }

    const lead = leads.find(l => l.id === selectedLeadId);
    setSendingEmail(true);
    
    try {
      // Get PDF
      const pdfResponse = await axios.get(`${API}/recipes/${selectedRecipe.id}/pdf`, {
        responseType: 'blob'
      });
      
      const formData = new FormData();
      formData.append('to', lead?.email || '');
      formData.append('subject', emailSubject);
      formData.append('body', emailBody);
      formData.append('attachments', new Blob([pdfResponse.data], { type: 'application/pdf' }), `recete_${selectedRecipe.id.slice(0,8)}.pdf`);
      
      const response = await axios.post(`${API}/mail/send-to-drafts`, formData);
      toast.success(txt.success, { description: response.data.message });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast.error(txt.error, { description: error.response?.data?.detail || 'Mail hazırlanamadı' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-['Manrope']">{txt.title}</h1>
          <p className="text-muted-foreground mt-1">{recipes.length} {txt.subtitle}</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-recipe-btn">
          <Plus className="w-4 h-4 mr-2" />
          {txt.addRecipe}
        </Button>
      </div>

      {/* Search & View Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={txt.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-recipes"
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

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchTerm ? txt.noRecipesFound : txt.noRecipesYet}</p>
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
                    <span className="font-medium">{txt.meatAmount}</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.meat_amount} kg</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{txt.waterAmount}</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.water_amount} L</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">{txt.spiceAmount}</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.spice_amount} kg</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">{txt.bindingAmount}</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.binding_amount} kg</p>
                </div>
              </div>

              {/* Üretim Parametreleri */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-5 h-5 text-green-600" />
                    <span className="font-medium">{txt.mixingTime}</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.mixing_time} {txt.minute}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{txt.motorSpeed}</span>
                  </div>
                  <p className="text-2xl font-bold">{selectedRecipe.motor_speed} rpm</p>
                </div>
              </div>

              {/* Ek Malzemeler */}
              {selectedRecipe.additional_ingredients?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{txt.additionalIngredients}</h4>
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
                  <h4 className="font-medium mb-2">{txt.productionInstructions}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedRecipe.instructions}
                  </p>
                </div>
              )}

              {/* Notlar */}
              {selectedRecipe.notes && (
                <div>
                  <h4 className="font-medium mb-2">{txt.notes}</h4>
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
              {selectedRecipe ? txt.editRecipe : txt.newRecipe}
            </DialogTitle>
            <DialogDescription>
              {txt.recipeDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Müşteri ve Temel Bilgiler */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {!selectedRecipe && (
                <div className="space-y-2">
                  <Label>{txt.customer} *</Label>
                  <Select value={formData.lead_id} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={txt.selectCustomer} />
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
                <Label>{txt.recipeName} *</Label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Gyros Özel Karışım"
                />
              </div>
              <div className="space-y-2">
                <Label>{txt.productCode} *</Label>
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
              <h4 className="font-medium">{txt.mainIngredients}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-red-500" />
                    {txt.meatAmount} (kg)
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
                    {txt.waterAmount} (L)
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
                    {txt.spiceAmount} (kg)
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
                    {txt.bindingAmount} (kg)
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
              <h4 className="font-medium">{txt.productionParams}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-green-500" />
                    {txt.mixingTime} ({txt.minute})
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
                    {txt.motorSpeed} (rpm)
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
              <h4 className="font-medium">{txt.additionalIngredients}</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder={txt.ingredientName}
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  placeholder={txt.amount}
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
              <Label>{txt.productionInstructions}</Label>
              <Textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows={3}
                placeholder={txt.productionInstructions}
              />
            </div>

            {/* Notlar */}
            <div className="space-y-2">
              <Label>{txt.notes}</Label>
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder={txt.notes}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {txt.cancel}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? txt.saving : txt.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{txt.deleteRecipe}</AlertDialogTitle>
            <AlertDialogDescription>
              {txt.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{txt.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {txt.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">{txt.sendByEmail}</DialogTitle>
            <DialogDescription>
              {selectedRecipe?.name} {txt.sendEmailDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <BookOpen className="w-8 h-8 text-orange-600" />
              <div>
                <p className="font-medium text-sm">{selectedRecipe?.name}</p>
                <p className="text-xs text-muted-foreground">{txt.pdfAttached}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{txt.selectCustomerRequired} *</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder={txt.selectCustomer} />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company || lead.company_name} - {lead.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{txt.language}</Label>
              <Select value={emailLang} onValueChange={updateEmailLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={txt.language} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="pl">🇵🇱 Polski</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{txt.subject}</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{txt.message}</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              {txt.cancel}
            </Button>
            <Button onClick={sendRecipeEmail} disabled={sendingEmail}>
              {sendingEmail ? txt.sending : txt.sendEmail}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recipes;
