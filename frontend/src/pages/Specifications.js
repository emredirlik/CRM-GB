import React, { useEffect, useState, useRef } from 'react';
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
import { Pencil, Trash2, Search, FileText, FileDown, Mail, Eye, Upload, File, Loader2, X, FileUp } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Specifications = () => {
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
  
  // File upload states
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  
  // Edit form
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
  // Email dialog
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
        toast.success(`Uploaded: ${file.name}`);
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

  const openPreview = (spec) => {
    setSelectedSpec(spec);
    setIsPreviewOpen(true);
  };

  const openEmailDialog = (spec) => {
    setSelectedSpec(spec);
    setEmailSubject(`Product Specification: ${spec.name || spec.filename}`);
    setEmailBody(`Dear Customer,\n\nPlease find attached the product specification document.\n\nFile: ${spec.filename || spec.name}\n\nBest regards,\nGewürzberg GmbH`);
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

    setSendingEmail(true);
    try {
      await axios.post(`${API}/specifications/${selectedSpec.id}/email`, {
        lead_id: selectedLeadId,
        subject: emailSubject,
        body: emailBody
      });
      toast.success('Email sent with specification PDF');
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
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
          <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">Product Specifications</h1>
          <p className="text-muted-foreground mt-1">{specs.length} PDF documents</p>
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
                <span className="text-lg">Uploading...</span>
              </div>
            ) : (
              <>
                <FileUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Upload PDF Specifications</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop PDF files here, or click to browse
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Browse Files
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
            placeholder="Search specifications..."
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
            <p>{searchTerm ? 'No specifications found' : 'No PDF specifications uploaded yet'}</p>
            <p className="text-sm mt-1">Drag and drop PDF files above to get started</p>
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
                
                {spec.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{spec.description}</p>
                )}
                
                {spec.notes && (
                  <Badge variant="secondary" className="text-xs mb-3">
                    {spec.notes.slice(0, 30)}{spec.notes.length > 30 ? '...' : ''}
                  </Badge>
                )}
                
                <div className="flex items-center justify-end gap-1 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => openPreview(spec)} title="Preview Info">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadPdf(spec.id)} title="Download PDF">
                    <FileDown className="w-4 h-4 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEmailDialog(spec)} title="Send Email">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(spec)} title="Edit Details">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(spec)} className="text-destructive hover:text-destructive" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">Edit Specification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Display Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Product specification name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of this specification..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Internal notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - PDF Viewer */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-['Manrope']">PDF Preview - {selectedSpec?.name || selectedSpec?.filename}</DialogTitle>
          </DialogHeader>
          {selectedSpec && (
            <div className="space-y-4">
              {/* PDF Embed */}
              <div className="w-full h-[60vh] border rounded-lg overflow-hidden bg-gray-100">
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
                {selectedSpec.description && (
                  <p className="text-sm text-muted-foreground max-w-md truncate">{selectedSpec.description}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => openEditDialog(selectedSpec)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Details
            </Button>
            <Button variant="outline" onClick={() => downloadPdf(selectedSpec?.id)}>
              <FileDown className="w-4 h-4 mr-2" />
              Download
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <File className="w-8 h-8 text-red-600" />
              <div>
                <p className="font-medium text-sm">{selectedSpec?.name || selectedSpec?.filename}</p>
                <p className="text-xs text-muted-foreground">Will be attached to the email</p>
              </div>
            </div>
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
              Are you sure you want to delete "{selectedSpec?.name || selectedSpec?.filename}"? This action cannot be undone.
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
