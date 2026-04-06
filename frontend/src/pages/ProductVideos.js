import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { 
  Video, Upload, Play, Trash2, Share2, Search,
  MessageCircle, Mail, Eye, Pencil, Plus, Loader2,
  Film, FileVideo, X, Check
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductVideos = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [products, setProducts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_id: '',
    file: null
  });

  const [shareData, setShareData] = useState({
    method: 'whatsapp',
    lead_id: '',
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [videosRes, productsRes, leadsRes] = await Promise.all([
        axios.get(`${API}/product-videos`),
        axios.get(`${API}/products`),
        axios.get(`${API}/leads`)
      ]);
      setVideos(videosRes.data);
      setProducts(productsRes.data);
      setLeads(leadsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('error'), { description: 'Veri yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setFormData(prev => ({ ...prev, file, title: file.name.replace(/\.[^/.]+$/, '') }));
      } else {
        toast.error(t('error'), { description: 'Sadece video dosyaları yüklenebilir' });
      }
    }
  }, [t]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, file, title: prev.title || file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.title) {
      toast.error(t('error'), { description: 'Başlık ve video dosyası gerekli' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const uploadFormData = new FormData();
    uploadFormData.append('file', formData.file);
    uploadFormData.append('title', formData.title);
    uploadFormData.append('description', formData.description);
    if (formData.product_id) {
      uploadFormData.append('product_id', formData.product_id);
    }

    try {
      await axios.post(`${API}/product-videos`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });
      
      toast.success(t('success'), { description: 'Video yüklendi' });
      setIsUploadOpen(false);
      setFormData({ title: '', description: '', product_id: '', file: null });
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Video yüklenemedi' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/product-videos/${selectedVideo.id}`);
      toast.success(t('success'), { description: 'Video silindi' });
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error(t('error'), { description: 'Video silinemedi' });
    }
  };

  const handleShare = async () => {
    if (!shareData.lead_id) {
      toast.error(t('error'), { description: 'Lütfen müşteri seçin' });
      return;
    }

    const lead = leads.find(l => l.id === shareData.lead_id);
    if (!lead) return;

    if (shareData.method === 'whatsapp') {
      const phone = lead.phone?.replace(/[^0-9]/g, '');
      if (!phone) {
        toast.error(t('error'), { description: 'Müşterinin telefon numarası yok' });
        return;
      }
      const message = encodeURIComponent(shareData.message || `${selectedVideo.title}: ${selectedVideo.url}`);
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      toast.success(t('success'), { description: 'WhatsApp açılıyor...' });
    } else {
      try {
        await axios.post(`${API}/mail/send`, {
          to: lead.email,
          subject: `Video: ${selectedVideo.title}`,
          body: `${shareData.message || ''}\n\nVideo: ${selectedVideo.url}`
        });
        toast.success(t('success'), { description: t('emailSent') });
      } catch (error) {
        toast.error(t('error'), { description: 'Mail gönderilemedi' });
      }
    }
    setIsShareOpen(false);
  };

  const openShareDialog = (video) => {
    setSelectedVideo(video);
    setShareData({ 
      method: 'whatsapp', 
      lead_id: '', 
      message: `${video.title} videosunu sizinle paylaşmak istiyorum:\n${video.url || ''}` 
    });
    setIsShareOpen(true);
  };

  const filteredVideos = videos.filter(video => 
    video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6" data-testid="product-videos-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-['Manrope']">{t('productVideos')}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{videos.length} video</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Upload className="w-4 h-4 mr-2" />
          {t('uploadVideo')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`${t('search')}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Film className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t('noVideos')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map(video => (
            <Card key={video.id} className="overflow-hidden group">
              <div 
                className="relative aspect-video bg-slate-900 cursor-pointer"
                onClick={() => { setSelectedVideo(video); setIsPreviewOpen(true); }}
              >
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileVideo className="w-16 h-16 text-slate-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-12 h-12 text-white" />
                </div>
                {video.duration && (
                  <Badge className="absolute bottom-2 right-2 bg-black/70">
                    {video.duration}
                  </Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium truncate">{video.title}</h3>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {video.description || 'Açıklama yok'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(video.file_size)}
                  </span>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); openShareDialog(video); }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setSelectedVideo(video); setIsDeleteOpen(true); }}
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

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('uploadVideo')}</DialogTitle>
            <DialogDescription>Video dosyasını sürükleyip bırakın veya seçin</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-muted-foreground/25 hover:border-indigo-500/50'}
                ${formData.file ? 'bg-green-50 border-green-500' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {formData.file ? (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-green-700">{formData.file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, file: null })); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Video className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{t('dragDropVideo')}</p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV - Max 100MB</p>
                </>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('videoTitle')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Video başlığı"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('videoDescription')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Video açıklaması"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Ürün (Opsiyonel)</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={(val) => setFormData({ ...formData, product_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !formData.file}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {t('upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('share')}: {selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Gönderim Yöntemi</Label>
              <div className="flex gap-2">
                <Button
                  variant={shareData.method === 'whatsapp' ? 'default' : 'outline'}
                  onClick={() => setShareData({ ...shareData, method: 'whatsapp' })}
                  className={shareData.method === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant={shareData.method === 'email' ? 'default' : 'outline'}
                  onClick={() => setShareData({ ...shareData, method: 'email' })}
                  className={shareData.method === 'email' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Müşteri *</Label>
              <Select 
                value={shareData.lead_id} 
                onValueChange={(val) => setShareData({ ...shareData, lead_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name} - {lead.first_name} {lead.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mesaj</Label>
              <Textarea
                value={shareData.message}
                onChange={(e) => setShareData({ ...shareData, message: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleShare}
              className={shareData.method === 'whatsapp' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}
            >
              {shareData.method === 'whatsapp' ? (
                <><MessageCircle className="w-4 h-4 mr-2" /> {t('sendViaWhatsApp')}</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" /> {t('sendViaEmail')}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedVideo && (
            <>
              <div className="aspect-video bg-black">
                <video 
                  src={selectedVideo.url} 
                  controls 
                  autoPlay
                  className="w-full h-full"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedVideo.description}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedVideo?.title}" videosunu silmek istediğinize emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductVideos;
