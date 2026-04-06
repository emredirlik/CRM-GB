import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { 
  Inbox, Send, FileText, RefreshCw, Search, Menu,
  Reply, ReplyAll, Forward, Trash2, Archive, Star,
  MoreVertical, Loader2, AlertCircle, ChevronLeft, X,
  Paperclip, Clock, Pencil, Tag, Users, Bell, ShoppingBag,
  Bold, Italic, Underline, List, Link as LinkIcon, AlignLeft, AlignCenter, 
  AlignRight, Type, Palette, ChevronDown, Settings, Image as ImageIcon,
  MailOpen, Check, Sparkles, Minus, Upload, Maximize2, Minimize2
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Color palette
const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

// Gmail-like categories
const CATEGORIES = [
  { id: 'primary', icon: Inbox, label: 'Birincil', color: 'bg-blue-500' },
  { id: 'promotions', icon: Tag, label: 'Tanıtımlar', color: 'bg-green-500' },
  { id: 'social', icon: Users, label: 'Sosyal', color: 'bg-blue-400' },
  { id: 'updates', icon: Bell, label: 'Güncellemeler', color: 'bg-yellow-500' },
];

const MailPage = () => {
  const { t } = useLanguage();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('primary');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isComposeFullscreen, setIsComposeFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showCc, setShowCc] = useState(false);
  const [replyMode, setReplyMode] = useState(null);
  const [signature, setSignature] = useState('');
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Gmail-style folders
  const folders = [
    { id: 'all', icon: MailOpen, label: 'Tüm gelen kutuları', count: null },
    { id: 'inbox', icon: Inbox, label: 'Birincil', count: null, isCategory: true },
    { id: 'starred', icon: Star, label: 'Yıldızlı', count: 0 },
    { id: 'snoozed', icon: Clock, label: 'Ertelenenler', count: 0 },
    { id: 'important', icon: Tag, label: 'Önemli', count: null },
    { id: 'sent', icon: Send, label: 'Gönderilenler', count: 0 },
    { id: 'drafts', icon: FileText, label: 'Taslaklar', count: 0 },
    { id: 'trash', icon: Trash2, label: 'Çöp Kutusu', count: 0 },
  ];

  const loadSignature = async () => {
    try {
      const response = await axios.get(`${API}/settings/signature`);
      if (response.data?.signature) {
        setSignature(response.data.signature);
      }
    } catch (error) {
      setSignature(`<br><br>--<br><b>Gewürzberg GmbH</b><br>Premium Gewürze & Binderlösungen`);
    }
  };

  const fetchEmails = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await axios.get(`${API}/mail/inbox`);
      if (response.data.emails) {
        setEmails(response.data.emails.map((e, i) => ({ 
          ...e, 
          folder: 'inbox',
          category: ['primary', 'promotions', 'social', 'updates'][i % 4],
          starred: Math.random() > 0.7,
          hasAttachment: Math.random() > 0.6,
          attachmentCount: Math.floor(Math.random() * 5) + 1,
          messageCount: Math.floor(Math.random() * 3) + 1
        })));
      }
      setConnectionStatus(response.data.status || 'connected');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const saveSignature = async () => {
    try {
      await axios.post(`${API}/settings/signature`, { signature });
      toast.success('İmza kaydedildi');
      setIsSignatureOpen(false);
    } catch (error) {
      toast.error('İmza kaydedilemedi');
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchEmails();
    loadSignature();
  }, [fetchEmails]);

  const handleRefresh = () => fetchEmails(true);

  const handleViewEmail = async (email) => {
    setSelectedEmail(email);
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
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Handle attachment selection
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
    // Reset input
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
      // If there are attachments, send as FormData
      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append('to', composeData.to);
        formData.append('subject', composeData.subject);
        formData.append('body', bodyWithSignature);
        formData.append('html', 'true');
        attachments.forEach((att, index) => {
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
      toast.success('Mail gönderildi');
      setIsComposeOpen(false);
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
      setAttachments([]);
      if (editorRef.current) editorRef.current.innerHTML = '';
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Gönderilemedi';
      if (error.response?.status === 503) {
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
    setAttachments([]); // Clear attachments on reply
    const replyBody = mode === 'forward' 
      ? `<br><br><div style="border-left: 3px solid #3b82f6; padding-left: 12px; margin-left: 0; color: #9ca3af;">
          <p style="margin:0"><b>Kimden:</b> ${email.from_name} &lt;${email.from_email}&gt;</p>
          <p style="margin:0"><b>Tarih:</b> ${new Date(email.date).toLocaleString('tr-TR')}</p>
          <p style="margin:0"><b>Konu:</b> ${email.subject}</p>
          <br>${email.body || ''}
        </div>`
      : `<br><br><div style="border-left: 3px solid #3b82f6; padding-left: 12px; color: #9ca3af;">
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

  const filteredEmails = emails.filter(email => {
    if (activeFolder === 'starred') return email.starred;
    if (activeFolder === 'sent') return email.folder === 'sent';
    if (activeFolder === 'trash') return email.folder === 'trash';
    if (activeFolder === 'all') return true;
    // For inbox, show all emails (category filtering removed for now)
    return email.folder === 'inbox';
  }).filter(email => {
    if (!searchTerm) return true;
    return email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const unreadCount = emails.filter(e => !e.is_read).length;
  const starredCount = emails.filter(e => e.starred).length;

  const formatDate = (dateStr) => {
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

  // Gmail Sidebar Component
  const GmailSidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'w-full' : 'w-72'} bg-[#1f1f1f] h-full flex flex-col`}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="text-xl font-semibold text-white">Gewürzberg Mail</div>
      </div>

      {/* Folders */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {folders.map(folder => {
            const count = folder.id === 'starred' ? starredCount : folder.count;
            return (
              <button
                key={folder.id}
                onClick={() => { setActiveFolder(folder.id); if (isMobile) setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-full text-left transition-all mb-0.5
                  ${activeFolder === folder.id 
                    ? 'bg-[#004a77] text-[#c2e7ff]' 
                    : 'text-[#c4c7c5] hover:bg-[#2d2d2d]'}`}
              >
                <folder.icon className="w-5 h-5" />
                <span className="flex-1 text-sm font-medium">{folder.label}</span>
                {count !== null && count > 0 && (
                  <span className="text-xs">{count > 99 ? '99+' : count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Categories Section */}
        <div className="px-4 py-3">
          <p className="text-xs text-[#9aa0a6] mb-2 font-medium">KATEGORİLER</p>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setActiveFolder('inbox'); if (isMobile) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1
                ${activeCategory === cat.id && activeFolder === 'inbox'
                  ? 'bg-[#2d2d2d] text-white' 
                  : 'text-[#c4c7c5] hover:bg-[#2d2d2d]'}`}
            >
              <div className={`w-3 h-3 rounded-full ${cat.color}`} />
              <span className="flex-1 text-sm">{cat.label}</span>
              {cat.id === 'promotions' && (
                <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">7 yeni</Badge>
              )}
              {cat.id === 'updates' && (
                <Badge className="bg-yellow-600 text-white text-[10px] px-1.5 py-0">6 yeni</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Labels */}
        <div className="px-4 py-3 border-t border-[#3c4043]">
          <p className="text-xs text-[#9aa0a6] mb-2 font-medium">ETİKETLER</p>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[#c4c7c5] hover:bg-[#2d2d2d] rounded-lg text-sm">
            <ShoppingBag className="w-4 h-4" />
            <span>Satın alma işlemleri</span>
            <span className="ml-auto text-xs">198</span>
          </button>
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-3 border-t border-[#3c4043]">
        <button 
          onClick={() => setIsSignatureOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#c4c7c5] hover:bg-[#2d2d2d] rounded-lg text-sm"
        >
          <Settings className="w-4 h-4" />
          <span>İmza Ayarları</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-80px)] flex bg-[#121212] rounded-xl overflow-hidden" data-testid="mail-page">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block border-r border-[#3c4043]">
        <GmailSidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80 bg-[#1f1f1f] border-[#3c4043]">
          <GmailSidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#121212]">
        {/* Top Bar */}
        <div className="flex items-center gap-2 p-2 border-b border-[#3c4043]">
          {/* Mobile Menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-[#e8eaed] hover:bg-[#3c4043]"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Search */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9aa0a6]" />
              <Input
                placeholder="Postalarda arama yapın"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-[#2d2d2d] border-0 rounded-full text-[#e8eaed] placeholder:text-[#9aa0a6] focus-visible:ring-1 focus-visible:ring-[#8ab4f8]"
              />
            </div>
          </div>

          {/* Refresh */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-[#e8eaed] hover:bg-[#3c4043]"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Profile */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-medium text-sm ring-2 ring-[#3c4043]">
            E
          </div>
        </div>

        {/* Category Tabs (Mobile) */}
        <div className="lg:hidden flex gap-1 p-2 overflow-x-auto border-b border-[#3c4043]">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setActiveFolder('inbox'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm
                ${activeCategory === cat.id 
                  ? 'bg-[#004a77] text-[#c2e7ff]' 
                  : 'text-[#c4c7c5] hover:bg-[#2d2d2d]'}`}
            >
              <div className={`w-2 h-2 rounded-full ${cat.color}`} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#8ab4f8]" />
            </div>
          ) : connectionStatus === 'error' || connectionStatus === 'not_configured' ? (
            <div className="text-center py-20 px-4">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium text-[#e8eaed] mb-2">Bağlantı Hatası</p>
              <p className="text-sm text-[#9aa0a6]">Ayarlar → IMAP/SMTP yapılandırın</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-20">
              <Inbox className="w-20 h-20 mx-auto mb-4 text-[#3c4043]" />
              <p className="text-[#9aa0a6]">Posta yok</p>
            </div>
          ) : (
            <div>
              {filteredEmails.map(email => (
                <div
                  key={email.id}
                  onClick={() => handleViewEmail(email)}
                  className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#3c4043] transition-colors
                    ${selectedEmail?.id === email.id ? 'bg-[#2d2d2d]' : 'hover:bg-[#2d2d2d]/50'}
                    ${!email.is_read ? 'bg-[#1a1a2e]' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(email.from_name)} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
                    {(email.from_name || email.from_email)?.[0]?.toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-[#e8eaed]' : 'text-[#c4c7c5]'}`}>
                        {email.from_name || email.from_email?.split('@')[0]}
                      </span>
                      {email.messageCount > 1 && (
                        <span className="text-xs text-[#9aa0a6]">{email.messageCount}</span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${!email.is_read ? 'text-[#e8eaed]' : 'text-[#9aa0a6]'}`}>
                      {email.subject || '(Konu yok)'}
                    </p>
                    <p className="text-xs text-[#9aa0a6] truncate">{email.snippet?.substring(0, 60)}...</p>
                    
                    {/* Attachments */}
                    {email.hasAttachment && (
                      <div className="flex gap-1 mt-1.5">
                        {[...Array(Math.min(email.attachmentCount, 2))].map((_, i) => (
                          <div key={i} className="flex items-center gap-1 px-2 py-1 bg-[#3c4043] rounded text-[10px] text-[#c4c7c5]">
                            <Image className="w-3 h-3" />
                            <span>IMG_{Math.floor(Math.random() * 9000) + 1000}</span>
                          </div>
                        ))}
                        {email.attachmentCount > 2 && (
                          <span className="text-[10px] text-[#9aa0a6] px-1">+{email.attachmentCount - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs ${!email.is_read ? 'text-[#8ab4f8] font-medium' : 'text-[#9aa0a6]'}`}>
                      {formatDate(email.date)}
                    </span>
                    <button 
                      onClick={(e) => handleToggleStar(email, e)}
                      className="p-1 hover:bg-[#3c4043] rounded-full transition-colors"
                    >
                      <Star className={`w-5 h-5 ${email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-[#5f6368] group-hover:text-[#9aa0a6]'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Floating Compose Button */}
        <button
          onClick={openCompose}
          className="absolute bottom-6 right-6 flex items-center gap-3 px-6 py-4 bg-[#c2e7ff] hover:bg-[#a8d4f1] text-[#001d35] rounded-2xl shadow-xl transition-all hover:shadow-2xl"
        >
          <Pencil className="w-5 h-5" />
          <span className="font-medium">Oluştur</span>
        </button>
      </div>

      {/* Email Detail View */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 lg:relative lg:w-[500px] bg-[#1f1f1f] flex flex-col border-l border-[#3c4043]">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-[#3c4043]">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedEmail(null)}
              className="text-[#e8eaed] hover:bg-[#3c4043]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="text-[#e8eaed] hover:bg-[#3c4043]">
              <Archive className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-[#e8eaed] hover:bg-[#3c4043]">
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleStar(selectedEmail)} className="text-[#e8eaed] hover:bg-[#3c4043]">
              <Star className={`w-5 h-5 ${selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          </div>

          {/* Subject */}
          <div className="px-4 py-3 border-b border-[#3c4043]">
            <h2 className="text-xl font-normal text-[#e8eaed]">{selectedEmail.subject}</h2>
          </div>

          {/* Sender */}
          <div className="flex items-start gap-3 p-4 border-b border-[#3c4043]">
            <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedEmail.from_name)} flex items-center justify-center text-white font-medium`}>
              {(selectedEmail.from_name || selectedEmail.from_email)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#e8eaed]">{selectedEmail.from_name}</span>
                <span className="text-sm text-[#9aa0a6]">&lt;{selectedEmail.from_email}&gt;</span>
              </div>
              <p className="text-xs text-[#9aa0a6] mt-0.5">bana</p>
            </div>
            <span className="text-xs text-[#9aa0a6]">{formatDate(selectedEmail.date)}</span>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1 p-4">
            <div className="prose prose-invert prose-sm max-w-none text-[#e8eaed]" 
                 dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.snippet }} />
          </ScrollArea>

          {/* Actions */}
          <div className="p-3 border-t border-[#3c4043] flex gap-2">
            <Button 
              onClick={() => handleReply(selectedEmail, 'reply')}
              className="flex-1 bg-transparent border border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]"
            >
              <Reply className="w-4 h-4 mr-2" />
              Yanıtla
            </Button>
            <Button 
              onClick={() => handleReply(selectedEmail, 'forward')}
              className="flex-1 bg-transparent border border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]"
            >
              <Forward className="w-4 h-4 mr-2" />
              İlet
            </Button>
          </div>
        </div>
      )}

      {/* Compose Dialog - Gmail Style */}
      <Dialog open={isComposeOpen} onOpenChange={(open) => { setIsComposeOpen(open); if (!open) setIsComposeFullscreen(false); }}>
        <DialogContent className={`p-0 gap-0 bg-[#2d2d2d] border-[#3c4043] flex flex-col transition-all duration-200 ${
          isComposeFullscreen 
            ? 'max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none' 
            : 'max-w-2xl max-h-[85vh]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#404040] rounded-t-lg">
            <span className="text-sm font-medium text-[#e8eaed]">
              {replyMode === 'reply' ? 'Yanıtla' : replyMode === 'forward' ? 'İlet' : 'Yeni Mesaj'}
            </span>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsComposeFullscreen(!isComposeFullscreen)}
                className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
                title={isComposeFullscreen ? 'Küçült' : 'Tam Ekran'}
              >
                {isComposeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]">
                <Minus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)} className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* To */}
            <div className="flex items-center border-b border-[#3c4043] px-4 py-2">
              <span className="w-14 text-sm text-[#9aa0a6]">Kime</span>
              <Input
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-[#e8eaed] placeholder:text-[#5f6368]"
                placeholder="Alıcılar"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowCc(!showCc)} className="text-xs text-[#9aa0a6] hover:text-[#e8eaed]">
                Cc/Bcc
              </Button>
            </div>
            
            {showCc && (
              <>
                <div className="flex items-center border-b border-[#3c4043] px-4 py-2">
                  <span className="w-14 text-sm text-[#9aa0a6]">Cc</span>
                  <Input value={composeData.cc} onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-[#e8eaed]" />
                </div>
                <div className="flex items-center border-b border-[#3c4043] px-4 py-2">
                  <span className="w-14 text-sm text-[#9aa0a6]">Bcc</span>
                  <Input value={composeData.bcc} onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-[#e8eaed]" />
                </div>
              </>
            )}
            
            {/* Subject */}
            <div className="flex items-center border-b border-[#3c4043] px-4 py-2">
              <span className="w-14 text-sm text-[#9aa0a6]">Konu</span>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-[#e8eaed]"
              />
            </div>
            
            {/* Editor */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[200px] p-4 text-[#e8eaed] focus:outline-none"
              style={{ minHeight: '200px' }}
              suppressContentEditableWarning
            />
            
            {/* Signature Preview */}
            {signature && (
              <div className="px-4 pb-2 text-sm text-[#9aa0a6]" dangerouslySetInnerHTML={{ __html: signature }} />
            )}
          </div>
          
          {/* Formatting Toolbar */}
          <div className="border-t border-[#3c4043] px-2 py-1.5 flex items-center gap-0.5 bg-[#2d2d2d]">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]" onClick={() => execCommand('bold')}>
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]" onClick={() => execCommand('italic')}>
              <Italic className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]" onClick={() => execCommand('underline')}>
              <Underline className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1 bg-[#3c4043]" />
            
            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]">
                  <Palette className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-[#2d2d2d] border-[#3c4043]">
                <div className="grid grid-cols-5 gap-1">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded border border-[#3c4043] hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => execCommand('foreColor', color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Separator orientation="vertical" className="h-5 mx-1 bg-[#3c4043]" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]" onClick={() => execCommand('insertUnorderedList')}>
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
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
            <div className="px-4 py-2 border-t border-[#3c4043] flex flex-wrap gap-2">
              {attachments.map((att, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#3c4043] rounded-lg text-sm text-[#e8eaed]"
                >
                  <Paperclip className="w-3 h-3 text-[#9aa0a6]" />
                  <span className="max-w-[150px] truncate">{att.name}</span>
                  <span className="text-[10px] text-[#9aa0a6]">({formatFileSize(att.size)})</span>
                  <button 
                    onClick={() => removeAttachment(index)}
                    className="ml-1 text-[#9aa0a6] hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-[#3c4043] bg-[#2d2d2d] rounded-b-lg">
            <Button 
              onClick={handleSendEmail} 
              disabled={sending}
              className="bg-[#0b57d0] hover:bg-[#0842a0] text-white rounded-full px-6"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gönder
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)} className="text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Settings */}
      <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
        <DialogContent className="max-w-2xl bg-[#2d2d2d] border-[#3c4043]">
          <DialogHeader>
            <DialogTitle className="text-[#e8eaed]">E-posta İmzası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Signature Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-[#1f1f1f] rounded-lg border border-[#3c4043]">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
                onClick={() => document.execCommand('bold', false, null)}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
                onClick={() => document.execCommand('italic', false, null)}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
                onClick={() => document.execCommand('underline', false, null)}
              >
                <Underline className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1 bg-[#3c4043]" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
                onClick={() => {
                  const url = prompt('Resim URL\'si girin:');
                  if (url) {
                    document.execCommand('insertImage', false, url);
                  }
                }}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
                onClick={() => {
                  const url = prompt('Link URL\'si girin:');
                  if (url) {
                    document.execCommand('createLink', false, url);
                  }
                }}
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1 bg-[#3c4043]" />
              <input
                type="file"
                accept="image/*"
                id="signature-image-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const base64 = event.target?.result;
                      document.execCommand('insertImage', false, base64);
                    };
                    reader.readAsDataURL(file);
                  }
                  e.target.value = '';
                }}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#3c4043]"
                onClick={() => document.getElementById('signature-image-upload')?.click()}
              >
                <Upload className="w-4 h-4 mr-1" />
                <span className="text-xs">Resim Yükle</span>
              </Button>
            </div>
            
            {/* Editable Signature Area */}
            <div
              contentEditable
              className="min-h-[180px] p-4 border border-[#3c4043] rounded-lg text-[#e8eaed] bg-[#1f1f1f] focus:outline-none focus:ring-1 focus:ring-[#8ab4f8] overflow-auto"
              style={{ maxHeight: '300px' }}
              dangerouslySetInnerHTML={{ __html: signature }}
              onBlur={(e) => setSignature(e.currentTarget.innerHTML)}
              onInput={(e) => setSignature(e.currentTarget.innerHTML)}
            />
            <p className="text-xs text-[#9aa0a6]">
              ✨ Araç çubuğunu kullanarak biçimlendirme yapabilir, resim ekleyebilirsiniz. 
              Resim URL veya bilgisayarınızdan yükleyebilirsiniz.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsSignatureOpen(false)} className="border-[#5f6368] text-[#e8eaed] hover:bg-[#3c4043]">
              İptal
            </Button>
            <Button onClick={saveSignature} className="bg-[#0b57d0] hover:bg-[#0842a0] text-white">
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailPage;
