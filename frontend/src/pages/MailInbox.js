import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Inbox, Send, FileText, RefreshCw, Search, Mail, 
  Reply, ReplyAll, Forward, Trash2, Archive, Star, StarOff,
  MoreVertical, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  Paperclip, X, Check, Clock, AlertTriangle, Pencil,
  MailOpen, Tag, Flag, Eye, EyeOff
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MailInbox = () => {
  const { t } = useLanguage();
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'split'
  const [replyMode, setReplyMode] = useState(null); // 'reply', 'replyAll', 'forward'

  const folders = [
    { id: 'inbox', icon: Inbox, label: t('inbox'), color: 'text-blue-600' },
    { id: 'starred', icon: Star, label: t('starred'), color: 'text-yellow-500' },
    { id: 'sent', icon: Send, label: t('sent'), color: 'text-green-600' },
    { id: 'drafts', icon: FileText, label: t('drafts'), color: 'text-gray-600' },
    { id: 'trash', icon: Trash2, label: t('trash'), color: 'text-red-600' },
  ];

  const fetchEmails = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await axios.get(`${API}/mail/inbox`);
      if (response.data.emails) {
        setEmails(response.data.emails.map(e => ({ 
          ...e, 
          folder: 'inbox',
          starred: false 
        })));
      }
      setConnectionStatus(response.data.status || 'connected');
    } catch (error) {
      console.error('Error fetching emails:', error);
      setConnectionStatus('error');
      if (error.response?.data?.detail) {
        toast.error(t('error'), { description: error.response.data.detail });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleRefresh = () => fetchEmails(true);

  const handleViewEmail = async (email) => {
    setSelectedEmail(email);
    
    if (!email.is_read) {
      try {
        await axios.post(`${API}/mail/mark-read/${email.id}`);
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleToggleStar = (email, e) => {
    e.stopPropagation();
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, starred: !e.starred } : e));
  };

  const handleToggleSelect = (emailId, e) => {
    e.stopPropagation();
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEmails.size === filteredEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredEmails.map(e => e.id)));
    }
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error(t('error'), { description: t('required') + ': ' + t('to') + ', ' + t('subject') });
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API}/mail/send`, {
        to: composeData.to,
        subject: composeData.subject,
        body: composeData.body,
        cc: composeData.cc,
        bcc: composeData.bcc
      });
      toast.success(t('success'), { description: t('emailSent') });
      setIsComposeOpen(false);
      setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
      setReplyMode(null);
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || t('somethingWentWrong') });
    } finally {
      setSending(false);
    }
  };

  const handleReply = (email, mode = 'reply') => {
    setReplyMode(mode);
    if (mode === 'forward') {
      setComposeData({
        to: '',
        cc: '',
        bcc: '',
        subject: `Fwd: ${email.subject}`,
        body: `\n\n---------- ${t('forward')} ----------\n${t('from')}: ${email.from_name} <${email.from_email}>\n${t('date')}: ${new Date(email.date).toLocaleString()}\n${t('subject')}: ${email.subject}\n\n${email.body || ''}`
      });
    } else {
      const replyTo = mode === 'replyAll' ? email.from_email : email.from_email;
      setComposeData({
        to: replyTo,
        cc: '',
        bcc: '',
        subject: `Re: ${email.subject}`,
        body: `\n\n${new Date().toLocaleString()} ${email.from_name} <${email.from_email}>:\n> ${(email.body || '').split('\n').join('\n> ')}`
      });
    }
    setIsComposeOpen(true);
  };

  const handleDelete = async (emailIds) => {
    // Move to trash (UI only for now)
    setEmails(prev => prev.map(e => 
      emailIds.includes(e.id) ? { ...e, folder: 'trash' } : e
    ));
    setSelectedEmails(new Set());
    if (selectedEmail && emailIds.includes(selectedEmail.id)) {
      setSelectedEmail(null);
    }
    toast.success(t('success'), { description: `${emailIds.length} ${t('items')} ${t('delete')}` });
  };

  const filteredEmails = emails.filter(email => {
    let matchesFolder = true;
    if (activeFolder === 'starred') {
      matchesFolder = email.starred;
    } else if (activeFolder !== 'all') {
      matchesFolder = email.folder === activeFolder;
    }
    
    const matchesSearch = !searchTerm || 
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });

  const unreadCount = emails.filter(e => e.folder === 'inbox' && !e.is_read).length;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday');
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col" data-testid="mail-inbox-page">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-['Manrope']">{t('mailInbox')}</h1>
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
        <Button onClick={() => { setReplyMode(null); setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' }); setIsComposeOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg">
          <Pencil className="w-4 h-4 mr-2" />
          {t('compose')}
        </Button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Sidebar - Folders */}
        <Card className="w-48 lg:w-56 flex-shrink-0 hidden md:block">
          <CardContent className="p-2">
            <nav className="space-y-1">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                    ${activeFolder === folder.id 
                      ? 'bg-indigo-100 text-indigo-700 font-medium' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
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

        {/* Mobile Folder Selector */}
        <div className="md:hidden flex gap-1 mb-2 overflow-x-auto pb-2">
          {folders.map(folder => (
            <Button
              key={folder.id}
              variant={activeFolder === folder.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFolder(folder.id)}
              className={activeFolder === folder.id ? 'bg-indigo-600' : ''}
            >
              <folder.icon className="w-4 h-4 mr-1" />
              {folder.label}
              {folder.id === 'inbox' && unreadCount > 0 && (
                <Badge className="ml-1 bg-white text-indigo-600 text-xs">{unreadCount}</Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <Card className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="p-3 border-b flex flex-wrap items-center gap-2">
            <Checkbox 
              checked={selectedEmails.size === filteredEmails.length && filteredEmails.length > 0}
              onCheckedChange={handleSelectAll}
              className="mr-2"
            />
            
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            {selectedEmails.size > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm" onClick={() => handleDelete(Array.from(selectedEmails))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Archive className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  {selectedEmails.size} {t('selectedItems')}
                </span>
              </>
            )}
            
            <div className="flex-1" />
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`${t('search')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Email List / Split View */}
          <div className="flex-1 flex min-h-0">
            {/* Email List */}
            <ScrollArea className={`${selectedEmail ? 'w-2/5 border-r hidden lg:block' : 'w-full'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : connectionStatus === 'error' ? (
                <div className="text-center py-20 px-4">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                  <p className="text-lg font-medium text-foreground mb-2">{t('connectionFailed')}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('settings')} → IMAP/SMTP {t('configureNow')}
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                    {t('configureNow')}
                  </Button>
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
                      <div className="flex items-center gap-2 pt-1">
                        <Checkbox 
                          checked={selectedEmails.has(email.id)}
                          onCheckedChange={(checked) => handleToggleSelect(email.id, { stopPropagation: () => {} })}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          onClick={(e) => handleToggleStar(email, e)}
                          className="text-muted-foreground hover:text-yellow-500"
                        >
                          {email.starred ? (
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <Star className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm truncate ${!email.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {email.from_name || email.from_email?.split('@')[0]}
                          </span>
                          {!email.is_read && (
                            <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className={`text-sm truncate ${!email.is_read ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                          {email.subject || `(${t('noResults')})`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {email.snippet || email.body?.substring(0, 80)}
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground whitespace-nowrap pt-1">
                        {formatDate(email.date)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Email Detail View */}
            {selectedEmail && (
              <div className="flex-1 flex flex-col min-w-0">
                {/* Email Header */}
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="lg:hidden mb-2"
                        onClick={() => setSelectedEmail(null)}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {t('back')}
                      </Button>
                      <h2 className="text-xl font-semibold truncate">{selectedEmail.subject}</h2>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleStar(selectedEmail, { stopPropagation: () => {} })}>
                        {selectedEmail.starred ? <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> : <Star className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete([selectedEmail.id])}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {(selectedEmail.from_name || selectedEmail.from_email)?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{selectedEmail.from_name}</p>
                      <p className="text-sm text-muted-foreground truncate">&lt;{selectedEmail.from_email}&gt;</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedEmail.date).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Email Body */}
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                    {selectedEmail.body || selectedEmail.snippet || t('noResults')}
                  </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="p-3 border-t flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleReply(selectedEmail, 'reply')}>
                    <Reply className="w-4 h-4 mr-2" />
                    {t('reply')}
                  </Button>
                  <Button variant="outline" onClick={() => handleReply(selectedEmail, 'replyAll')}>
                    <ReplyAll className="w-4 h-4 mr-2" />
                    {t('replyAll')}
                  </Button>
                  <Button variant="outline" onClick={() => handleReply(selectedEmail, 'forward')}>
                    <Forward className="w-4 h-4 mr-2" />
                    {t('forward')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Compose Dialog - Gmail Style */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="px-4 py-3 bg-slate-800 text-white rounded-t-lg">
            <DialogTitle className="text-base font-medium">
              {replyMode === 'reply' ? t('reply') : replyMode === 'replyAll' ? t('replyAll') : replyMode === 'forward' ? t('forward') : t('compose')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-0">
            {/* To Field */}
            <div className="flex items-center border-b px-4 py-2">
              <Label className="w-16 text-sm text-muted-foreground">{t('to')}</Label>
              <Input
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0 px-0"
                placeholder="email@example.com"
              />
              <Button variant="ghost" size="sm" onClick={() => setShowCc(!showCc)} className="text-xs text-muted-foreground">
                {t('cc')}/{t('bcc')}
              </Button>
            </div>
            
            {/* CC/BCC Fields */}
            {showCc && (
              <>
                <div className="flex items-center border-b px-4 py-2">
                  <Label className="w-16 text-sm text-muted-foreground">{t('cc')}</Label>
                  <Input
                    value={composeData.cc}
                    onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                    className="border-0 shadow-none focus-visible:ring-0 px-0"
                  />
                </div>
                <div className="flex items-center border-b px-4 py-2">
                  <Label className="w-16 text-sm text-muted-foreground">{t('bcc')}</Label>
                  <Input
                    value={composeData.bcc}
                    onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                    className="border-0 shadow-none focus-visible:ring-0 px-0"
                  />
                </div>
              </>
            )}
            
            {/* Subject */}
            <div className="flex items-center border-b px-4 py-2">
              <Label className="w-16 text-sm text-muted-foreground">{t('subject')}</Label>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                className="border-0 shadow-none focus-visible:ring-0 px-0"
              />
            </div>
            
            {/* Body */}
            <Textarea
              value={composeData.body}
              onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
              className="border-0 shadow-none focus-visible:ring-0 min-h-[300px] resize-none rounded-none px-4"
              placeholder={t('emailBody')}
            />
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <div className="flex gap-2">
              <Button 
                onClick={handleSendEmail} 
                disabled={sending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {t('send')}
              </Button>
              <Button variant="ghost" size="icon">
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailInbox;
