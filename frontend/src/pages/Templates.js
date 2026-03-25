import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTemplates, createTemplate, deleteTemplate } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Trash2, FileText, Copy } from 'lucide-react';

const Templates = () => {
  const { t } = useLanguage();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    language: 'en'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(response.data);
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to fetch templates' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDialog = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      language: 'en'
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (template) => {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await createTemplate(formData);
      toast.success(t('success'), { description: t('templateAdded') });
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTemplate(selectedTemplate.id);
      toast.success(t('success'), { description: t('templateDeleted') });
      setIsDeleteDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error(t('error'), { description: 'Failed to delete template' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const languageLabels = {
    tr: 'Türkçe',
    de: 'Deutsch',
    en: 'English'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="templates-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="templates-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('templates')}</h1>
          <p className="text-muted-foreground mt-1">{templates.length} templates available</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-template-btn">
          <Plus className="w-4 h-4 mr-2" />
          {t('addTemplate')}
        </Button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card data-testid="no-templates">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('noTemplates')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="card-hover" data-testid={`template-card-${template.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold font-['Manrope']">{template.name}</h3>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-muted text-muted-foreground">
                      {languageLabels[template.language] || template.language}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(template.body)}
                      data-testid={`copy-template-${template.id}`}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(template)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`delete-template-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{template.subject}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{template.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="template-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">{t('addTemplate')}</DialogTitle>
            <DialogDescription>
              Create a new email template for your campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('templateName')}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Introduction Email"
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">{t('language')}</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">{t('subject')}</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Email subject line"
                data-testid="input-template-subject"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">{t('body')}</Label>
              <Textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                rows={8}
                placeholder="Email body content..."
                data-testid="input-template-body"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use placeholders like {'{first_name}'}, {'{company_name}'}, {'{city}'} for personalization
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="cancel-template-btn">
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-template-btn">
              {saving ? 'Saving...' : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="delete-template-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-template-btn">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="confirm-delete-template-btn">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Templates;
