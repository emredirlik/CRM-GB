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

const EXPENSE_CATEGORIES_BASE = [
  { id: 'hotel', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { id: 'credit_card', icon: CreditCard, color: 'bg-purple-100 text-purple-700' },
  { id: 'dkv', icon: Fuel, color: 'bg-orange-100 text-orange-700' },
  { id: 'other', icon: Receipt, color: 'bg-gray-100 text-gray-700' },
];

const getCategoryNames = (lang) => ({
  hotel: lang === 'de' ? 'Hotel' : lang === 'en' ? 'Hotel' : 'Otel',
  credit_card: lang === 'de' ? 'Kreditkarte' : lang === 'en' ? 'Credit Card' : 'Kredi Kartı',
  dkv: 'DKV',
  other: lang === 'de' ? 'Sonstige' : lang === 'en' ? 'Other Expenses' : 'Diğer Giderler',
});

const Expenses = () => {
  const { t, language } = useLanguage();
  
  // Dynamic category names based on language
  const EXPENSE_CATEGORIES = EXPENSE_CATEGORIES_BASE.map(cat => ({
    ...cat,
    name: getCategoryNames(language)[cat.id]
  }));
  
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Hierarchical Year/Month selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null); // null = tüm yıl
  const years = [2024, 2025, 2026, 2027];
  const months = [
    { id: 1, name: 'Ocak' }, { id: 2, name: 'Şubat' }, { id: 3, name: 'Mart' },
    { id: 4, name: 'Nisan' }, { id: 5, name: 'Mayıs' }, { id: 6, name: 'Haziran' },
    { id: 7, name: 'Temmuz' }, { id: 8, name: 'Ağustos' }, { id: 9, name: 'Eylül' },
    { id: 10, name: 'Ekim' }, { id: 11, name: 'Kasım' }, { id: 12, name: 'Aralık' }
  ];
  
  // Dialog states
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  
  // Form states
  const [folderName, setFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState(null);
  const [reportType, setReportType] = useState('all');
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
    invoice_name: '',
    // Hotel specific
    check_in: new Date().toISOString().split('T')[0],
    check_out: '',
    nights: '1'
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
        category: selectedCategory !== 'all' ? selectedCategory : 'other',
        parent_id: parentFolderId || null
      });
      toast.success('Klasör oluşturuldu');
      setFolderName('');
      setParentFolderId(null);
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

  // Gideri klasöre taşı
  const handleMoveToFolder = async (expenseId, folderId) => {
    try {
      await axios.put(`${API}/expenses/${expenseId}`, { folder_id: folderId || null });
      toast.success(folderId ? 'Klasöre taşındı' : 'Klasörden çıkarıldı');
      fetchExpenses();
    } catch (error) {
      toast.error('Taşıma başarısız');
    }
  };

  // Klasöre gir (navigasyon)
  const [currentFolderPath, setCurrentFolderPath] = useState([]);
  
  const enterFolder = (folder) => {
    setCurrentFolderPath(prev => [...prev, folder]);
    setSelectedFolder(folder.id);
  };
  
  const goToParentFolder = () => {
    const newPath = [...currentFolderPath];
    newPath.pop();
    setCurrentFolderPath(newPath);
    setSelectedFolder(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };
  
  const goToRootFolder = () => {
    setCurrentFolderPath([]);
    setSelectedFolder(null);
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
        formData.append('date', uploadData.category === 'hotel' ? uploadData.check_in : (uploadData.date || ''));
        formData.append('country', uploadData.country || '');
        formData.append('address', uploadData.address || '');
        formData.append('notes', uploadData.notes || '');
        formData.append('local_currency', uploadData.local_currency || '');
        formData.append('invoice_name', uploadData.invoice_name || '');
        formData.append('auto_extract', 'true');
        // Hotel specific fields
        if (uploadData.category === 'hotel') {
          formData.append('check_in', uploadData.check_in || '');
          formData.append('check_out', uploadData.check_out || '');
          formData.append('nights', uploadData.nights || '1');
        }
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
        folder_id: '', country: '', address: '', notes: '', local_currency: '', invoice_name: '',
        check_in: new Date().toISOString().split('T')[0], check_out: '', nights: '1'
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
  const handleDocumentScannerCapture = async (file, ocrData = null) => {
    setIsScannerOpen(false);
    setScanning(true);
    setIsScanOpen(true);
    
    try {
      // If OCR data already provided from DocumentScanner (processed by backend)
      if (ocrData && (ocrData.vendor || ocrData.total || ocrData.date)) {
        setOcrResult(ocrData);
        setUploadData(prev => ({
          ...prev,
          description: ocrData.vendor || '',
          amount: ocrData.total || '',
          date: ocrData.date || prev.date
        }));
        setUploadFiles([file]);
        toast.success('Fatura başarıyla tarandı ve işlendi!');
      } else {
        // Fallback: Send to OCR endpoint if not already processed
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
          year: selectedYear,
          month: selectedMonth || undefined
        }
      });
      const monthName = selectedMonth ? months.find(m => m.id === selectedMonth)?.name : 'Tum_Yil';
      const filename = `GB_Ausnahmen_${selectedYear}_${monthName}.xlsx`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Excel indirildi: ${selectedYear} ${selectedMonth ? months.find(m => m.id === selectedMonth)?.name : 'Tüm Yıl'}`);
    } catch (error) {
      toast.error('Excel oluşturulamadı');
    }
  };

  const mergePdfs = async (folderId = null, folderName = null) => {
    try {
      // If specific folder selected, use that folder's expenses
      let requestBody = {};
      let downloadName = '';
      
      if (folderId) {
        // Merge only that folder's PDFs
        requestBody = { folder_id: folderId };
        downloadName = `birlesik_${folderName || 'klasor'}.pdf`;
      } else {
        // Merge all filtered expenses (no folder - "Klasörsüz" option)
        const noFolderExpenses = filteredExpenses.filter(e => !e.folder_id);
        const ids = noFolderExpenses.map(e => e.id);
        if (ids.length === 0) {
          toast.error(language === 'de' ? 'Keine PDFs zum Zusammenführen' : 'Birleştirilecek PDF yok');
          return;
        }
        requestBody = { expense_ids: ids };
        const monthName = selectedMonth ? months.find(m => m.id === selectedMonth)?.name : '';
        downloadName = `birlesik_klasorsuz_${selectedYear}${monthName ? '_' + monthName : ''}.pdf`;
      }
      
      const response = await axios.post(`${API}/expenses/merge-pdfs`, requestBody, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(language === 'de' ? 'PDFs zusammengeführt' : 'PDF\'ler birleştirildi');
    } catch (error) {
      toast.error(language === 'de' ? 'PDF Zusammenführung fehlgeschlagen' : 'PDF birleştirilemedi');
    }
  };

  const generateReport = async (type = 'all') => {
    try {
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        report_type: type === 'all' ? (selectedMonth ? 'monthly' : 'yearly') : type,
        month: selectedMonth || undefined,
        year: selectedYear
      };
      
      const response = await axios.get(`${API}/expenses/report/pdf`, {
        responseType: 'blob',
        params
      });
      
      const monthName = selectedMonth ? months.find(m => m.id === selectedMonth)?.name : '';
      const filename = selectedMonth 
        ? `Gider_Raporu_${selectedYear}_${monthName}.pdf`
        : `Gider_Raporu_${selectedYear}_Tum_Yil.pdf`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Rapor indirildi: ${selectedYear} ${monthName || 'Tüm Yıl'}`);
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
    
    // Year and Month filtering
    if (expense.date) {
      const expenseDate = new Date(expense.date);
      const expenseYear = expenseDate.getFullYear();
      const expenseMonth = expenseDate.getMonth() + 1;
      
      if (selectedYear && expenseYear !== selectedYear) return false;
      if (selectedMonth && expenseMonth !== selectedMonth) return false;
    }
    
    return true;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  // Category totals for current filter
  const categoryTotals = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = filteredExpenses
      .filter(e => e.category === cat.id)
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    return acc;
  }, {});

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
      className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto" 
      data-testid="expenses-page"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={dropRef}
    >
      {/* Modern Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            {t('expensesTitle')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === 'de' ? 'Rechnungen und Ausgaben verwalten' : language === 'en' ? 'Invoice and expense management' : 'Fatura ve gider yönetimi'}
          </p>
        </div>
        
        {/* Action Buttons - Grouped */}
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <Button variant="ghost" size="sm" onClick={() => setIsFolderOpen(true)} className="hover:bg-white">
              <FolderPlus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('newFolder')}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={exportToExcel} className="hover:bg-white">
              <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('excel')}</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-white">
                  <FileText className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('report')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => generateReport('all')}>
                  <FileText className="w-4 h-4 mr-2" /> {t('allExpenses')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateReport('monthly')}>
                  <Calendar className="w-4 h-4 mr-2" /> {t('monthlyReport')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateReport('yearly')}>
                  <FileText className="w-4 h-4 mr-2" /> {t('yearlyReport')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                  <FileText className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('mergePdf')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                <DropdownMenuItem onClick={() => mergePdfs(null, null)} className="text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  {language === 'de' ? 'Ohne Ordner' : language === 'en' ? 'No Folder' : 'Klasörsüz'}
                </DropdownMenuItem>
                {folders.length > 0 && <div className="border-t my-1" />}
                {folders.map(folder => (
                  <DropdownMenuItem 
                    key={folder.id} 
                    onClick={() => mergePdfs(folder.id, folder.name)}
                    className="text-purple-600"
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Primary Actions */}
          <Button 
            size="sm" 
            onClick={() => setIsScannerOpen(true)} 
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
            data-testid="scan-invoice-btn"
          >
            <Camera className="w-4 h-4 mr-2" />
            {t('scanInvoice')}
          </Button>
          <input 
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanCapture}
          />
          <Button 
            onClick={() => setIsUploadOpen(true)} 
            data-testid="upload-pdf-btn"
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md"
          >
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('uploadPdf')}</span>
          </Button>
        </div>
      </div>

      {/* Modern Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-gray-50/80 rounded-xl border">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={language === 'de' ? 'Suchen...' : language === 'en' ? 'Search...' : 'Ara...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={selectedYear?.toString()} onValueChange={(v) => { setSelectedYear(parseInt(v)); setSelectedMonth(null); }}>
            <SelectTrigger className="w-[100px] bg-white">
              <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
              <SelectValue placeholder="Yıl" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedMonth?.toString() || "all"} onValueChange={(v) => setSelectedMonth(v === "all" ? null : parseInt(v))}>
            <SelectTrigger className="w-[130px] bg-white">
              <SelectValue placeholder="Tüm Aylar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'de' ? 'Alle Monate' : language === 'en' ? 'All Months' : 'Tüm Aylar'}</SelectItem>
              {months.map(month => (
                <SelectItem key={month.id} value={month.id.toString()}>{month.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px] bg-white">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'de' ? 'Alle Kategorien' : language === 'en' ? 'All Categories' : 'Tüm Kategoriler'}</SelectItem>
              {EXPENSE_CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1 ml-auto bg-white p-1 rounded-lg border">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards - Modern Style */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white shadow-lg border-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-5 relative">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="w-5 h-5 opacity-80" />
              <p className="text-sm font-medium opacity-90">{language === 'de' ? 'Gesamt' : language === 'en' ? 'Total Expense' : 'Toplam Gider'}</p>
            </div>
            <p className="text-3xl font-bold">{totalAmount.toFixed(2)} €</p>
            <p className="text-xs mt-2 opacity-70">
              {selectedYear} {selectedMonth ? `/ ${months.find(m => m.id === selectedMonth)?.name}` : ''}
            </p>
          </CardContent>
        </Card>
        
        {EXPENSE_CATEGORIES.map(cat => {
          const catTotal = categoryTotals[cat.id] || 0;
          const CatIcon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <Card 
              key={cat.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                isSelected 
                  ? 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-200' 
                  : 'hover:border-indigo-200 bg-white'
              }`}
              onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${cat.color}`}>
                    <CatIcon className="w-4 h-4" />
                  </div>
                  {isSelected && <CheckCircle className="w-4 h-4 text-indigo-500" />}
                </div>
                <p className="text-sm text-muted-foreground font-medium">{cat.name}</p>
                <p className="text-2xl font-bold mt-1">{catTotal.toFixed(2)} €</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Folders Navigation - Modern Style */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          {/* Breadcrumb */}
          {currentFolderPath.length > 0 && (
            <div className="flex items-center gap-2 text-sm mb-3 pb-3 border-b">
              <Button variant="ghost" size="sm" onClick={goToRootFolder} className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <Folder className="w-4 h-4 mr-1" />
                {language === 'de' ? 'Hauptverzeichnis' : language === 'en' ? 'Root' : 'Ana Dizin'}
              </Button>
              {currentFolderPath.map((folder, idx) => (
                <React.Fragment key={folder.id}>
                  <span className="text-muted-foreground">/</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const newPath = currentFolderPath.slice(0, idx + 1);
                      setCurrentFolderPath(newPath);
                      setSelectedFolder(folder.id);
                    }}
                    className="h-7 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    {folder.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          )}
          
          {/* Folder Pills */}
          <div className="flex flex-wrap gap-2">
            {currentFolderPath.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={goToParentFolder}
                className="border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              >
                <Folder className="w-4 h-4 mr-2" />
                ← {language === 'de' ? 'Zurück' : language === 'en' ? 'Back' : 'Geri'}
              </Button>
            )}
            
            {currentFolderPath.length === 0 && (
              <Button 
                variant={selectedFolder === null ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedFolder(null)}
                className={selectedFolder === null ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
              >
                <Folder className="w-4 h-4 mr-2" />
                {language === 'de' ? 'Alle' : language === 'en' ? 'All' : 'Tümü'}
              </Button>
            )}
            
            {folders
              .filter(f => {
                if (currentFolderPath.length === 0) return !f.parent_id;
                return f.parent_id === currentFolderPath[currentFolderPath.length - 1]?.id;
              })
              .map(folder => (
              <div key={folder.id} className="relative group">
                <Button 
                  variant={selectedFolder === folder.id ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => enterFolder(folder)}
                  onDoubleClick={() => enterFolder(folder)}
                  className={selectedFolder === folder.id ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:border-indigo-300'}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  {folder.name}
                  {folder.children_count > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs bg-indigo-100 text-indigo-700">
                      {folder.children_count}
                    </Badge>
                  )}
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
                    <DropdownMenuItem onClick={() => enterFolder(folder)}>
                      <Folder className="w-4 h-4 mr-2" /> {language === 'de' ? 'Ordner öffnen' : language === 'en' ? 'Enter Folder' : 'Klasöre Gir'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteFolder(folder.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> {language === 'de' ? 'Löschen' : language === 'en' ? 'Delete' : 'Sil'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Grid/List */}
      {filteredExpenses.length === 0 ? (
        <Card className="border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
              <Receipt className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {language === 'de' ? 'Keine Ausgaben' : language === 'en' ? 'No expenses yet' : 'Henüz gider yok'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {language === 'de' 
                ? 'Ziehen Sie PDF-Dateien hierher oder klicken Sie auf "Hochladen"' 
                : language === 'en'
                ? 'Drag and drop PDF files here or click upload'
                : 'PDF dosyalarını sürükleyip bırakın veya yükle butonuna tıklayın'}
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={() => setIsScannerOpen(true)} variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
                <Camera className="w-4 h-4 mr-2" />
                {t('scanInvoice')}
              </Button>
              <Button onClick={() => setIsUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Upload className="w-4 h-4 mr-2" />
                {t('uploadPdf')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredExpenses.map(expense => {
            const catInfo = getCategoryInfo(expense.category);
            return (
              <Card key={expense.id} className="group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative overflow-hidden">
                <CardContent className="p-3">
                  <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <FileText className="w-12 h-12 text-slate-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => { setSelectedExpense(expense); setIsPreviewOpen(true); }}>
                        <Eye className="w-4 h-4 mr-1" /> {language === 'de' ? 'Anzeigen' : language === 'en' ? 'View' : 'Görüntüle'}
                      </Button>
                      <Button size="sm" variant="secondary" className="h-8" onClick={() => downloadExpense(expense)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={`${catInfo.color} text-xs mb-2`}>{catInfo.name}</Badge>
                  <p className="text-sm font-medium truncate text-gray-800">{expense.description || expense.filename}</p>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-muted-foreground">{expense.date}</span>
                    <span className="font-bold text-indigo-600">{expense.amount} €</span>
                  </div>
                </CardContent>
                {/* Dropdown menu for grid cards */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSelectedExpense(expense); setIsPreviewOpen(true); }}>
                      <Eye className="w-4 h-4 mr-2" /> {language === 'de' ? 'Anzeigen' : language === 'en' ? 'View' : 'Görüntüle'}
                    </DropdownMenuItem>
                    {folders.length > 0 && (
                      <>
                        <DropdownMenuItem onClick={() => handleMoveToFolder(expense.id, null)}>
                          <Folder className="w-4 h-4 mr-2" /> {language === 'de' ? 'Aus Ordner entfernen' : language === 'en' ? 'Remove from Folder' : 'Klasörden Çıkar'}
                        </DropdownMenuItem>
                        {folders.filter(f => f.id !== expense.folder_id).slice(0, 5).map(folder => (
                          <DropdownMenuItem key={folder.id} onClick={() => handleMoveToFolder(expense.id, folder.id)}>
                            <Folder className="w-4 h-4 mr-2 text-blue-500" /> {language === 'de' ? `In ${folder.name} verschieben` : language === 'en' ? `Move to ${folder.name}` : `${folder.name}'a Taşı`}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedExpense(expense); setIsDeleteOpen(true); }}>
                      <Trash2 className="w-4 h-4 mr-2" /> {language === 'de' ? 'Löschen' : language === 'en' ? 'Delete' : 'Sil'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                  <span className="font-bold text-lg whitespace-nowrap">{expense.amount} €</span>
                  
                  {/* Always visible action buttons */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedExpense(expense); setIsPreviewOpen(true); }} title={language === 'de' ? 'Anzeigen' : language === 'en' ? 'View' : 'Görüntüle'}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => downloadExpense(expense)} title={language === 'de' ? 'Herunterladen' : language === 'en' ? 'Download' : 'İndir'}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedExpense(expense); setIsDeleteOpen(true); }} title={language === 'de' ? 'Löschen' : language === 'en' ? 'Delete' : 'Sil'} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {folders.length > 0 && (
                          <>
                            <DropdownMenuItem onClick={() => handleMoveToFolder(expense.id, null)}>
                              <Folder className="w-4 h-4 mr-2" /> {language === 'de' ? 'Aus Ordner entfernen' : language === 'en' ? 'Remove from Folder' : 'Klasörden Çıkar'}
                            </DropdownMenuItem>
                            {folders.filter(f => f.id !== expense.folder_id).slice(0, 5).map(folder => (
                              <DropdownMenuItem key={folder.id} onClick={() => handleMoveToFolder(expense.id, folder.id)}>
                                <Folder className="w-4 h-4 mr-2 text-blue-500" /> {language === 'de' ? `In ${folder.name} verschieben` : language === 'en' ? `Move to ${folder.name}` : `${folder.name}'a Taşı`}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
            {folders.length > 0 && (
              <div>
                <Label>Üst Klasör (Opsiyonel)</Label>
                <Select value={parentFolderId || "root"} onValueChange={(v) => setParentFolderId(v === "root" ? null : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'de' ? 'Hauptverzeichnis' : language === 'en' ? 'Root folder' : 'Ana dizin'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">{language === 'de' ? 'Hauptverzeichnis (Wurzel)' : language === 'en' ? 'Root Folder' : 'Ana Dizin (Kök)'}</SelectItem>
                    {folders.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.path || f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'de' ? 'Wählen Sie einen übergeordneten Ordner, um einen Unterordner zu erstellen' : language === 'en' ? 'Select a parent folder to create a subfolder' : 'Bir klasörün içinde alt klasör oluşturmak için üst klasör seçin'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsFolderOpen(false); setParentFolderId(null); }}>{language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'İptal'}</Button>
            <Button onClick={handleCreateFolder}>{language === 'de' ? 'Erstellen' : language === 'en' ? 'Create' : 'Oluştur'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'de' ? 'PDF hochladen' : language === 'en' ? 'Upload PDF' : 'PDF Yükle'}</DialogTitle>
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
                <Label className="text-xs">{uploadData.category === 'hotel' ? 'Check-In' : 'Tarih'}</Label>
                <Input type="date" className="h-9" value={uploadData.category === 'hotel' ? uploadData.check_in : uploadData.date} onChange={(e) => setUploadData({...uploadData, [uploadData.category === 'hotel' ? 'check_in' : 'date']: e.target.value})} />
              </div>
            </div>

            {/* Hotel specific fields */}
            {uploadData.category === 'hotel' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <Label className="text-xs text-blue-700">Check-Out</Label>
                  <Input type="date" className="h-9" value={uploadData.check_out} onChange={(e) => setUploadData({...uploadData, check_out: e.target.value})} />
                </div>
                <div>
                  <Label className="text-xs text-blue-700">Gece Sayısı (Nacht)</Label>
                  <Input type="number" min="1" className="h-9" value={uploadData.nights} onChange={(e) => setUploadData({...uploadData, nights: e.target.value})} />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">Tutar (€)</Label>
              <Input type="number" step="0.01" className="h-9" value={uploadData.amount} onChange={(e) => setUploadData({...uploadData, amount: e.target.value})} placeholder="0.00" />
            </div>

            <div>
              <Label className="text-xs">{uploadData.category === 'hotel' ? 'Otel Adı (Hotelname)' : 'Açıklama / Ort'}</Label>
              <Input className="h-9" value={uploadData.description} onChange={(e) => setUploadData({...uploadData, description: e.target.value})} placeholder={uploadData.category === 'hotel' ? 'Örn: Air Hotel Galaxy' : 'Açıklama'} />
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
        <DialogContent className="max-w-5xl max-h-[95vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedExpense?.description || selectedExpense?.filename || 'PDF Önizleme'}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`${API}/expenses/${selectedExpense?.id}/view`, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  İndir
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="w-full h-[80vh] bg-gray-100">
              <object
                data={`${API}/expenses/${selectedExpense.id}/view`}
                type="application/pdf"
                className="w-full h-full"
              >
                <embed
                  src={`${API}/expenses/${selectedExpense.id}/view`}
                  type="application/pdf"
                  className="w-full h-full"
                />
                <p className="text-center py-8">
                  PDF önizleme yüklenemedi. 
                  <a 
                    href={`${API}/expenses/${selectedExpense.id}/view`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline ml-1"
                  >
                    Buraya tıklayarak indirin
                  </a>
                </p>
              </object>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'de' ? 'Ausgabe löschen' : language === 'en' ? 'Delete Expense' : 'Gideri Sil'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'de' ? 'Möchten Sie diesen Ausgabeneintrag wirklich löschen?' : language === 'en' ? 'Are you sure you want to delete this expense?' : 'Bu gider kaydını silmek istediğinizden emin misiniz?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'İptal'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {language === 'de' ? 'Löschen' : language === 'en' ? 'Delete' : 'Sil'}
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
