import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Receipt, Upload, Folder, FolderPlus, FileText, Trash2, 
  Eye, Download, Search, Plus, MoreVertical, Calendar,
  CreditCard, Building2, Fuel, LayoutGrid, List, Euro, FileSpreadsheet, Camera, ScanLine, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import DocumentScanner from '@/components/DocumentScanner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EXPENSE_CATEGORIES = [
  { id: 'hotel', name: 'Otel', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { id: 'credit_card', name: 'Kredi Kartı', icon: CreditCard, color: 'bg-purple-100 text-purple-700' },
  { id: 'dkv', name: 'DKV', icon: Fuel, color: 'bg-orange-100 text-orange-700' },
  { id: 'other', name: 'Diğer Giderler', icon: Receipt, color: 'bg-gray-100 text-gray-700' },
];

const Expenses = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, daily, monthly, yearly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Dialog states
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false); // CamScanner style camera
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  
  // Form states
  const [folderName, setFolderName] = useState('');
  const [uploadData, setUploadData] = useState({
    category: 'other',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    folder_id: '',
    country: '',
    address: '',
    notes: '',
    local_currency: '',
    invoice_name: ''
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    fetchExpenses();
    fetchFolders();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API}/expenses`);
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Fetch expenses error:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await axios.get(`${API}/expense-folders`);
      setFolders(response.data || []);
    } catch (error) {
      console.error('Fetch folders error:', error);
      setFolders([]);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast.error('Klasör adı gerekli');
      return;
    }
    try {
      await axios.post(`${API}/expense-folders`, { 
        name: folderName,
        category: selectedCategory !== 'all' ? selectedCategory : 'other'
      });
      toast.success('Klasör oluşturuldu');
      setFolderName('');
      setIsFolderOpen(false);
      fetchFolders();
    } catch (error) {
      toast.error('Klasör oluşturulamadı');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await axios.delete(`${API}/expense-folders/${folderId}`);
      toast.success('Klasör silindi');
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      fetchFolders();
    } catch (error) {
      toast.error('Klasör silinemedi');
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Dosya seçin');
      return;
    }
    
    setUploading(true);
    try {
      let extractedInfo = null;
      for (const file of uploadFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', uploadData.category);
        formData.append('description', uploadData.description);
        formData.append('amount', uploadData.amount || '0');
        formData.append('date', uploadData.date || '');
        formData.append('country', uploadData.country || '');
        formData.append('address', uploadData.address || '');
        formData.append('notes', uploadData.notes || '');
        formData.append('local_currency', uploadData.local_currency || '');
        formData.append('invoice_name', uploadData.invoice_name || '');
        formData.append('auto_extract', 'true');
        if (uploadData.folder_id) {
          formData.append('folder_id', uploadData.folder_id);
        }
        
        const response = await axios.post(`${API}/expenses/upload`, formData);
        if (response.data.extracted) {
          extractedInfo = response.data.extracted;
        }
      }
      
      if (extractedInfo && (extractedInfo.date || extractedInfo.amount)) {
        toast.success(`Yüklendi! Çıkarılan: ${extractedInfo.date || ''} - ${extractedInfo.amount || ''}€`);
      } else {
        toast.success(`${uploadFiles.length} dosya yüklendi`);
      }
      setUploadFiles([]);
      setUploadData({
        category: 'other', description: '', amount: '', date: new Date().toISOString().split('T')[0],
        folder_id: '', country: '', address: '', notes: '', local_currency: '', invoice_name: ''
      });
      setIsUploadOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Yükleme hatası: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      await axios.delete(`${API}/expenses/${selectedExpense.id}`);
      toast.success('Gider silindi');
      setIsDeleteOpen(false);
      fetchExpenses();
    } catch (error) {
      toast.error('Silinemedi');
    }
  };

  // Handle camera/scan for mobile (legacy input method)
  const handleScanCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setScanning(true);
    setIsScanOpen(true);
    
    try {
      // Upload image for OCR processing
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/expenses/scan-ocr`, formData);
      
      if (response.data) {
        setOcrResult(response.data);
        // Auto-fill form with OCR results
        setUploadData(prev => ({
          ...prev,
          description: response.data.vendor || '',
          amount: response.data.total || '',
          date: response.data.date || prev.date
        }));
        // Convert scanned image to uploadable file
        setUploadFiles([file]);
        toast.success('Fatura tarandı! Verileri kontrol edin.');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error('Tarama başarısız. Manuel giriş yapın.');
      // Still allow manual entry
      setUploadFiles([file]);
    } finally {
      setScanning(false);
    }
  };

  // Handle DocumentScanner capture (CamScanner style)
  const handleDocumentScannerCapture = async (file) => {
    setIsScannerOpen(false);
    setScanning(true);
    setIsScanOpen(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/expenses/scan-ocr`, formData);
      
      if (response.data && response.data.success !== false) {
        setOcrResult(response.data);
        setUploadData(prev => ({
          ...prev,
          description: response.data.vendor || '',
          amount: response.data.total || '',
          date: response.data.date || prev.date
        }));
        setUploadFiles([file]);
        toast.success('Fatura başarıyla tarandı!');
      } else {
        setUploadFiles([file]);
        toast.info('OCR tamamlandı, lütfen verileri kontrol edin.');
      }
    } catch (error) {
      console.error('DocumentScanner OCR error:', error);
      toast.error('Tarama başarısız. Manuel giriş yapabilirsiniz.');
      setUploadFiles([file]);
    } finally {
      setScanning(false);
    }
  };

  const downloadExpense = async (expense) => {
    try {
      const response = await axios.get(`${API}/expenses/${expense.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', expense.filename || 'expense.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('İndirildi');
    } catch (error) {
      toast.error('İndirilemedi');
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await axios.get(`${API}/expenses/export/excel`, {
        responseType: 'blob',
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          date_filter: dateFilter,
          date: selectedDate
        }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `giderler_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel indirildi');
    } catch (error) {
      toast.error('Excel oluşturulamadı');
    }
  };

  const generateReport = async () => {
    try {
      const response = await axios.get(`${API}/expenses/report/pdf`, {
        responseType: 'blob',
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          date_filter: dateFilter,
          date: selectedDate
        }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gider_raporu_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Rapor indirildi');
    } catch (error) {
      toast.error('Rapor oluşturulamadı');
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (files.length > 0) {
      setUploadFiles(prev => [...prev, ...files]);
      setIsUploadOpen(true);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (selectedCategory !== 'all' && expense.category !== selectedCategory) return false;
    if (searchTerm && !expense.description?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedFolder && expense.folder_id !== selectedFolder) return false;
    return true;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const getCategoryInfo = (categoryId) => {
    return EXPENSE_CATEGORIES.find(c => c.id === categoryId) || EXPENSE_CATEGORIES[3];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 md:p-6 space-y-4" 
      data-testid="expenses-page"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={dropRef}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Manrope'] flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600" />
            {t('expenses')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fatura ve gider yönetimi - PDF yükle, kategorize et, raporla
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFolderOpen(true)}>
            <FolderPlus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Yeni Klasör</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button variant="outline" size="sm" onClick={generateReport}>
            <FileText className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Rapor</span>
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsScannerOpen(true)} 
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="scan-invoice-btn"
          >
            <Camera className="w-4 h-4 mr-2" />
            Fatura Tara
          </Button>
          <input 
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanCapture}
          />
          <Button onClick={() => setIsUploadOpen(true)} data-testid="upload-pdf-btn">
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF Yükle</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Gider ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {EXPENSE_CATEGORIES.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tarih" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="daily">Günlük</SelectItem>
            <SelectItem value="monthly">Aylık</SelectItem>
            <SelectItem value="yearly">Yıllık</SelectItem>
          </SelectContent>
        </Select>

        {dateFilter !== 'all' && (
          <Input
            type={dateFilter === 'daily' ? 'date' : dateFilter === 'monthly' ? 'month' : 'number'}
            value={dateFilter === 'yearly' ? new Date().getFullYear() : selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[150px]"
          />
        )}

        <div className="flex gap-1 ml-auto">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <p className="text-sm opacity-80">Toplam Gider</p>
            <p className="text-2xl font-bold">{totalAmount.toFixed(2)} €</p>
          </CardContent>
        </Card>
        {EXPENSE_CATEGORIES.map(cat => {
          const catTotal = expenses.filter(e => e.category === cat.id).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
          const CatIcon = cat.icon;
          return (
            <Card key={cat.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCategory(cat.id)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CatIcon className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{cat.name}</p>
                </div>
                <p className="text-xl font-bold">{catTotal.toFixed(2)} €</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedFolder === null ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSelectedFolder(null)}
          >
            <Folder className="w-4 h-4 mr-2" />
            Tümü
          </Button>
          {folders.map(folder => (
            <div key={folder.id} className="relative group">
              <Button 
                variant={selectedFolder === folder.id ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <Folder className="w-4 h-4 mr-2" />
                {folder.name}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white shadow border opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)}>
                    <Trash2 className="w-4 h-4 mr-2 text-red-500" /> Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Expenses Grid/List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Henüz gider yok</p>
          <p className="text-sm text-muted-foreground mt-1">PDF dosyalarını sürükleyip bırakın veya yükle butonuna tıklayın</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredExpenses.map(expense => {
            const catInfo = getCategoryInfo(expense.category);
            return (
              <Card key={expense.id} className="group cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="aspect-[3/4] bg-slate-100 rounded-lg mb-2 flex items-center justify-center relative">
                    <FileText className="w-12 h-12 text-slate-400" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                      <Button size="icon" variant="secondary" onClick={() => { setSelectedExpense(expense); setIsPreviewOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="secondary" onClick={() => downloadExpense(expense)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={`${catInfo.color} text-xs mb-1`}>{catInfo.name}</Badge>
                  <p className="text-sm font-medium truncate">{expense.description || expense.filename}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">{expense.date}</span>
                    <span className="font-semibold text-sm">{expense.amount} €</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map(expense => {
            const catInfo = getCategoryInfo(expense.category);
            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center gap-4">
                  <FileText className="w-8 h-8 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{expense.description || expense.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${catInfo.color} text-xs`}>{catInfo.name}</Badge>
                      <span className="text-xs text-muted-foreground">{expense.date}</span>
                    </div>
                  </div>
                  <span className="font-bold text-lg">{expense.amount} €</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedExpense(expense); setIsPreviewOpen(true); }}>
                        <Eye className="w-4 h-4 mr-2" /> Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadExpense(expense)}>
                        <Download className="w-4 h-4 mr-2" /> İndir
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedExpense(expense); setIsDeleteOpen(true); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={isFolderOpen} onOpenChange={setIsFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Klasör Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Klasör Adı</Label>
              <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Örn: Nisan 2024" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFolderOpen(false)}>İptal</Button>
            <Button onClick={handleCreateFolder}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PDF Yükle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm">PDF dosyalarını seçin veya sürükleyin</p>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf" 
                multiple 
                className="hidden"
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
              />
            </div>
            
            {uploadFiles.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {uploadFiles.length} dosya seçildi
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Kategori</Label>
                <Select value={uploadData.category} onValueChange={(v) => setUploadData({...uploadData, category: v})}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tarih</Label>
                <Input type="date" className="h-9" value={uploadData.date} onChange={(e) => setUploadData({...uploadData, date: e.target.value})} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Tutar (€)</Label>
              <Input type="number" step="0.01" className="h-9" value={uploadData.amount} onChange={(e) => setUploadData({...uploadData, amount: e.target.value})} placeholder="0.00" />
            </div>

            <div>
              <Label className="text-xs">Açıklama / Ort / Hotelname</Label>
              <Input className="h-9" value={uploadData.description} onChange={(e) => setUploadData({...uploadData, description: e.target.value})} placeholder="Otel adı veya açıklama" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Ülke (Land)</Label>
                <Input className="h-9" value={uploadData.country} onChange={(e) => setUploadData({...uploadData, country: e.target.value})} placeholder="Türkei, Deutschland..." />
              </div>
              <div>
                <Label className="text-xs">Yerel Para Birimi</Label>
                <Input className="h-9" value={uploadData.local_currency} onChange={(e) => setUploadData({...uploadData, local_currency: e.target.value})} placeholder="1700 TRY" />
              </div>
            </div>

            <div>
              <Label className="text-xs">Adres</Label>
              <Input className="h-9" value={uploadData.address} onChange={(e) => setUploadData({...uploadData, address: e.target.value})} placeholder="Tam adres" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Fatura Adı</Label>
                <Input className="h-9" value={uploadData.invoice_name} onChange={(e) => setUploadData({...uploadData, invoice_name: e.target.value})} placeholder="Fatura sahibi" />
              </div>
              <div>
                <Label className="text-xs">Notlar</Label>
                <Input className="h-9" value={uploadData.notes} onChange={(e) => setUploadData({...uploadData, notes: e.target.value})} placeholder="Ek notlar" />
              </div>
            </div>

            {folders.length > 0 && (
              <div>
                <Label className="text-xs">Klasör (Opsiyonel)</Label>
                <Select value={uploadData.folder_id || "none"} onValueChange={(v) => setUploadData({...uploadData, folder_id: v === "none" ? "" : v})}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Klasör seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Klasör Yok</SelectItem>
                    {folders.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} className="w-full sm:w-auto">İptal</Button>
            <Button onClick={handleUpload} disabled={uploading} className="w-full sm:w-auto">
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan Dialog - CamScanner Style */}
      <Dialog open={isScanOpen} onOpenChange={setIsScanOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-green-600" />
              Fatura Tarama
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {scanning ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Fatura taranıyor ve analiz ediliyor...</p>
                <p className="text-xs text-muted-foreground mt-1">OCR ile veriler çıkarılıyor</p>
              </div>
            ) : ocrResult ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Tarama Başarılı
                  </h4>
                  <p className="text-sm text-green-700">Aşağıdaki veriler otomatik olarak algılandı. Kontrol edip düzeltebilirsiniz.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Firma / Yer</Label>
                    <Input 
                      value={uploadData.description} 
                      onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                      placeholder="Algılanan firma adı"
                    />
                  </div>
                  <div>
                    <Label>Tarih</Label>
                    <Input 
                      type="date"
                      value={uploadData.date} 
                      onChange={(e) => setUploadData({...uploadData, date: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tutar (€)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={uploadData.amount} 
                      onChange={(e) => setUploadData({...uploadData, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select value={uploadData.category} onValueChange={(v) => setUploadData({...uploadData, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Ülke</Label>
                  <Input 
                    value={uploadData.country} 
                    onChange={(e) => setUploadData({...uploadData, country: e.target.value})}
                    placeholder="Türkei, Deutschland..."
                  />
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <p className="font-semibold text-green-700">Fatura Fotoğrafı Çek</p>
                <p className="text-sm text-muted-foreground mt-1">Kamera açılacak, faturayı çerçeveye alın</p>
                <p className="text-xs text-muted-foreground mt-2">Otomatik kenar algılama ve OCR yapılacak</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsScanOpen(false); setOcrResult(null); }}>
              İptal
            </Button>
            {ocrResult && (
              <Button onClick={() => { setIsScanOpen(false); setIsUploadOpen(true); }} className="bg-green-600 hover:bg-green-700">
                Devam Et
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedExpense?.description || selectedExpense?.filename}</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <iframe 
              src={`${API}/expenses/${selectedExpense.id}/view`}
              className="w-full h-[70vh] rounded border"
              title="PDF Preview"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gideri Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu gider kaydını silmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CamScanner Style Document Scanner */}
      <DocumentScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCapture={handleDocumentScannerCapture}
      />
    </div>
  );
};

export default Expenses;
