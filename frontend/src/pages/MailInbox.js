import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { 
  Inbox, Send, FileText, RefreshCw, Search, Mail, 
  Reply, Forward, Trash2, Eye, Star, StarOff,
  ChevronLeft, ChevronRight, Loader2, AlertCircle
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
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const folders = [
    { id: 'inbox', icon: Inbox, label: t('inbox'), count: emails.filter(e => e.folder === 'inbox' && !e.is_read).length },
    { id: 'sent', icon: Send, label: t('sent'), count: 0 },
    { id: 'drafts', icon: FileText, label: t('drafts'), count: 0 },
  ];

  const fetchEmails = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    
    try {
      const response = await axios.get(`${API}/mail/inbox`);
      if (response.data.emails) {
        setEmails(response.data.emails.map(e => ({ ...e, folder: 'inbox' })));
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

  const handleRefresh = () => {
    fetchEmails(true);
  };

  const handleViewEmail = async (email) => {
    setSelectedEmail(email);
    setIsViewOpen(true);
    
    // Mark as read
    if (!email.is_read) {
      try {
        await axios.post(`${API}/mail/mark-read/${email.id}`);
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }
  };

  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject) {
      toast.error(t('error'), { description: 'Lütfen alıcı ve konu girin' });
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API}/mail/send`, composeData);
      toast.success(t('success'), { description: t('emailSent') });
      setIsComposeOpen(false);
      setComposeData({ to: '', subject: '', body: '' });
    } catch (error) {
      toast.error(t('error'), { description: error.response?.data?.detail || 'Mail gönderilemedi' });
    } finally {
      setSending(false);
    }
  };

  const handleReply = (email) => {
    setComposeData({
      to: email.from_email,
      subject: `Re: ${email.subject}`,
      body: `\n\n---\n${t('from')}: ${email.from_email}\n${t('date')}: ${new Date(email.date).toLocaleString()}\n\n${email.body || ''}`
    });
    setIsViewOpen(false);
    setIsComposeOpen(true);
  };

  const handleForward = (email) => {
    setComposeData({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n---\n${t('from')}: ${email.from_email}\n${t('date')}: ${new Date(email.date).toLocaleString()}\n\n${email.body || ''}`
    });
    setIsViewOpen(false);
    setIsComposeOpen(true);
  };

  const filteredEmails = emails.filter(email => {
    const matchesFolder = email.folder === activeFolder;
    const matchesSearch = !searchTerm || 
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('yesterday');
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-4 md:space-y-6" data-testid="mail-inbox-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight font-['Manrope']">{t('mailInbox')}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {connectionStatus === 'connected' ? (
              <span className="text-green-600">● {t('connectionSuccess')}</span>
            ) : connectionStatus === 'error' ? (
              <span className="text-red-600">● {t('connectionFailed')}</span>
            ) : (
              <span className="text-yellow-600">● {t('loading')}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          <Button onClick={() => setIsComposeOpen(true)} className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700">
            <Mail className="w-4 h-4 mr-2" />
            {t('compose')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Folders Sidebar */}
        <Card className="lg:w-64 flex-shrink-0">
          <CardContent className="p-2 md:p-4">
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap
                    ${activeFolder === folder.id 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'hover:bg-muted text-muted-foreground'}`}
                >
                  <folder.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{folder.label}</span>
                  {folder.count > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-indigo-600 text-white">
                      {folder.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Email List */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`${t('search')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : connectionStatus === 'error' ? (
              <div className="text-center py-12 px-4">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="text-muted-foreground">{t('connectionFailed')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Lütfen Ayarlar sayfasından IMAP/SMTP ayarlarınızı kontrol edin
                </p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{t('noEmails')}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredEmails.map(email => (
                  <div
                    key={email.id}
                    onClick={() => handleViewEmail(email)}
                    className={`p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-colors
                      ${!email.is_read ? 'bg-indigo-50/50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!email.is_read && (
                            <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                          )}
                          <span className={`font-medium truncate ${!email.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {email.from_name || email.from_email}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {formatDate(email.date)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${!email.is_read ? 'font-medium' : ''}`}>
                          {email.subject || '(No Subject)'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {email.snippet || email.body?.substring(0, 100)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Email Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedEmail?.subject || '(No Subject)'}</DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm border-b pb-4">
                <div>
                  <p><strong>{t('from')}:</strong> {selectedEmail.from_name} &lt;{selectedEmail.from_email}&gt;</p>
                  <p><strong>{t('date')}:</strong> {new Date(selectedEmail.date).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="prose prose-sm max-w-none min-h-[200px] whitespace-pre-wrap">
                {selectedEmail.body || selectedEmail.snippet || 'No content'}
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handleReply(selectedEmail)}>
                  <Reply className="w-4 h-4 mr-2" />
                  {t('reply')}
                </Button>
                <Button variant="outline" onClick={() => handleForward(selectedEmail)}>
                  <Forward className="w-4 h-4 mr-2" />
                  {t('forward')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compose Email Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('compose')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Input
                placeholder={t('to')}
                value={composeData.to}
                onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
              />
            </div>
            <div>
              <Input
                placeholder={t('subject')}
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
            <div>
              <Textarea
                placeholder={t('emailBody')}
                value={composeData.body}
                onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                rows={10}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {t('send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailInbox;
