import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  MailOpen, Minus, Maximize2, Minimize2, File, Download
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

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
    
    // Load sent emails from local storage
    const loadSentEmails = async () => {
      try {
        const response = await axios.get(`${API}/mail/sent`);
        if (response.data?.emails) {
          setSentEmails(response.data.emails);
        }
      } catch (e) {
        // Sent emails might not be available
      }
    };
    
    // Load drafts
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
    
    // Load signature
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
    
    // Lazy load email body if not already loaded
    if (!email.body || email.body === '') {
      setLoadingBody(true);
      try {
        const response = await axios.get(`${API}/mail/body/${email.id}`);
        if (response.data) {
          const updatedEmail = { ...email, body: response.data.body || response.data.plain || '' };
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
      
      // Add to sent
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
        // Save as draft
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
      ? `<br><br><div style="border-left: 3px solid #3b82f6; padding-left: 12px; margin-left: 0; color: #666;">
          <p style="margin:0"><b>Kimden:</b> ${email.from_name} &lt;${email.from_email}&gt;</p>
          <p style="margin:0"><b>Tarih:</b> ${new Date(email.date).toLocaleString('tr-TR')}</p>
          <p style="margin:0"><b>Konu:</b> ${email.subject}</p>
          <br>${email.body || ''}
        </div>`
      : `<br><br><div style="border-left: 3px solid #3b82f6; padding-left: 12px; color: #666;">
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

  // Get current emails based on active tab
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
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  // Sidebar Component
  const Sidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'w-full' : 'w-64'} bg-slate-900 h-full flex flex-col`}>
      <div className="p-4">
        <h2 className="text-xl font-bold text-white mb-4">Gewürzberg Mail</h2>
        <Button 
          onClick={openCompose}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Yeni Mail
        </Button>
      </div>

      <nav className="flex-1 px-2">
        <button
          onClick={() => { setActiveTab('inbox'); if (isMobile) setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all
            ${activeTab === 'inbox' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Inbox className="w-5 h-5" />
          <span className="flex-1 text-left">Gelen Kutusu</span>
          {inboxCount > 0 && (
            <Badge className="bg-red-500 text-white">{inboxCount}</Badge>
          )}
        </button>
        
        <button
          onClick={() => { setActiveTab('starred'); if (isMobile) setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all
            ${activeTab === 'starred' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Star className="w-5 h-5" />
          <span className="flex-1 text-left">Yıldızlı</span>
          {starredCount > 0 && (
            <span className="text-sm text-slate-400">{starredCount}</span>
          )}
        </button>
        
        <button
          onClick={() => { setActiveTab('sent'); if (isMobile) setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all
            ${activeTab === 'sent' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Send className="w-5 h-5" />
          <span className="flex-1 text-left">Gönderilenler</span>
          {sentCount > 0 && (
            <span className="text-sm text-slate-400">{sentCount}</span>
          )}
        </button>
        
        <button
          onClick={() => { setActiveTab('drafts'); if (isMobile) setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all
            ${activeTab === 'drafts' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="flex-1 text-left">Taslaklar</span>
          {draftCount > 0 && (
            <Badge className="bg-amber-500 text-white">{draftCount}</Badge>
          )}
        </button>
        
        <button
          onClick={() => { setActiveTab('trash'); if (isMobile) setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all
            ${activeTab === 'trash' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        >
          <Trash2 className="w-5 h-5" />
          <span className="flex-1 text-left">Çöp Kutusu</span>
        </button>
      </nav>

      <div className="p-3 border-t border-slate-700">
        <button 
          onClick={() => setIsSignatureOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg"
        >
          <Settings className="w-4 h-4" />
          <span>İmza Ayarları</span>
        </button>
      </div>
    </div>
  );

  // Email List Item
  const EmailListItem = ({ email, isSent = false }) => (
    <div
      onClick={() => handleViewEmail(email)}
      className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-700/50 transition-all
        ${selectedEmail?.id === email.id ? 'bg-indigo-900/30' : 'hover:bg-slate-800/50'}
        ${!email.is_read && !isSent ? 'bg-slate-800/30' : ''}`}
    >
      <div className={`w-10 h-10 rounded-full ${getAvatarColor(email.from_name || email.to)} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
        {(isSent ? email.to : (email.from_name || email.from_email))?.[0]?.toUpperCase() || '?'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm truncate ${!email.is_read && !isSent ? 'font-semibold text-white' : 'text-slate-300'}`}>
            {isSent ? `Kime: ${email.to}` : (email.from_name || email.from_email?.split('@')[0])}
          </span>
        </div>
        <p className={`text-sm truncate ${!email.is_read && !isSent ? 'text-white' : 'text-slate-400'}`}>
          {email.subject || '(Konu yok)'}
        </p>
        <p className="text-xs text-slate-500 truncate">{email.snippet?.substring(0, 60) || email.body?.substring(0, 60)}...</p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={`text-xs ${!email.is_read && !isSent ? 'text-indigo-400 font-medium' : 'text-slate-500'}`}>
          {formatDate(email.date)}
        </span>
        {!isSent && (
          <button 
            onClick={(e) => handleToggleStar(email, e)}
            className="p-1 hover:bg-slate-700 rounded-full transition-colors"
          >
            <Star className={`w-4 h-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] flex bg-slate-950 rounded-xl overflow-hidden" data-testid="mail-page">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block border-r border-slate-800">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800">
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {/* Top Bar */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-800">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Mail ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tab Title */}
        <div className="px-4 py-2 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">
            {activeTab === 'inbox' && 'Gelen Kutusu'}
            {activeTab === 'sent' && 'Gönderilenler'}
            {activeTab === 'drafts' && 'Taslaklar'}
            {activeTab === 'starred' && 'Yıldızlı'}
            {activeTab === 'trash' && 'Çöp Kutusu'}
          </h3>
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : connectionStatus === 'error' ? (
            <div className="text-center py-20 px-4">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium text-white mb-2">Bağlantı Hatası</p>
              <p className="text-sm text-slate-400">Ayarlar → IMAP/SMTP yapılandırın</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-20">
              <MailOpen className="w-20 h-20 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-400">
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
          className="lg:hidden fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl"
        >
          <Pencil className="w-6 h-6" />
        </button>
      </div>

      {/* Email Detail View */}
      {selectedEmail && (
        <div 
          className={`fixed inset-0 z-50 bg-slate-900 flex flex-col transition-all duration-200
            ${isEmailFullscreen ? 'lg:relative lg:flex-1' : 'lg:relative lg:w-[500px]'}`}
          onDoubleClick={() => setIsEmailFullscreen(!isEmailFullscreen)}
        >
          <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setSelectedEmail(null); setIsEmailFullscreen(false); }}
              className="text-white hover:bg-slate-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEmailFullscreen(!isEmailFullscreen)}
              className="text-white hover:bg-slate-700"
              title={isEmailFullscreen ? 'Küçült' : 'Tam Ekran'}
            >
              {isEmailFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700">
              <Archive className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleMoveToTrash(selectedEmail)}
              className="text-white hover:bg-slate-700"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleToggleStar(selectedEmail)}
              className="text-white hover:bg-slate-700"
            >
              <Star className={`w-5 h-5 ${selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          </div>

          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">{selectedEmail.subject || '(Konu yok)'}</h2>
          </div>

          <div className="flex items-start gap-3 p-4 border-b border-slate-700">
            <div className={`w-12 h-12 rounded-full ${getAvatarColor(selectedEmail.from_name)} flex items-center justify-center text-white font-medium text-lg`}>
              {(selectedEmail.from_name || selectedEmail.from_email)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-white">{selectedEmail.from_name || 'Bilinmeyen'}</span>
                <span className="text-sm text-slate-400">&lt;{selectedEmail.from_email}&gt;</span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">Bana • {formatDate(selectedEmail.date)}</p>
            </div>
          </div>

          {/* Email Body */}
          <ScrollArea className="flex-1">
            <div className="p-4 bg-white min-h-full">
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
                    __html: selectedEmail.body || `<p style="color:#6b7280">${selectedEmail.snippet || 'İçerik yok'}</p>` 
                  }} 
                />
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="p-3 border-t border-slate-700 bg-slate-800 flex gap-2">
            <Button 
              onClick={() => handleReply(selectedEmail, 'reply')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Reply className="w-4 h-4 mr-2" />
              Yanıtla
            </Button>
            <Button 
              onClick={() => handleReply(selectedEmail, 'forward')}
              variant="outline"
              className="flex-1 border-slate-600 text-white hover:bg-slate-700"
            >
              <Forward className="w-4 h-4 mr-2" />
              İlet
            </Button>
          </div>
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={(open) => { setIsComposeOpen(open); if (!open) setIsComposeFullscreen(false); }}>
        <DialogContent className={`p-0 gap-0 bg-white border-slate-200 flex flex-col transition-all duration-200 ${
          isComposeFullscreen 
            ? 'max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none' 
            : 'max-w-2xl max-h-[85vh]'
        }`}>
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 rounded-t-lg">
            <span className="text-sm font-medium text-white">
              {replyMode === 'reply' ? 'Yanıtla' : replyMode === 'forward' ? 'İlet' : 'Yeni Mesaj'}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsComposeFullscreen(!isComposeFullscreen)}
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-indigo-700"
              >
                {isComposeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsComposeOpen(false)} 
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-indigo-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center border-b border-slate-200 px-4 py-2">
              <span className="w-16 text-sm text-slate-500">Kime</span>
              <Input
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0"
                placeholder="alici@ornek.com"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowCc(!showCc)} className="text-xs text-slate-500">
                Cc/Bcc
              </Button>
            </div>
            
            {showCc && (
              <>
                <div className="flex items-center border-b border-slate-200 px-4 py-2">
                  <span className="w-16 text-sm text-slate-500">Cc</span>
                  <Input value={composeData.cc} onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" />
                </div>
                <div className="flex items-center border-b border-slate-200 px-4 py-2">
                  <span className="w-16 text-sm text-slate-500">Bcc</span>
                  <Input value={composeData.bcc} onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" />
                </div>
              </>
            )}
            
            <div className="flex items-center border-b border-slate-200 px-4 py-2">
              <span className="w-16 text-sm text-slate-500">Konu</span>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0"
                placeholder="Konu"
              />
            </div>
            
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[200px] p-4 focus:outline-none"
              style={{ minHeight: '200px' }}
              suppressContentEditableWarning
            />
            
            {signature && (
              <div className="px-4 pb-2 text-sm text-slate-500" dangerouslySetInnerHTML={{ __html: signature }} />
            )}
          </div>
          
          {/* Formatting Toolbar */}
          <div className="border-t border-slate-200 px-2 py-1.5 flex items-center gap-0.5 bg-slate-50">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('bold')}>
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('italic')}>
              <Italic className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('underline')}>
              <Underline className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Palette className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-5 gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => execCommand('foreColor', color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertUnorderedList')}>
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
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
            <div className="px-4 py-2 border-t border-slate-200 flex flex-wrap gap-2 bg-slate-50">
              {attachments.map((att, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                >
                  <File className="w-4 h-4 text-slate-400" />
                  <span className="max-w-[150px] truncate">{att.name}</span>
                  <span className="text-xs text-slate-400">({formatFileSize(att.size)})</span>
                  <button 
                    onClick={() => removeAttachment(index)}
                    className="ml-1 text-slate-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-200 bg-slate-50 rounded-b-lg">
            <Button 
              onClick={handleSendEmail} 
              disabled={sending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gönder
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)}>
              <Trash2 className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Settings */}
      <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>E-posta İmzası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              contentEditable
              className="min-h-[150px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              dangerouslySetInnerHTML={{ __html: signature }}
              onBlur={(e) => setSignature(e.currentTarget.innerHTML)}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsSignatureOpen(false)}>
              İptal
            </Button>
            <Button onClick={saveSignature} className="bg-indigo-600 hover:bg-indigo-700">
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailPage;
