import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Inbox, Send, FileText, RefreshCw, Search, Menu,
  Reply, Forward, Trash2, Archive, Star,
  Loader2, AlertCircle, ChevronLeft, X,
  Paperclip, Clock, Pencil, Tag,
  Bold, Italic, Underline, List, Link as LinkIcon,
  Palette, Settings, Image as ImageIcon,
  MailOpen, Minimize2, Maximize2, File, Download,
  Sparkles, Wand2, MessageSquare, Zap, Brain,
  FileImage, FileVideo, FileArchive, FileType
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

// File type icons
const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return FileImage;
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return FileVideo;
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return FileArchive;
  if (ext === 'pdf') return FileType;
  return File;
};

const MailPage = () => {
  const { t } = useLanguage();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // States
  const [emails, setEmails] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [draftEmails, setDraftEmails] = useState([]);
  const [trashedEmails, setTrashedEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isComposeFullscreen, setIsComposeFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('loading');
  const [showCc, setShowCc] = useState(false);
  const [replyMode, setReplyMode] = useState(null);
  const [signature, setSignature] = useState('');
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isEmailFullscreen, setIsEmailFullscreen] = useState(false);
  const [loadingBody, setLoadingBody] = useState(false);
  
  // AI States
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Folder counts
  const inboxCount = emails.filter(e => !e.is_read).length;
  const sentCount = sentEmails.length;
  const draftCount = draftEmails.length;
  const starredCount = emails.filter(e => e.starred).length;

  // Load emails on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadEmails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/mail/inbox`);
        if (!isMounted) return;
        
        if (response.data && response.data.emails) {
          const fetchedEmails = response.data.emails.map((e, i) => ({ 
            ...e, 
            starred: false,
            attachments: e.attachments || [],
          }));
          setEmails(fetchedEmails);
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Mail fetch error:', error);
        setConnectionStatus('error');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    const loadSentEmails = async () => {
      try {
        const response = await axios.get(`${API}/mail/sent`);
        if (response.data?.emails) {
          setSentEmails(response.data.emails);
        }
      } catch (e) {}
    };
    
    const loadDrafts = async () => {
      try {
        const response = await axios.get(`${API}/mail/drafts`);
        if (response.data?.drafts) {
          setDraftEmails(response.data.drafts);
        }
      } catch (e) {}
    };

    loadEmails();
    loadSentEmails();
    loadDrafts();
    
    axios.get(`${API}/settings/signature`).then(res => {
      if (isMounted && res.data?.signature) setSignature(res.data.signature);
    }).catch(() => {
      if (isMounted) setSignature(`<br><br>--<br><b>Gewürzberg GmbH</b><br>Premium Gewürze & Binderlösungen`);
    });
    
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`${API}/mail/inbox`);
      if (response.data && response.data.emails) {
        setEmails(response.data.emails.map((e, i) => ({ 
          ...e, 
          starred: emails.find(em => em.id === e.id)?.starred || false,
          attachments: e.attachments || [],
        })));
        setConnectionStatus('connected');
        toast.success('Mailler güncellendi');
      }
    } catch (error) {
      toast.error('Mailler yüklenemedi');
    } finally {
      setRefreshing(false);
    }
  };

  const saveSignature = async () => {
    try {
      await axios.post(`${API}/settings/signature`, { signature });
      toast.success('İmza kaydedildi');
      setIsSignatureOpen(false);
    } catch (error) {
      toast.error('İmza kaydedilemedi');
    }
  };

  const handleViewEmail = async (email) => {
    setSelectedEmail(email);
    setAiSummary('');
    setSmartReplies([]);
    setShowAiPanel(false);
    
    if (!email.body || email.body === '') {
      setLoadingBody(true);
      try {
        const response = await axios.get(`${API}/mail/body/${email.id}`);
        if (response.data) {
          const updatedEmail = { 
            ...email, 
            body: response.data.body || response.data.plain || '',
            attachments: response.data.attachments || email.attachments || []
          };
          setSelectedEmail(updatedEmail);
          setEmails(prev => prev.map(e => e.id === email.id ? updatedEmail : e));
        }
      } catch (error) {
        console.error('Failed to load email body:', error);
      } finally {
        setLoadingBody(false);
      }
    }
    
    if (!email.is_read) {
      try {
        await axios.post(`${API}/mail/mark-read/${email.id}`);
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      } catch (error) {}
    }
  };

  // AI: Summarize Email
  const handleAiSummarize = async () => {
    if (!selectedEmail?.body) return;
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const response = await axios.post(`${API}/ai/summarize-email`, {
        subject: selectedEmail.subject,
        body: selectedEmail.body,
        from: selectedEmail.from_name || selectedEmail.from_email
      });
      setAiSummary(response.data.summary || 'Özet oluşturulamadı');
      setSmartReplies(response.data.replies || []);
    } catch (error) {
      setAiSummary('AI servisi şu an kullanılamıyor');
      setSmartReplies([
        'Teşekkür ederim, en kısa sürede inceleyeceğim.',
        'Bu konuda size geri dönüş yapacağım.',
        'Detaylı bilgi için teşekkürler.'
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // AI: Generate Reply
  const handleSmartReply = (reply) => {
    setReplyMode('reply');
    setComposeData({
      to: selectedEmail.from_email,
      cc: '', bcc: '',
      subject: `Re: ${selectedEmail.subject}`,
      body: ''
    });
    setIsComposeOpen(true);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = `<p>${reply}</p>`;
      }
    }, 100);
  };

  const handleToggleStar = (email, e) => {
    e?.stopPropagation();
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, starred: !e.starred } : e));
    if (selectedEmail?.id === email.id) {
      setSelectedEmail(prev => ({ ...prev, starred: !prev.starred }));
    }
  };

  const handleMoveToTrash = (email) => {
    setEmails(prev => prev.filter(e => e.id !== email.id));
    setTrashedEmails(prev => [...prev, { ...email, trashedAt: new Date() }]);
    setSelectedEmail(null);
    toast.success('Mail çöp kutusuna taşındı');
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAttachmentSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newAttachments = files.map(file => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success(`${files.length} dosya eklendi`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error('Alıcı ve konu gerekli');
      return;
    }
    const bodyWithSignature = (editorRef.current?.innerHTML || '') + signature;
    setSending(true);
    try {
      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append('to', composeData.to);
        formData.append('subject', composeData.subject);
        formData.append('body', bodyWithSignature);
        formData.append('html', 'true');
        attachments.forEach((att) => {
          formData.append(`attachments`, att.file);
        });
        
        await axios.post(`${API}/mail/send-with-attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/mail/send`, {
          to: composeData.to,
          subject: composeData.subject,
          body: bodyWithSignature,
          html: true
        });
      }
      
      setSentEmails(prev => [{
        id: Date.now().toString(),
        to: composeData.to,
        subject: composeData.subject,
        body: bodyWithSignature,
        date: new Date().toISOString(),
        sent: true
      }, ...prev]);
      
      toast.success('Mail gönderildi');
      setIsComposeOpen(false);
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
      setAttachments([]);
      if (editorRef.current) editorRef.current.innerHTML = '';
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Gönderilemedi';
      if (error.response?.status === 503) {
        setDraftEmails(prev => [{
          id: Date.now().toString(),
          to: composeData.to,
          subject: composeData.subject,
          body: bodyWithSignature,
          date: new Date().toISOString(),
          status: 'blocked'
        }, ...prev]);
        toast.error('Mail sunucusu geçici olarak kullanılamıyor. Taslak olarak kaydedildi.', { duration: 5000 });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSending(false);
    }
  };

  const handleReply = (email, mode = 'reply') => {
    setReplyMode(mode);
    setAttachments([]);
    const replyBody = mode === 'forward' 
      ? `<br><br><div style="border-left: 3px solid #6366f1; padding-left: 12px; margin-left: 0; color: #666;">
          <p style="margin:0"><b>Kimden:</b> ${email.from_name} &lt;${email.from_email}&gt;</p>
          <p style="margin:0"><b>Tarih:</b> ${new Date(email.date).toLocaleString('tr-TR')}</p>
          <p style="margin:0"><b>Konu:</b> ${email.subject}</p>
          <br>${email.body || ''}
        </div>`
      : `<br><br><div style="border-left: 3px solid #6366f1; padding-left: 12px; color: #666;">
          <p style="margin:0">${new Date(email.date).toLocaleString('tr-TR')} tarihinde ${email.from_name} &lt;${email.from_email}&gt; yazdı:</p>
          <br>${email.body || ''}
        </div>`;
    setComposeData({
      to: mode === 'forward' ? '' : email.from_email,
      cc: '', bcc: '',
      subject: mode === 'forward' ? `Fwd: ${email.subject}` : `Re: ${email.subject}`,
      body: replyBody
    });
    setIsComposeOpen(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = replyBody;
    }, 100);
  };

  const openCompose = () => {
    setReplyMode(null);
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
    setAttachments([]);
    setIsComposeOpen(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = '';
    }, 100);
  };

  const getCurrentEmails = () => {
    switch (activeTab) {
      case 'sent': return sentEmails;
      case 'drafts': return draftEmails;
      case 'starred': return emails.filter(e => e.starred);
      case 'trash': return trashedEmails;
      default: return emails;
    }
  };

  const filteredEmails = getCurrentEmails().filter(email => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(searchLower) ||
      email.from_email?.toLowerCase().includes(searchLower) ||
      email.from_name?.toLowerCase().includes(searchLower) ||
      email.to?.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-gradient-to-br from-red-500 to-pink-500', 'bg-gradient-to-br from-blue-500 to-cyan-500', 'bg-gradient-to-br from-green-500 to-emerald-500', 'bg-gradient-to-br from-yellow-500 to-orange-500', 'bg-gradient-to-br from-purple-500 to-violet-500', 'bg-gradient-to-br from-pink-500 to-rose-500', 'bg-gradient-to-br from-indigo-500 to-blue-500', 'bg-gradient-to-br from-teal-500 to-cyan-500'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  // Sidebar Component
  const Sidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'w-full' : 'w-72'} bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 h-full flex flex-col`}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MailOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gewürzberg</h2>
            <p className="text-xs text-slate-400">E-Mail Merkezi</p>
          </div>
        </div>
        <Button 
          onClick={openCompose}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Yeni Mail
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {[
          { id: 'inbox', icon: Inbox, label: 'Gelen Kutusu', count: inboxCount, countColor: 'bg-red-500' },
          { id: 'starred', icon: Star, label: 'Yıldızlı', count: starredCount },
          { id: 'sent', icon: Send, label: 'Gönderilenler', count: sentCount },
          { id: 'drafts', icon: FileText, label: 'Taslaklar', count: draftCount, countColor: 'bg-amber-500' },
          { id: 'trash', icon: Trash2, label: 'Çöp Kutusu' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); if (isMobile) setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${activeTab === item.id 
                ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">{item.label}</span>
            {item.count > 0 && (
              <Badge className={`${item.countColor || 'bg-slate-600'} text-white text-xs px-2`}>
                {item.count}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      <Separator className="bg-slate-700/50 mx-4" />
      
      <div className="p-3">
        <button 
          onClick={() => setIsSignatureOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">İmza Ayarları</span>
        </button>
      </div>
    </div>
  );

  // Email List Item
  const EmailListItem = ({ email, isSent = false }) => {
    const hasAttachments = email.attachments?.length > 0 || email.attachmentCount > 0;
    
    return (
      <div
        onClick={() => handleViewEmail(email)}
        className={`group flex items-center gap-4 px-5 py-4 cursor-pointer border-b border-slate-700/30 transition-all duration-200
          ${selectedEmail?.id === email.id ? 'bg-indigo-900/40 border-l-4 border-l-indigo-500' : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'}
          ${!email.is_read && !isSent ? 'bg-slate-800/30' : ''}`}
      >
        <div className={`w-11 h-11 rounded-full ${getAvatarColor(email.from_name || email.to)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg`}>
          {(isSent ? email.to : (email.from_name || email.from_email))?.[0]?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm truncate ${!email.is_read && !isSent ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
              {isSent ? `Kime: ${email.to}` : (email.from_name || email.from_email?.split('@')[0])}
            </span>
            {hasAttachments && (
              <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            )}
          </div>
          <p className={`text-sm truncate ${!email.is_read && !isSent ? 'text-white font-medium' : 'text-slate-300'}`}>
            {email.subject || '(Konu yok)'}
          </p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {email.snippet?.substring(0, 80) || email.body?.replace(/<[^>]*>/g, '').substring(0, 80)}...
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs ${!email.is_read && !isSent ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
            {formatDate(email.date)}
          </span>
          {!isSent && (
            <button 
              onClick={(e) => handleToggleStar(email, e)}
              className="p-1.5 hover:bg-slate-700/50 rounded-full transition-colors"
            >
              <Star className={`w-4 h-4 transition-all ${email.starred ? 'fill-yellow-400 text-yellow-400 scale-110' : 'text-slate-600 group-hover:text-slate-400'}`} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Process email body to show images properly
  const processEmailBody = (body) => {
    if (!body) return '';
    // Allow images to display with proper styling
    let processed = body.replace(/<img/g, '<img style="max-width:100%;height:auto;border-radius:8px;margin:8px 0;"');
    return processed;
  };

  return (
    <div className="h-[calc(100vh-80px)] flex bg-slate-950 rounded-2xl overflow-hidden shadow-2xl" data-testid="mail-page">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block border-r border-slate-800/50">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80 bg-slate-900 border-slate-800">
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Top Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-slate-300 hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Mail ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 py-5 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-slate-300 hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tab Title */}
        <div className="px-5 py-3 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {activeTab === 'inbox' && 'Gelen Kutusu'}
            {activeTab === 'sent' && 'Gönderilenler'}
            {activeTab === 'drafts' && 'Taslaklar'}
            {activeTab === 'starred' && 'Yıldızlı'}
            {activeTab === 'trash' && 'Çöp Kutusu'}
          </h3>
          <Badge variant="outline" className="text-slate-400 border-slate-700">
            {filteredEmails.length} mail
          </Badge>
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              <p className="text-slate-400">Mailler yükleniyor...</p>
            </div>
          ) : connectionStatus === 'error' ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-lg font-bold text-white mb-2">Bağlantı Hatası</p>
              <p className="text-sm text-slate-400">Ayarlar → IMAP/SMTP yapılandırın</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                <MailOpen className="w-12 h-12 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">
                {activeTab === 'inbox' && 'Gelen kutunuz boş'}
                {activeTab === 'sent' && 'Henüz mail göndermediniz'}
                {activeTab === 'drafts' && 'Taslak yok'}
                {activeTab === 'starred' && 'Yıldızlı mail yok'}
                {activeTab === 'trash' && 'Çöp kutusu boş'}
              </p>
            </div>
          ) : (
            <div>
              {filteredEmails.map(email => (
                <EmailListItem 
                  key={email.id} 
                  email={email} 
                  isSent={activeTab === 'sent'} 
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Floating Compose Button (Mobile) */}
        <button
          onClick={openCompose}
          className="lg:hidden fixed bottom-6 right-6 flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl shadow-indigo-500/30 transition-all duration-200"
        >
          <Pencil className="w-6 h-6" />
        </button>
      </div>

      {/* Email Detail View */}
      {selectedEmail && (
        <div 
          className={`fixed inset-0 z-50 bg-slate-900 flex flex-col transition-all duration-300
            ${isEmailFullscreen ? 'lg:relative lg:flex-1' : 'lg:relative lg:w-[550px]'}`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setSelectedEmail(null); setIsEmailFullscreen(false); setShowAiPanel(false); }}
              className="text-white hover:bg-slate-700 rounded-xl"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1" />
            
            {/* AI Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleAiSummarize}
              disabled={aiLoading}
              className="text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 rounded-xl"
              title="AI ile Özetle"
            >
              {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEmailFullscreen(!isEmailFullscreen)}
              className="text-white hover:bg-slate-700 rounded-xl"
              title={isEmailFullscreen ? 'Küçült' : 'Tam Ekran'}
            >
              {isEmailFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700 rounded-xl">
              <Archive className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleMoveToTrash(selectedEmail)}
              className="text-white hover:bg-red-500/20 hover:text-red-400 rounded-xl"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleToggleStar(selectedEmail)}
              className="text-white hover:bg-slate-700 rounded-xl"
            >
              <Star className={`w-5 h-5 transition-all ${selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          </div>

          {/* Subject */}
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">{selectedEmail.subject || '(Konu yok)'}</h2>
          </div>

          {/* Sender Info */}
          <div className="flex items-start gap-4 p-5 border-b border-slate-700/50">
            <div className={`w-14 h-14 rounded-2xl ${getAvatarColor(selectedEmail.from_name)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              {(selectedEmail.from_name || selectedEmail.from_email)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-lg">{selectedEmail.from_name || 'Bilinmeyen'}</span>
              </div>
              <p className="text-sm text-slate-400">&lt;{selectedEmail.from_email}&gt;</p>
              <p className="text-xs text-slate-500 mt-1">
                <Clock className="w-3 h-3 inline mr-1" />
                {new Date(selectedEmail.date).toLocaleString('tr-TR')}
              </p>
            </div>
          </div>

          {/* AI Panel */}
          {showAiPanel && (
            <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-purple-300">AI Asistan</span>
              </div>
              
              {aiLoading ? (
                <div className="flex items-center gap-2 text-purple-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analiz ediliyor...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 mb-4">{aiSummary}</p>
                  
                  {smartReplies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-purple-400 font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Hızlı Yanıtlar
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {smartReplies.map((reply, i) => (
                          <button
                            key={i}
                            onClick={() => handleSmartReply(reply)}
                            className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-sm rounded-lg transition-all"
                          >
                            {reply.length > 40 ? reply.substring(0, 40) + '...' : reply}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Attachments */}
          {selectedEmail.attachments?.length > 0 && (
            <div className="px-5 py-3 border-b border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> {selectedEmail.attachments.length} Ek
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEmail.attachments.map((att, index) => {
                  const FileIcon = getFileIcon(att.name || att.filename);
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm hover:bg-slate-700/50 cursor-pointer transition-all"
                    >
                      <FileIcon className="w-4 h-4 text-indigo-400" />
                      <span className="max-w-[150px] truncate text-slate-300">{att.name || att.filename}</span>
                      {att.size && <span className="text-xs text-slate-500">({formatFileSize(att.size)})</span>}
                      <Download className="w-3 h-3 text-slate-500" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Email Body */}
          <ScrollArea className="flex-1">
            <div className="p-5 bg-white min-h-full rounded-t-2xl mt-2 mx-2">
              {loadingBody ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="ml-2 text-slate-600">Yükleniyor...</span>
                </div>
              ) : (
                <div 
                  className="prose prose-sm max-w-none"
                  style={{ color: '#1f2937' }}
                  dangerouslySetInnerHTML={{ 
                    __html: processEmailBody(selectedEmail.body) || `<p style="color:#6b7280">${selectedEmail.snippet || 'İçerik yok'}</p>` 
                  }} 
                />
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-sm flex gap-3">
            <Button 
              onClick={() => handleReply(selectedEmail, 'reply')}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl py-5"
            >
              <Reply className="w-4 h-4 mr-2" />
              Yanıtla
            </Button>
            <Button 
              onClick={() => handleReply(selectedEmail, 'forward')}
              variant="outline"
              className="flex-1 border-slate-600 text-white hover:bg-slate-700 rounded-xl py-5"
            >
              <Forward className="w-4 h-4 mr-2" />
              İlet
            </Button>
          </div>
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={(open) => { setIsComposeOpen(open); if (!open) setIsComposeFullscreen(false); }}>
        <DialogContent className={`p-0 gap-0 bg-white border-0 flex flex-col transition-all duration-200 shadow-2xl ${
          isComposeFullscreen 
            ? 'max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none' 
            : 'max-w-2xl max-h-[85vh] rounded-2xl'
        }`}>
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <span className="text-sm font-bold text-white">
              {replyMode === 'reply' ? 'Yanıtla' : replyMode === 'forward' ? 'İlet' : 'Yeni Mesaj'}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsComposeFullscreen(!isComposeFullscreen)}
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                {isComposeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsComposeOpen(false)} 
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center border-b border-slate-200 px-5 py-3">
              <span className="w-16 text-sm text-slate-500 font-medium">Kime</span>
              <Input
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0 text-slate-800"
                placeholder="alici@ornek.com"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowCc(!showCc)} className="text-xs text-indigo-600 hover:text-indigo-700">
                Cc/Bcc
              </Button>
            </div>
            
            {showCc && (
              <>
                <div className="flex items-center border-b border-slate-200 px-5 py-3">
                  <span className="w-16 text-sm text-slate-500 font-medium">Cc</span>
                  <Input value={composeData.cc} onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" />
                </div>
                <div className="flex items-center border-b border-slate-200 px-5 py-3">
                  <span className="w-16 text-sm text-slate-500 font-medium">Bcc</span>
                  <Input value={composeData.bcc} onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" />
                </div>
              </>
            )}
            
            <div className="flex items-center border-b border-slate-200 px-5 py-3">
              <span className="w-16 text-sm text-slate-500 font-medium">Konu</span>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0 text-slate-800 font-medium"
                placeholder="Konu"
              />
            </div>
            
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[200px] p-5 focus:outline-none text-slate-800"
              style={{ minHeight: '200px' }}
              suppressContentEditableWarning
            />
            
            {signature && (
              <div className="px-5 pb-3 text-sm text-slate-500" dangerouslySetInnerHTML={{ __html: signature }} />
            )}
          </div>
          
          {/* Formatting Toolbar */}
          <div className="border-t border-slate-200 px-3 py-2 flex items-center gap-1 bg-slate-50">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('bold')}>
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('italic')}>
              <Italic className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('underline')}>
              <Underline className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200">
                  <Palette className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 rounded-xl">
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className="w-7 h-7 rounded-lg border-2 border-transparent hover:border-slate-300 hover:scale-110 transition-all"
                      style={{ backgroundColor: color }}
                      onClick={() => execCommand('foreColor', color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('insertUnorderedList')}>
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-lg hover:bg-slate-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAttachmentSelect}
            />
          </div>
          
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 flex flex-wrap gap-2 bg-slate-50">
              {attachments.map((att, index) => {
                const FileIcon = getFileIcon(att.name);
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
                  >
                    <FileIcon className="w-4 h-4 text-indigo-500" />
                    <span className="max-w-[150px] truncate text-slate-700">{att.name}</span>
                    <span className="text-xs text-slate-400">({formatFileSize(att.size)})</span>
                    <button 
                      onClick={() => removeAttachment(index)}
                      className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <Button 
              onClick={handleSendEmail} 
              disabled={sending}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 rounded-xl shadow-lg shadow-indigo-500/25"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gönder
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)} className="rounded-lg hover:bg-slate-200">
              <Trash2 className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Settings */}
      <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">E-posta İmzası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              contentEditable
              className="min-h-[150px] p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              dangerouslySetInnerHTML={{ __html: signature }}
              onBlur={(e) => setSignature(e.currentTarget.innerHTML)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsSignatureOpen(false)} className="rounded-xl">
              İptal
            </Button>
            <Button onClick={saveSignature} className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailPage;
