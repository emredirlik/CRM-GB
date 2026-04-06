import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Inbox, Send, FileText, RefreshCw, Search, Mail, 
  Reply, ReplyAll, Forward, Trash2, Archive, Star,
  MoreVertical, Loader2, AlertCircle, ChevronLeft,
  Paperclip, X, Check, Clock, AlertTriangle, Pencil,
  Bold, Italic, Underline, List, Link, Image, Smile,
  AlignLeft, AlignCenter, AlignRight, Type, Palette,
  Minus, Plus, ChevronDown, Settings
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Color palette for text
const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

const MailPage = () => {
  const { t } = useLanguage();
  const editorRef = useRef(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showCc, setShowCc] = useState(false);
  const [replyMode, setReplyMode] = useState(null);
  const [signature, setSignature] = useState('');
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);

  const folders = [
    { id: 'inbox', icon: Inbox, label: t('inbox'), color: 'text-blue-600' },
    { id: 'starred', icon: Star, label: t('starred'), color: 'text-yellow-500' },
    { id: 'sent', icon: Send, label: t('sent'), color: 'text-green-600' },
    { id: 'drafts', icon: FileText, label: t('drafts'), color: 'text-gray-600' },
    { id: 'trash', icon: Trash2, label: t('trash'), color: 'text-red-600' },
  ];

  useEffect(() => {
    fetchEmails();
    loadSignature();
  }, []);

  const loadSignature = async () => {
    try {
      const response = await axios.get(`${API}/settings/signature`);
      if (response.data?.signature) {
        setSignature(response.data.signature);
      }
    } catch (error) {
      // Default signature
      setSignature(`<br><br>--<br><strong>Gewürzberg GmbH</strong><br>Premium Gewürze & Binderlösungen`);
    }
  };

  const saveSignature = async () => {
    try {
      await axios.post(`${API}/settings/signature`, { signature });
      toast.success(t('success'), { description: 'İmza kaydedildi' });
      setIsSignatureOpen(false);
    } catch (error) {
      toast.error(t('error'), { description: 'İmza kaydedilemedi' });
    }
  };

  const fetchEmails = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await axios.get(`${API}/mail/inbox`);
      if (response.data.emails) {
        setEmails(response.data.emails.map(e => ({ ...e, folder: 'inbox', starred: false })));
      }
      setConnectionStatus(response.data.status || 'connected');
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const handleSelectAll = () => {
    if (selectedEmails.size === filteredEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    }
  };

  // Rich text formatting
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error(t('error'), { description: t('required') + ': ' + t('to') + ', ' + t('subject') });
      return;
    }

    const bodyWithSignature = editorRef.current?.innerHTML + signature;

    setSending(true);
    try {
      await axios.post(`${API}/mail/send`, {
        to: composeData.to,
        subject: composeData.subject,
        body: bodyWithSignature,
        html: true
      });
      toast.success(t('success'), { description: t('emailSent') });
      setIsComposeOpen(false);
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
      if (editorRef.current) editorRef.current.innerHTML = '';
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || t('somethingWentWrong') });
    } finally {
      setSending(false);
    }
  };

  const handleReply = (email, mode = 'reply') => {
    setReplyMode(mode);
    const replyBody = mode === 'forward' 
      ? `<br><br><div style="border-left: 2px solid #ccc; padding-left: 10px; color: #666;">
          <p><strong>${t('from')}:</strong> ${email.from_name} &lt;${email.from_email}&gt;</p>
          <p><strong>${t('date')}:</strong> ${new Date(email.date).toLocaleString()}</p>
          <p><strong>${t('subject')}:</strong> ${email.subject}</p>
          <br>${email.body || ''}
        </div>`
      : `<br><br><div style="border-left: 2px solid #ccc; padding-left: 10px; color: #666;">
          <p>${new Date(email.date).toLocaleString()} - ${email.from_name} &lt;${email.from_email}&gt;:</p>
          <br>${email.body || ''}
        </div>`;

    setComposeData({
      to: mode === 'forward' ? '' : email.from_email,
      cc: '',
      bcc: '',
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
    setIsComposeOpen(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = '';
    }, 100);
  };

  const filteredEmails = emails.filter(email => {
    let matchesFolder = activeFolder === 'starred' ? email.starred : email.folder === activeFolder;
    const matchesSearch = !searchTerm || 
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const unreadCount = emails.filter(e => e.folder === 'inbox' && !e.is_read).length;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="mail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-['Manrope']">Mail</h1>
          <p className="text-sm text-muted-foreground">
            {connectionStatus === 'connected' ? (
              <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> {t('connectionSuccess')}</span>
            ) : connectionStatus === 'error' ? (
              <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t('connectionFailed')}</span>
            ) : (
              <span className="text-yellow-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {t('loading')}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSignatureOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            {t('signature') || 'İmza'}
          </Button>
          <Button onClick={openCompose} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
            <Pencil className="w-4 h-4 mr-2" />
            {t('compose')}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Sidebar */}
        <Card className="w-48 lg:w-52 flex-shrink-0 hidden md:block">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                    ${activeFolder === folder.id ? 'bg-indigo-100 text-indigo-700 font-medium' : 'hover:bg-muted'}`}
                >
                  <folder.icon className={`w-4 h-4 ${activeFolder === folder.id ? 'text-indigo-600' : folder.color}`} />
                  <span className="flex-1 text-sm">{folder.label}</span>
                  {folder.id === 'inbox' && unreadCount > 0 && (
                    <Badge className="bg-indigo-600 text-white text-xs px-1.5">{unreadCount}</Badge>
                  )}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="p-3 border-b flex flex-wrap items-center gap-2">
            <Checkbox 
              checked={selectedEmails.size === filteredEmails.length && filteredEmails.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex-1" />
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={`${t('search')}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>

          {/* Email List / Detail */}
          <div className="flex-1 flex min-h-0">
            <ScrollArea className={`${selectedEmail ? 'w-2/5 border-r hidden lg:block' : 'w-full'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="text-center py-20">
                  <Inbox className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">{t('noEmails')}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmails.map(email => (
                    <div
                      key={email.id}
                      onClick={() => handleViewEmail(email)}
                      className={`group flex items-start gap-3 p-3 cursor-pointer transition-colors
                        ${selectedEmail?.id === email.id ? 'bg-indigo-50' : 'hover:bg-muted/50'}
                        ${!email.is_read ? 'bg-blue-50/50' : ''}`}
                    >
                      <button onClick={(e) => handleToggleStar(email, e)} className="pt-1">
                        <Star className={`w-4 h-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm truncate ${!email.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {email.from_name || email.from_email?.split('@')[0]}
                          </span>
                          {!email.is_read && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                        </div>
                        <p className={`text-sm truncate ${!email.is_read ? 'font-semibold' : ''}`}>{email.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(email.date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Email Detail */}
            {selectedEmail && (
              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b">
                  <Button variant="ghost" size="sm" className="lg:hidden mb-2" onClick={() => setSelectedEmail(null)}>
                    <ChevronLeft className="w-4 h-4 mr-1" />{t('back')}
                  </Button>
                  <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {(selectedEmail.from_name || selectedEmail.from_email)?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{selectedEmail.from_name}</p>
                      <p className="text-sm text-muted-foreground">&lt;{selectedEmail.from_email}&gt;</p>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.snippet }} />
                </ScrollArea>
                <div className="p-3 border-t flex gap-2">
                  <Button variant="outline" onClick={() => handleReply(selectedEmail, 'reply')}><Reply className="w-4 h-4 mr-2" />{t('reply')}</Button>
                  <Button variant="outline" onClick={() => handleReply(selectedEmail, 'replyAll')}><ReplyAll className="w-4 h-4 mr-2" />{t('replyAll')}</Button>
                  <Button variant="outline" onClick={() => handleReply(selectedEmail, 'forward')}><Forward className="w-4 h-4 mr-2" />{t('forward')}</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Compose Dialog - Gmail Style with Rich Editor */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="px-4 py-3 bg-slate-800 text-white rounded-t-lg flex-shrink-0">
            <DialogTitle className="text-base font-medium">
              {replyMode === 'reply' ? t('reply') : replyMode === 'forward' ? t('forward') : t('compose')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {/* To/CC/BCC Fields */}
            <div className="border-b px-4 py-2 flex items-center">
              <Label className="w-14 text-sm text-muted-foreground">{t('to')}</Label>
              <Input value={composeData.to} onChange={(e) => setComposeData({ ...composeData, to: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" placeholder="email@example.com" />
              <Button variant="ghost" size="sm" onClick={() => setShowCc(!showCc)} className="text-xs text-muted-foreground">CC/BCC</Button>
            </div>
            {showCc && (
              <>
                <div className="border-b px-4 py-2 flex items-center">
                  <Label className="w-14 text-sm text-muted-foreground">CC</Label>
                  <Input value={composeData.cc} onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" />
                </div>
                <div className="border-b px-4 py-2 flex items-center">
                  <Label className="w-14 text-sm text-muted-foreground">BCC</Label>
                  <Input value={composeData.bcc} onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" />
                </div>
              </>
            )}
            <div className="border-b px-4 py-2 flex items-center">
              <Label className="w-14 text-sm text-muted-foreground">{t('subject')}</Label>
              <Input value={composeData.subject} onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })} className="border-0 shadow-none focus-visible:ring-0" />
            </div>
            
            {/* Formatting Toolbar */}
            <div className="border-b px-2 py-1.5 flex flex-wrap items-center gap-0.5 bg-muted/30">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('bold')} title="Bold">
                <Bold className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('italic')} title="Italic">
                <Italic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('underline')} title="Underline">
                <Underline className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              
              {/* Text Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Text Color">
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
              
              {/* Font Size */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Type className="w-4 h-4 mr-1" />
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[1, 2, 3, 4, 5, 6, 7].map(size => (
                    <DropdownMenuItem key={size} onClick={() => execCommand('fontSize', size)}>
                      <span style={{ fontSize: `${10 + size * 2}px` }}>Size {size}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyLeft')} title="Align Left">
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyCenter')} title="Align Center">
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('justifyRight')} title="Align Right">
                <AlignRight className="w-4 h-4" />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                <List className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                const url = prompt('Link URL:');
                if (url) execCommand('createLink', url);
              }} title="Insert Link">
                <Link className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Rich Text Editor */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[250px] p-4 focus:outline-none prose prose-sm max-w-none"
              style={{ minHeight: '250px' }}
              suppressContentEditableWarning
            />
            
            {/* Signature Preview */}
            {signature && (
              <div className="px-4 pb-4 text-sm text-muted-foreground border-t pt-2" dangerouslySetInnerHTML={{ __html: signature }} />
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30 flex-shrink-0">
            <div className="flex gap-2">
              <Button onClick={handleSendEmail} disabled={sending} className="bg-indigo-600 hover:bg-indigo-700">
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {t('send')}
              </Button>
              <Button variant="ghost" size="icon"><Paperclip className="w-4 h-4" /></Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Settings Dialog */}
      <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>E-posta İmzası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              contentEditable
              className="min-h-[150px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              dangerouslySetInnerHTML={{ __html: signature }}
              onBlur={(e) => setSignature(e.currentTarget.innerHTML)}
            />
            <p className="text-xs text-muted-foreground">HTML desteklenir. Örn: &lt;strong&gt;Kalın&lt;/strong&gt;</p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsSignatureOpen(false)}>{t('cancel')}</Button>
            <Button onClick={saveSignature} className="bg-indigo-600 hover:bg-indigo-700">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailPage;
