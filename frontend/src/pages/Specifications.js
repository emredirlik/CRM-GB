import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Pencil, Trash2, Search, FileText, FileDown, Mail, Eye, Upload, File, Loader2, X, FileUp, Save, RefreshCw, Type, FileOutput } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Specifications = () => {
  const { t, language } = useLanguage();
  const [specs, setSpecs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Text editing states
  const [editedText, setEditedText] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  
  // File upload states
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  
  // Edit form (metadata)
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // Email dialog
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Turkish translations
  const texts = {
    title: language === 'tr' ? 'Ürün Spesifikasyonları' : language === 'de' ? 'Produktspezifikationen' : 'Product Specifications',
    subtitle: language === 'tr' ? 'PDF belgesi - Yükle, Düzenle ve Paylaş' : language === 'de' ? 'PDF Dokumente - Hochladen, Bearbeiten & Teilen' : 'PDF documents - Upload, Edit & Share',
    uploadTitle: language === 'tr' ? 'PDF Spesifikasyonu Yükle' : language === 'de' ? 'PDF-Spezifikation hochladen' : 'Upload PDF Specifications',
    uploadDesc: language === 'tr' ? 'PDF dosyalarını buraya sürükleyin veya dosya seçmek için tıklayın.' : language === 'de' ? 'PDF-Dateien hier ablegen oder klicken zum Auswählen.' : 'Drag and drop PDF files here, or click to browse.',
    uploadHint: language === 'tr' ? 'Metin düzenleme için otomatik olarak çıkarılacak!' : language === 'de' ? 'Text wird automatisch zur Bearbeitung extrahiert!' : 'Text will be automatically extracted for editing!',
    browseFiles: language === 'tr' ? 'Dosya Seç' : language === 'de' ? 'Dateien auswählen' : 'Browse Files',
    uploading: language === 'tr' ? 'Yükleniyor ve Metin Çıkarılıyor...' : language === 'de' ? 'Hochladen & Text extrahieren...' : 'Uploading & Extracting Text...',
    searchPlaceholder: language === 'tr' ? 'Spesifikasyon ara...' : language === 'de' ? 'Spezifikation suchen...' : 'Search specifications...',
    noSpecs: language === 'tr' ? 'Henüz PDF spesifikasyonu yüklenmedi' : language === 'de' ? 'Noch keine PDF-Spezifikationen hochgeladen' : 'No PDF specifications uploaded yet',
    noSpecsHint: language === 'tr' ? 'Başlamak için yukarıya PDF dosyaları sürükleyin' : language === 'de' ? 'PDF-Dateien oben ablegen um zu starten' : 'Drag and drop PDF files above to get started',
    notFound: language === 'tr' ? 'Spesifikasyon bulunamadı' : language === 'de' ? 'Keine Spezifikation gefunden' : 'No specifications found',
    editable: language === 'tr' ? 'Düzenlenebilir' : language === 'de' ? 'Bearbeitbar' : 'Editable',
    editDetails: language === 'tr' ? 'Detayları Düzenle' : language === 'de' ? 'Details bearbeiten' : 'Edit Specification Details',
    displayName: language === 'tr' ? 'Görünen Ad' : language === 'de' ? 'Anzeigename' : 'Display Name',
    description: language === 'tr' ? 'Açıklama' : language === 'de' ? 'Beschreibung' : 'Description',
    descPlaceholder: language === 'tr' ? 'Bu spesifikasyonun kısa açıklaması...' : language === 'de' ? 'Kurze Beschreibung dieser Spezifikation...' : 'Brief description of this specification...',
    notes: language === 'tr' ? 'Notlar' : language === 'de' ? 'Notizen' : 'Notes',
    notesPlaceholder: language === 'tr' ? 'Dahili notlar...' : language === 'de' ? 'Interne Notizen...' : 'Internal notes...',
    cancel: language === 'tr' ? 'İptal' : language === 'de' ? 'Abbrechen' : 'Cancel',
    save: language === 'tr' ? 'Değişiklikleri Kaydet' : language === 'de' ? 'Änderungen speichern' : 'Save Changes',
    saving: language === 'tr' ? 'Kaydediliyor...' : language === 'de' ? 'Speichern...' : 'Saving...',
    pdfPreview: language === 'tr' ? 'PDF Önizleme' : language === 'de' ? 'PDF-Vorschau' : 'PDF Preview',
    editText: language === 'tr' ? 'Metin İçeriği Düzenle' : language === 'de' ? 'Textinhalt bearbeiten' : 'Edit Text Content',
    downloadOriginal: language === 'tr' ? 'Orijinali İndir' : language === 'de' ? 'Original herunterladen' : 'Download Original',
    loadingText: language === 'tr' ? 'Çıkarılan metin yükleniyor...' : language === 'de' ? 'Extrahierter Text wird geladen...' : 'Loading extracted text...',
    editMode: language === 'tr' ? 'Düzenleme Modu:' : language === 'de' ? 'Bearbeitungsmodus:' : 'Edit Mode:',
    editModeDesc: language === 'tr' ? 'Aşağıdaki metni değiştirin ve değişikliklerinizle yeni bir PDF oluşturun. Orijinal PDF korunur.' : language === 'de' ? 'Ändern Sie den Text unten und generieren Sie eine neue PDF mit Ihren Änderungen. Das Original-PDF bleibt erhalten.' : 'Modify the text below and generate a new PDF with your changes. The original PDF is preserved.',
    noTextExtracted: language === 'tr' ? 'Bu PDF\'den metin çıkarılamadı. PDF görüntü tabanlı veya şifreli olabilir.' : language === 'de' ? 'Aus dieser PDF konnte kein Text extrahiert werden. Die PDF könnte bildbasiert oder verschlüsselt sein.' : 'No text could be extracted from this PDF. The PDF might be image-based or encrypted.',
    chars: language === 'tr' ? 'karakter' : language === 'de' ? 'Zeichen' : 'characters',
    pageBreak: language === 'tr' ? '"---SAYFA SONU---" sayfa ayrımlarını işaretler' : language === 'de' ? '"---SEITENUMBRUCH---" markiert Seitentrennungen' : '"---PAGE BREAK---" marks page separations',
    saveText: language === 'tr' ? 'Metni Kaydet' : language === 'de' ? 'Text speichern' : 'Save Text',
    generatePdf: language === 'tr' ? 'Düzenlenmiş PDF Oluştur' : language === 'de' ? 'Bearbeitete PDF generieren' : 'Generate Edited PDF',
    close: language === 'tr' ? 'Kapat' : language === 'de' ? 'Schließen' : 'Close',
    sendEmail: language === 'tr' ? 'E-posta ile Spesifikasyon Gönder' : language === 'de' ? 'Spezifikation per E-Mail senden' : 'Send Specification via Email',
    willBeAttached: language === 'tr' ? 'E-postaya eklenecek' : language === 'de' ? 'Wird der E-Mail angehängt' : 'Will be attached to the email',
    selectCustomer: language === 'tr' ? 'Müşteri Seç *' : language === 'de' ? 'Kunde auswählen *' : 'Select Customer *',
    selectCustomerPlaceholder: language === 'tr' ? 'Bir müşteri seçin' : language === 'de' ? 'Kunde auswählen' : 'Select a customer',
    subject: language === 'tr' ? 'Konu' : language === 'de' ? 'Betreff' : 'Subject',
    message: language === 'tr' ? 'Mesaj' : language === 'de' ? 'Nachricht' : 'Message',
    send: language === 'tr' ? 'E-posta Gönder' : language === 'de' ? 'E-Mail senden' : 'Send Email',
    sending: language === 'tr' ? 'Gönderiliyor...' : language === 'de' ? 'Senden...' : 'Sending...',
    deleteSpec: language === 'tr' ? 'Spesifikasyonu Sil' : language === 'de' ? 'Spezifikation löschen' : 'Delete Specification',
    deleteConfirm: language === 'tr' ? 'silmek istediğinize emin misiniz? Bu işlem geri alınamaz.' : language === 'de' ? 'löschen? Diese Aktion kann nicht rückgängig gemacht werden.' : 'This action cannot be undone.',
    delete: language === 'tr' ? 'Sil' : language === 'de' ? 'Löschen' : 'Delete',
  };

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

  // File drag and drop handlers
  const handleFileDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      toast.error('Only PDF files are allowed');
      return;
    }
    
    await uploadFiles(pdfFiles);
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
    e.target.value = '';
  };

  const uploadFiles = async (files) => {
    setUploadingFile(true);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API}/specifications/upload-pdf`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Add to specs list
        setSpecs(prev => [response.data, ...prev]);
        
        if (response.data.has_text) {
          toast.success(`Uploaded: ${file.name} - Text extracted successfully!`);
        } else {
          toast.success(`Uploaded: ${file.name}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    setUploadingFile(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const openEditDialog = (spec) => {
    setSelectedSpec(spec);
    setEditName(spec.name || spec.filename || '');
    setEditDescription(spec.description || '');
    setEditNotes(spec.notes || '');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (spec) => {
    setSelectedSpec(spec);
    setIsDeleteDialogOpen(true);
  };

  const openPreview = async (spec) => {
    setSelectedSpec(spec);
    setActiveTab('preview');
    setIsPreviewOpen(true);
    
    // Load text content
    setLoadingText(true);
    try {
      const response = await axios.get(`${API}/specifications/${spec.id}/text`);
      setEditedText(response.data.edited_text || response.data.extracted_text || '');
    } catch (error) {
      console.error('Failed to load text:', error);
      setEditedText('');
    } finally {
      setLoadingText(false);
    }
  };

  const openEmailDialog = (spec) => {
    setSelectedSpec(spec);
    const subjectText = language === 'tr' ? 'Ürün Spesifikasyonu:' : language === 'de' ? 'Produktspezifikation:' : 'Product Specification:';
    const bodyText = language === 'tr' 
      ? `Sayın Müşterimiz,\n\nEkli ürün spesifikasyon belgesini bulabilirsiniz.\n\nDosya: ${spec.filename || spec.name}\n\nSaygılarımızla,\nGewürzberg GmbH`
      : language === 'de'
      ? `Sehr geehrter Kunde,\n\nAnbei finden Sie das Produktspezifikationsdokument.\n\nDatei: ${spec.filename || spec.name}\n\nMit freundlichen Grüßen,\nGewürzberg GmbH`
      : `Dear Customer,\n\nPlease find attached the product specification document.\n\nFile: ${spec.filename || spec.name}\n\nBest regards,\nGewürzberg GmbH`;
    setEmailSubject(`${subjectText} ${spec.name || spec.filename}`);
    setEmailBody(bodyText);
    setSelectedLeadId('');
    setIsEmailDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSpec) return;
    
    setSaving(true);
    try {
      await axios.put(`${API}/specifications/${selectedSpec.id}`, {
        name: editName,
        description: editDescription,
        notes: editNotes
      });
      
      // Update local state
      setSpecs(prev => prev.map(s => 
        s.id === selectedSpec.id 
          ? { ...s, name: editName, description: editDescription, notes: editNotes }
          : s
      ));
      
      toast.success('Specification updated');
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update specification');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveText = async () => {
    if (!selectedSpec) return;
    
    setSavingText(true);
    try {
      const formData = new FormData();
      formData.append('edited_text', editedText);
      
      await axios.put(`${API}/specifications/${selectedSpec.id}/text`, formData);
      toast.success('Text saved successfully!');
    } catch (error) {
      toast.error('Failed to save text');
      console.error(error);
    } finally {
      setSavingText(false);
    }
  };

  const handleGenerateEditedPdf = async () => {
    if (!selectedSpec) return;
    
    // First save the text
    setSavingText(true);
    try {
      const formData = new FormData();
      formData.append('edited_text', editedText);
      await axios.put(`${API}/specifications/${selectedSpec.id}/text`, formData);
    } catch (error) {
      toast.error('Failed to save text before generating PDF');
      setSavingText(false);
      return;
    }
    setSavingText(false);
    
    // Then generate PDF
    setGeneratingPdf(true);
    try {
      const response = await axios.get(`${API}/specifications/${selectedSpec.id}/regenerate-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedSpec.name || 'specification'}_edited.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Edited PDF downloaded!');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/specifications/${selectedSpec.id}`);
      setSpecs(prev => prev.filter(s => s.id !== selectedSpec.id));
      toast.success('Specification deleted');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const downloadPdf = async (specId) => {
    try {
      const response = await axios.get(`${API}/specifications/${specId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const spec = specs.find(s => s.id === specId);
      link.setAttribute('download', spec?.filename || `specification_${specId.slice(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const sendEmail = async () => {
    if (!selectedLeadId) {
      toast.error('Please select a customer');
      return;
    }

    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead?.email) {
      toast.error('Customer has no email address');
      return;
    }

    const mailto = `mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailto, '_blank');
    toast.success('Mail uygulaması açıldı');
    setIsEmailDialogOpen(false);
  };

  const filteredSpecs = specs.filter(spec => {
    const searchLower = searchTerm.toLowerCase();
    return (
      spec.name?.toLowerCase().includes(searchLower) ||
      spec.filename?.toLowerCase().includes(searchLower) ||
      spec.description?.toLowerCase().includes(searchLower)
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
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{texts.title}</h1>
          <p className="text-muted-foreground mt-1">{specs.length} {texts.subtitle}</p>
        </div>
      </div>

      {/* Upload Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDraggingFile 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleFileDragEnter}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      >
        <CardContent className="py-12">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="text-center">
            {uploadingFile ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <span className="text-lg">{texts.uploading}</span>
              </div>
            ) : (
              <>
                <FileUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">{texts.uploadTitle}</h3>
                <p className="text-muted-foreground mb-4">
                  {texts.uploadDesc}<br />
                  <span className="text-sm text-orange-600 font-medium">{texts.uploadHint}</span>
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {texts.browseFiles}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      {specs.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={texts.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-specs"
          />
        </div>
      )}

      {/* Specifications Grid */}
      {filteredSpecs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchTerm ? texts.notFound : texts.noSpecs}</p>
            <p className="text-sm mt-1">{texts.noSpecsHint}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpecs.map((spec) => (
            <Card key={spec.id} className="card-hover" data-testid={`spec-card-${spec.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <File className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{spec.name || spec.filename}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(spec.size)} • {spec.filename}
                    </p>
                  </div>
                </div>
                
                {spec.has_text && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 mb-2">
                    <Type className="w-3 h-3 mr-1" />
                    {texts.editable}
                  </Badge>
                )}
                
                {spec.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{spec.description}</p>
                )}
                
                {spec.notes && (
                  <Badge variant="secondary" className="text-xs mb-3">
                    {spec.notes.slice(0, 30)}{spec.notes.length > 30 ? '...' : ''}
                  </Badge>
                )}
                
                <div className="flex items-center justify-end gap-1 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openPreview(spec)} title={texts.pdfPreview}>
                    <Eye className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadPdf(spec.id)} title={texts.downloadOriginal}>
                    <FileDown className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEmailDialog(spec)} title={texts.send}>
                    <Mail className="w-4 h-4 text-purple-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(spec)} title={texts.editDetails}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(spec)} className="text-destructive hover:text-destructive" title={texts.delete}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Metadata Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">{texts.editDetails}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{texts.displayName}</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={texts.displayName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{texts.description}</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder={texts.descPlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{texts.notes}</Label>
              <Input
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={texts.notesPlaceholder}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {texts.cancel}
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? texts.saving : texts.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview & Edit Dialog - Full Screen with Tabs */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="font-['Manrope'] flex items-center gap-2">
              <File className="w-5 h-5 text-red-600" />
              {selectedSpec?.name || selectedSpec?.filename}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="mx-4">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {texts.pdfPreview}
              </TabsTrigger>
              <TabsTrigger value="edit" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                {texts.editText}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="px-4 pb-4 mt-0">
              {selectedSpec && (
                <div className="space-y-4">
                  {/* PDF Embed */}
                  <div className="w-full h-[55vh] border rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                      src={`${API}/specifications/${selectedSpec.id}/download#toolbar=1`}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  </div>
                  
                  {/* File Info */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <File className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-medium text-sm">{selectedSpec.filename}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(selectedSpec.size)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadPdf(selectedSpec?.id)}>
                        <FileDown className="w-4 h-4 mr-2" />
                        {texts.downloadOriginal}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="edit" className="px-4 pb-4 mt-0">
              {selectedSpec && (
                <div className="space-y-4">
                  {loadingText ? (
                    <div className="flex items-center justify-center h-[55vh] bg-muted/30 rounded-lg">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                      <span className="ml-3">{texts.loadingText}</span>
                    </div>
                  ) : (
                    <>
                      {/* Info Banner */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                        <strong>{texts.editMode}</strong> {texts.editModeDesc}
                      </div>
                      
                      {/* Text Editor */}
                      <Textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="h-[45vh] font-mono text-sm resize-none"
                        placeholder={texts.noTextExtracted}
                        data-testid="pdf-text-editor"
                      />
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {editedText.length} {texts.chars} • {texts.pageBreak}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={handleSaveText}
                            disabled={savingText}
                          >
                            {savingText ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
                            {texts.saveText}
                          </Button>
                          <Button 
                            onClick={handleGenerateEditedPdf}
                            disabled={generatingPdf || !editedText}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {generatingPdf ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileOutput className="w-4 h-4 mr-2" />
                            )}
                            {texts.generatePdf}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" onClick={() => openEditDialog(selectedSpec)}>
              <Pencil className="w-4 h-4 mr-2" />
              {texts.editDetails}
            </Button>
            <Button onClick={() => setIsPreviewOpen(false)}>{texts.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">{texts.sendEmail}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <File className="w-8 h-8 text-red-600" />
              <div>
                <p className="font-medium text-sm">{selectedSpec?.name || selectedSpec?.filename}</p>
                <p className="text-xs text-muted-foreground">{texts.willBeAttached}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{texts.selectCustomer}</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder={texts.selectCustomerPlaceholder} />
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
              <Label>{texts.subject}</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{texts.message}</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              {texts.cancel}
            </Button>
            <Button onClick={sendEmail} disabled={sendingEmail}>
              {sendingEmail ? texts.sending : texts.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.deleteSpec}</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedSpec?.name || selectedSpec?.filename}" {texts.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {texts.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Specifications;
