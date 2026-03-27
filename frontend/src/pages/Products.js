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
import { Plus, Pencil, Trash2, Search, Package, Tag } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categories = [
  'Baharat Karışımları',
  'Binding Ürünleri',
  'Et Baharatları',
  'Döner Karışımları',
  'Gyros Karışımları',
  'Kebap Karışımları',
  'Marinasyon',
  'Diğer'
];

const unitOptions = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'adet', label: 'Adet' },
  { value: 'paket', label: 'Paket' },
  { value: 'kutu', label: 'Kutu' },
  { value: 'litre', label: 'Litre (L)' }
];

const initialFormData = {
  name: '',
  code: '',
  description: '',
  default_unit: 'kg',
  default_price: 0,
  category: ''
};

const Products = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDialog = () => {
    setSelectedProduct(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      description: product.description || '',
      default_unit: product.default_unit || 'kg',
      default_price: product.default_price || 0,
      category: product.category || ''
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Hata', { description: 'Ürün adı ve kodu zorunludur' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        default_price: parseFloat(formData.default_price) || 0
      };

      if (selectedProduct) {
        await axios.put(`${API}/products/${selectedProduct.id}`, payload);
        toast.success('Başarılı', { description: 'Ürün güncellendi' });
      } else {
        await axios.post(`${API}/products`, payload);
        toast.success('Başarılı', { description: 'Ürün oluşturuldu' });
      }
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'İşlem başarısız';
      toast.error('Hata', { description: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/products/${selectedProduct.id}`);
      toast.success('Başarılı', { description: 'Ürün silindi' });
      setIsDeleteDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error('Hata', { description: 'Ürün silinemedi' });
    }
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.code?.toLowerCase().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="products-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="products-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Ürünler</h1>
          <p className="text-muted-foreground mt-1">{products.length} ürün</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-product-btn">
          <Plus className="w-4 h-4 mr-2" />
          Ürün Ekle
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Ürün ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-products"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{searchTerm ? 'Ürün bulunamadı' : 'Henüz ürün yok'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="card-hover" data-testid={`product-card-${product.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                    </div>
                  </div>
                </div>
                
                {product.category && (
                  <Badge variant="secondary" className="mb-2 text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {product.category}
                  </Badge>
                )}
                
                {product.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Varsayılan Fiyat</p>
                    <p className="font-semibold text-primary">{formatCurrency(product.default_price)}/{product.default_unit}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(product)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" data-testid="product-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">
              {selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
            </DialogTitle>
            <DialogDescription>
              Ürün bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ürün Adı *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Gyros Baharat"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Ürün Kodu *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="GYR-001"
                  data-testid="input-code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="Ürün açıklaması..."
                data-testid="input-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_price">Varsayılan Fiyat (€)</Label>
                <Input
                  id="default_price"
                  name="default_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.default_price}
                  onChange={handleInputChange}
                  data-testid="input-price"
                />
              </div>
              <div className="space-y-2">
                <Label>Varsayılan Birim</Label>
                <Select value={formData.default_unit} onValueChange={(value) => setFormData(prev => ({ ...prev, default_unit: value }))}>
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedProduct?.name}" ürününü silmek istediğinize emin misiniz?
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
    </div>
  );
};

export default Products;
