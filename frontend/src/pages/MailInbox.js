import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Inbox, Send, FileText, RefreshCw, Search, Menu,
  Reply, Forward, Trash2, Archive, Star,
  Loader2, AlertCircle, ChevronLeft, X, ChevronRight,
  Paperclip, Clock, Pencil,
  Bold, Italic, Underline, List,
  Palette, Settings, Image as ImageIcon,
  MailOpen, Minimize2, Maximize2, File, Download,
  Sparkles, Wand2, Languages, PenLine, Zap, Brain,
  FileImage, FileVideo, FileArchive, FileType, Upload,
  ChevronDown, MoreVertical, FolderPlus, Folder, 
  ShieldAlert, Users, Heart, AlertTriangle, CheckCircle2
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#ffffff',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return FileImage;
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) return FileVideo;
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return FileArchive;
  if (ext === 'pdf') return FileType;
  return File;
};

const MailPage = () => {
  const { t, language } = useLanguage();
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const signatureImageRef = useRef(null);
  
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const [emailsPerPage] = useState(20);
  
  // Custom folders
  const [customFolders, setCustomFolders] = useState([]);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Email Settings States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    sender_name: '',
    sender_email: '',
    imap_host: '',
    imap_port: '993',
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  
  // AI States
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedBody, setTranslatedBody] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  
  // AI Analysis States
  const [spamAnalysis, setSpamAnalysis] = useState(null);
  const [customerMatch, setCustomerMatch] = useState(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
  const [analyzingSpam, setAnalyzingSpam] = useState(false);
  const [analyzingCustomer, setAnalyzingCustomer] = useState(false);
  const [analyzingSentiment, setAnalyzingSentiment] = useState(false);
  
  // AI Compose States
  const [showAiCompose, setShowAiCompose] = useState(false);
  const [aiComposePrompt, setAiComposePrompt] = useState('');
  const [aiComposing, setAiComposing] = useState(false);
  const [aiTone, setAiTone] = useState('professional');
  const [aiComposeLanguage, setAiComposeLanguage] = useState(language); // Local state for AI compose language

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
        const response = await axios.get(`${API}/mail/inbox?page=${currentPage}&limit=${emailsPerPage}`);
        if (!isMounted) return;
        
        if (response.data && response.data.emails) {
          const fetchedEmails = response.data.emails.map((e) => ({ 
            ...e, 
            starred: false,
            attachments: e.attachments || [],
          }));
          setEmails(fetchedEmails);
          setTotalPages(response.data.pages || 1);
          setTotalEmails(response.data.total || 0);
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Mail fetch error:', error);
        setConnectionStatus('error');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    const loadSentEmails = async () => {
      try {
        const response = await axios.get(`${API}/mail/sent`);
        if (response.data?.emails) setSentEmails(response.data.emails);
      } catch (e) {}
    };
    
    const loadDrafts = async () => {
      try {
        const response = await axios.get(`${API}/mail/drafts`);
        if (response.data?.drafts) setDraftEmails(response.data.drafts);
      } catch (e) {}
    };
    
    const loadFolders = async () => {
      try {
        const response = await axios.get(`${API}/mail/folders`);
        if (response.data?.custom_folders) setCustomFolders(response.data.custom_folders);
      } catch (e) {}
    };

    loadEmails();
    loadSentEmails();
    loadDrafts();
    loadFolders();
    loadEmailSettings();
    
    axios.get(`${API}/settings/signature`).then(res => {
      if (isMounted && res.data?.signature) setSignature(res.data.signature);
    }).catch(() => {
      if (isMounted) setSignature(`<br><br>--<br><b>Gewürzberg GmbH</b><br>Premium Gewürze & Binderlösungen`);
    });
    
    return () => { isMounted = false; };
  }, [currentPage, emailsPerPage]);

  const loadEmailSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/email`);
      if (response.data) {
        setEmailSettings(prev => ({
          ...prev,
          ...response.data
        }));
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
    }
  };

  const saveEmailSettings = async () => {
    setSavingSettings(true);
    try {
      await axios.post(`${API}/settings/email`, emailSettings);
      toast.success(t('settingsSaved'));
      setIsSettingsOpen(false);
      handleRefresh();
    } catch (error) {
      toast.error(t('settingsNotSaved'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`${API}/mail/inbox?page=${currentPage}&limit=${emailsPerPage}`);
      if (response.data && response.data.emails) {
        setEmails(response.data.emails.map((e) => ({ 
          ...e, 
          starred: emails.find(em => em.id === e.id)?.starred || false,
          attachments: e.attachments || [],
        })));
        setTotalPages(response.data.pages || 1);
        setTotalEmails(response.data.total || 0);
        setConnectionStatus('connected');
        toast.success(t('mailsUpdated'));
      }
    } catch (error) {
      toast.error(t('couldNotLoadMails'));
    } finally {
      setRefreshing(false);
    }
  };

  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const saveSignature = async () => {
    try {
      await axios.post(`${API}/settings/signature`, { signature });
      toast.success(t('signatureSaved'));
      setIsSignatureOpen(false);
    } catch (error) {
      toast.error(t('signatureNotSaved'));
    }
  };

  const handleSignatureImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgHtml = `<img src="${event.target.result}" style="max-width:200px;height:auto;margin:8px 0;" />`;
        setSignature(prev => prev + imgHtml);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Create custom folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await axios.post(`${API}/mail/folders`, { name: newFolderName });
      if (response.data?.folder) {
        setCustomFolders(prev => [...prev, response.data.folder]);
        toast.success(t('folderCreated') || 'Folder created');
      }
      setNewFolderName('');
      setIsAddFolderOpen(false);
    } catch (error) {
      toast.error(t('error'));
    }
  };
  
  // Delete custom folder
  const handleDeleteFolder = async (folderId) => {
    try {
      await axios.delete(`${API}/mail/folders/${folderId}`);
      setCustomFolders(prev => prev.filter(f => f.id !== folderId));
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleViewEmail = async (email) => {
    setSelectedEmail(email);
    setAiSummary('');
    setSmartReplies([]);
    setShowAiPanel(false);
    setTranslatedBody('');
    setShowTranslation(false);
    setSpamAnalysis(null);
    setCustomerMatch(null);
    setSentimentAnalysis(null);
    
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
        from: selectedEmail.from_name || selectedEmail.from_email,
        language: language // Pass current UI language
      });
      setAiSummary(response.data.summary || t('couldNotGenerate'));
      setSmartReplies(response.data.replies || []);
    } catch (error) {
      setAiSummary(t('aiServiceUnavailable') || 'AI service unavailable');
      setSmartReplies([]);
    } finally {
      setAiLoading(false);
    }
  };

  // AI: Translate Email - now supports 6 languages
  const handleTranslate = async (targetLang = 'tr') => {
    if (!selectedEmail?.body) return;
    setTranslating(true);
    try {
      const response = await axios.post(`${API}/ai/translate-email`, {
        body: selectedEmail.body,
        target_lang: targetLang
      });
      setTranslatedBody(response.data.translated || '');
      setShowTranslation(true);
    } catch (error) {
      toast.error(t('translationFailed'));
    } finally {
      setTranslating(false);
    }
  };
  
  // AI: Spam Analysis
  const handleSpamAnalysis = async () => {
    if (!selectedEmail) return;
    setAnalyzingSpam(true);
    try {
      const response = await axios.post(`${API}/ai/analyze-spam`, {
        subject: selectedEmail.subject,
        body: selectedEmail.body,
        from_email: selectedEmail.from_email
      });
      setSpamAnalysis(response.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setAnalyzingSpam(false);
    }
  };
  
  // AI: Customer Recognition
  const handleCustomerRecognition = async () => {
    if (!selectedEmail) return;
    setAnalyzingCustomer(true);
    try {
      const response = await axios.post(`${API}/ai/recognize-customer`, {
        from_email: selectedEmail.from_email,
        from_name: selectedEmail.from_name,
        body: selectedEmail.body
      });
      setCustomerMatch(response.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setAnalyzingCustomer(false);
    }
  };
  
  // AI: Sentiment Analysis
  const handleSentimentAnalysis = async () => {
    if (!selectedEmail) return;
    setAnalyzingSentiment(true);
    try {
      const response = await axios.post(`${API}/ai/analyze-sentiment`, {
        subject: selectedEmail.subject,
        body: selectedEmail.body
      });
      setSentimentAnalysis(response.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setAnalyzingSentiment(false);
    }
  };

  // AI: Compose Email
  const handleAiCompose = async () => {
    if (!aiComposePrompt.trim()) {
      toast.error(t('specifyRequest'));
      return;
    }
    setAiComposing(true);
    try {
      const response = await axios.post(`${API}/ai/compose-email`, {
        prompt: aiComposePrompt,
        tone: aiTone,
        context: composeData.subject ? `Subject: ${composeData.subject}` : '',
        language: aiComposeLanguage // Use the local AI compose language state
      });
      if (response.data.email) {
        if (editorRef.current) {
          editorRef.current.innerHTML = response.data.email.replace(/\n/g, '<br>');
        }
        setShowAiCompose(false);
        setAiComposePrompt('');
        toast.success(t('emailGenerated'));
      }
    } catch (error) {
      toast.error(t('couldNotGenerate'));
    } finally {
      setAiComposing(false);
    }
  };

  // AI: Improve Text
  const handleImproveText = async (action) => {
    const text = editorRef.current?.innerText || '';
    if (!text.trim()) {
      toast.error(t('writeTextFirst'));
      return;
    }
    try {
      const response = await axios.post(`${API}/ai/improve-text`, { text, action });
      if (response.data.improved && editorRef.current) {
        editorRef.current.innerHTML = response.data.improved.replace(/\n/g, '<br>');
        toast.success(t('textImproved'));
      }
    } catch (error) {
      toast.error(t('couldNotImprove'));
    }
  };

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
    toast.success(t('movedToTrash'));
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
      toast.success(`${files.length} ${t('filesAdded')}`);
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
      toast.error(t('recipientSubjectRequired'));
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
      
      toast.success(t('mailSent'));
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
        toast.error(t('mailServerUnavailable'), { duration: 6000 });
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
          <p style="margin:0"><b>${t('from')}:</b> ${email.from_name} &lt;${email.from_email}&gt;</p>
          <p style="margin:0"><b>${t('date')}:</b> ${new Date(email.date).toLocaleString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'tr-TR')}</p>
          <p style="margin:0"><b>${t('subject')}:</b> ${email.subject}</p>
          <br>${email.body || ''}
        </div>`
      : `<br><br><div style="border-left: 3px solid #6366f1; padding-left: 12px; color: #666;">
          <p style="margin:0">${new Date(email.date).toLocaleString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'tr-TR')} - ${email.from_name} &lt;${email.from_email}&gt;:</p>
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
    const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'tr-TR';
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-gradient-to-br from-red-500 to-pink-500', 'bg-gradient-to-br from-blue-500 to-cyan-500', 'bg-gradient-to-br from-green-500 to-emerald-500', 'bg-gradient-to-br from-yellow-500 to-orange-500', 'bg-gradient-to-br from-purple-500 to-violet-500', 'bg-gradient-to-br from-pink-500 to-rose-500', 'bg-gradient-to-br from-indigo-500 to-blue-500', 'bg-gradient-to-br from-teal-500 to-cyan-500'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  // Sidebar
  const Sidebar = ({ isMobile = false }) => (
    <div className={`${isMobile ? 'w-full' : 'w-72'} bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 h-full flex flex-col`}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MailOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gewürzberg Mail</h2>
            <p className="text-xs text-slate-400">{t('mailCenter')}</p>
          </div>
        </div>
        <Button 
          onClick={openCompose}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
        >
          <Pencil className="w-4 h-4 mr-2" />
          {t('newMail')}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {[
          { id: 'inbox', icon: Inbox, label: t('inbox'), count: inboxCount, countColor: 'bg-red-500' },
          { id: 'starred', icon: Star, label: t('starred'), count: starredCount },
          { id: 'sent', icon: Send, label: t('sent'), count: sentCount },
          { id: 'drafts', icon: FileText, label: t('drafts'), count: draftCount, countColor: 'bg-amber-500' },
          { id: 'trash', icon: Trash2, label: t('trash') },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); if (isMobile) setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
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
        
        {/* Custom Folders */}
        {customFolders.length > 0 && (
          <>
            <Separator className="bg-slate-700/50 my-3" />
            <p className="px-4 text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{t('customFolders')}</p>
            {customFolders.map(folder => (
              <div key={folder.id} className="flex items-center group">
                <button
                  onClick={() => { setActiveTab(folder.id); if (isMobile) setIsSidebarOpen(false); }}
                  className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-slate-300 hover:bg-white/5 hover:text-white`}
                >
                  <Folder className="w-4 h-4" style={{ color: folder.color }} />
                  <span className="flex-1 text-left text-sm">{folder.name}</span>
                </button>
                <button 
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </>
        )}
        
        {/* Add Folder Button */}
        <button 
          onClick={() => setIsAddFolderOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all mt-2"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="text-sm">{t('addFolder')}</span>
        </button>
      </nav>

      <Separator className="bg-slate-700/50 mx-4" />
      
      <div className="p-3 space-y-1">
        <button 
          onClick={() => setIsSignatureOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all"
        >
          <Pencil className="w-4 h-4" />
          <span className="font-medium text-sm">{t('signatureSettings')}</span>
        </button>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all"
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium text-sm">{t('emailSettings')}</span>
        </button>
      </div>
    </div>
  );

  // Email List Item
  const EmailListItem = ({ email, isSent = false }) => {
    const hasAttachments = email.attachments?.length > 0 || email.attachmentCount > 0 || email.has_attachments;
    
    return (
      <div
        onClick={() => handleViewEmail(email)}
        data-testid={`email-item-${email.id}`}
        className={`group flex items-center gap-4 px-5 py-4 cursor-pointer border-b border-slate-700/30 transition-all
          ${selectedEmail?.id === email.id ? 'bg-indigo-900/40 border-l-4 border-l-indigo-500' : 'hover:bg-slate-800/50 border-l-4 border-l-transparent'}
          ${!email.is_read && !isSent ? 'bg-slate-800/30' : ''}`}
      >
        <div className={`w-11 h-11 rounded-full ${getAvatarColor(email.from_name || email.to)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg`}>
          {(isSent ? email.to : (email.from_name || email.from_email))?.[0]?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-sm truncate ${!email.is_read && !isSent ? 'font-bold text-white' : 'font-medium text-slate-200'}`}>
              {isSent ? `${t('to')}: ${email.to}` : (email.from_name || email.from_email?.split('@')[0])}
            </span>
            {hasAttachments && <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
          </div>
          <p className={`text-sm truncate ${!email.is_read && !isSent ? 'text-white font-medium' : 'text-slate-300'}`}>
            {email.subject || t('noSubject')}
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

  return (
    <div className="h-[calc(100vh-80px)] flex bg-slate-950 rounded-2xl overflow-hidden shadow-2xl" data-testid="mail-page">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block border-r border-slate-800/50">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80 bg-slate-900 border-slate-800">
          <Sidebar isMobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-900 to-slate-950">
        {/* Top Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
          <Button variant="ghost" size="icon" className="lg:hidden text-slate-300 hover:bg-slate-800" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder={`${t('search')} ${t('mail')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 py-5 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing} className="text-slate-300 hover:bg-slate-800 rounded-xl">
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tab Title & Pagination */}
        <div className="px-5 py-3 border-b border-slate-800/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">
              {activeTab === 'inbox' && t('inbox')}
              {activeTab === 'sent' && t('sent')}
              {activeTab === 'drafts' && t('drafts')}
              {activeTab === 'starred' && t('starred')}
              {activeTab === 'trash' && t('trash')}
            </h3>
            <Badge variant="outline" className="text-slate-400 border-slate-700">{totalEmails} {t('mail')}</Badge>
          </div>
          
          {/* Pagination Controls */}
          {activeTab === 'inbox' && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="text-slate-300 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('previous')}
              </Button>
              <span className="text-sm text-slate-400">
                {t('page')} {currentPage} / {totalPages}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="text-slate-300 hover:bg-slate-800"
              >
                {t('next')}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Email List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-400">{t('loadingMails')}</p>
            </div>
          ) : connectionStatus === 'error' ? (
            <div className="text-center py-20 px-4">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-bold text-white mb-2">{t('connectionError')}</p>
              <p className="text-sm text-slate-400">{t('configureImap')}</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-20">
              <MailOpen className="w-20 h-20 mx-auto mb-4 text-slate-700" />
              <p className="text-slate-400 font-medium">
                {activeTab === 'inbox' && t('inboxEmpty')}
                {activeTab === 'sent' && t('noSentMails')}
                {activeTab === 'drafts' && t('noDrafts')}
                {activeTab === 'starred' && t('noStarred')}
                {activeTab === 'trash' && t('trashEmpty')}
              </p>
            </div>
          ) : (
            <div>
              {filteredEmails.map(email => (
                <EmailListItem key={email.id} email={email} isSent={activeTab === 'sent'} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Mobile Compose Button */}
        <button
          onClick={openCompose}
          className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-2xl"
        >
          <Pencil className="w-6 h-6 mx-auto" />
        </button>
      </div>

      {/* Email Detail View */}
      {selectedEmail && (
        <div className={`fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden ${isEmailFullscreen ? '' : 'lg:relative lg:w-[600px] lg:min-w-[500px]'}`}>
          {/* Header */}
          <div className="flex items-center gap-2 p-3 md:p-4 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-sm flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedEmail(null); setIsEmailFullscreen(false); setShowAiPanel(false); }} className="text-white hover:bg-slate-700 rounded-xl">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1" />
            
            {/* AI Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-purple-400 hover:bg-purple-500/20 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 w-56">
                <DropdownMenuItem onClick={handleAiSummarize} className="text-white hover:bg-slate-700">
                  <Brain className="w-4 h-4 mr-2 text-purple-400" /> {t('aiSummaryAndReply')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onClick={() => handleTranslate('tr')} className="text-white hover:bg-slate-700">
                  <span className="mr-2">🇹🇷</span> Türkçe'ye Çevir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTranslate('en')} className="text-white hover:bg-slate-700">
                  <span className="mr-2">🇬🇧</span> Translate to English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTranslate('de')} className="text-white hover:bg-slate-700">
                  <span className="mr-2">🇩🇪</span> Auf Deutsch übersetzen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTranslate('pl')} className="text-white hover:bg-slate-700">
                  <span className="mr-2">🇵🇱</span> Przetłumacz na polski
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTranslate('el')} className="text-white hover:bg-slate-700">
                  <span className="mr-2">🇬🇷</span> Μετάφραση στα ελληνικά
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTranslate('bg')} className="text-white hover:bg-slate-700">
                  <span className="mr-2">🇧🇬</span> Превод на български
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem onClick={handleSpamAnalysis} className="text-white hover:bg-slate-700">
                  <ShieldAlert className="w-4 h-4 mr-2 text-red-400" /> {t('spamAnalysis')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCustomerRecognition} className="text-white hover:bg-slate-700">
                  <Users className="w-4 h-4 mr-2 text-green-400" /> {t('customerRecognition')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSentimentAnalysis} className="text-white hover:bg-slate-700">
                  <Heart className="w-4 h-4 mr-2 text-pink-400" /> {t('sentimentAnalysis')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" onClick={() => setIsEmailFullscreen(!isEmailFullscreen)} className="text-white hover:bg-slate-700 rounded-xl">
              {isEmailFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleMoveToTrash(selectedEmail)} className="text-white hover:bg-red-500/20 hover:text-red-400 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleToggleStar(selectedEmail)} className="text-white hover:bg-slate-700 rounded-xl">
              <Star className={`w-5 h-5 ${selectedEmail.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
          </div>

          {/* Subject */}
          <div className="px-5 py-4 border-b border-slate-700/50">
            <h2 className="text-xl font-bold text-white">{selectedEmail.subject || t('noSubject')}</h2>
          </div>

          {/* Sender */}
          <div className="flex items-start gap-4 p-5 border-b border-slate-700/50">
            <div className={`w-14 h-14 rounded-2xl ${getAvatarColor(selectedEmail.from_name)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
              {(selectedEmail.from_name || selectedEmail.from_email)?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <span className="font-bold text-white text-lg">{selectedEmail.from_name || 'Unknown'}</span>
              <p className="text-sm text-slate-400">&lt;{selectedEmail.from_email}&gt;</p>
              <p className="text-xs text-slate-500 mt-1"><Clock className="w-3 h-3 inline mr-1" />{new Date(selectedEmail.date).toLocaleString(language === 'de' ? 'de-DE' : language === 'en' ? 'en-US' : 'tr-TR')}</p>
            </div>
          </div>

          {/* AI Panel */}
          {showAiPanel && (
            <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-purple-300">{t('aiAssistant')}</span>
                <button onClick={() => setShowAiPanel(false)} className="ml-auto text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-2 text-purple-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('analyzing')}</span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 mb-4">{aiSummary}</p>
                  {smartReplies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-purple-400 font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {t('quickReplies')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {smartReplies.map((reply, i) => (
                          <button key={i} onClick={() => handleSmartReply(reply)} className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-sm rounded-lg transition-all">
                            {reply.length > 50 ? reply.substring(0, 50) + '...' : reply}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Translation Panel */}
          {showTranslation && translatedBody && (
            <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Languages className="w-5 h-5 text-blue-400" />
                <span className="font-semibold text-blue-300">{t('translation')}</span>
                <button onClick={() => setShowTranslation(false)} className="ml-auto text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {translating ? (
                <div className="flex items-center gap-2 text-blue-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('translating')}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{translatedBody}</p>
              )}
            </div>
          )}
          
          {/* AI Analysis Results */}
          {(spamAnalysis || customerMatch || sentimentAnalysis) && (
            <div className="mx-4 mt-4 flex flex-wrap gap-2">
              {spamAnalysis && (
                <div className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${spamAnalysis.is_spam ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
                  <ShieldAlert className="w-4 h-4" />
                  {spamAnalysis.is_spam ? t('possibleSpam') : t('notSpam')} ({spamAnalysis.confidence}%)
                </div>
              )}
              {customerMatch && (
                <div className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${customerMatch.found ? 'bg-green-900/40 text-green-300' : 'bg-slate-800 text-slate-400'}`}>
                  <Users className="w-4 h-4" />
                  {customerMatch.found ? `${t('customerFound')}: ${customerMatch.customer?.company_name}` : t('customerNotFound')}
                </div>
              )}
              {sentimentAnalysis && (
                <div className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  sentimentAnalysis.sentiment === 'positive' ? 'bg-green-900/40 text-green-300' : 
                  sentimentAnalysis.sentiment === 'negative' ? 'bg-red-900/40 text-red-300' : 
                  'bg-slate-800 text-slate-400'
                }`}>
                  <Heart className="w-4 h-4" />
                  {sentimentAnalysis.sentiment === 'positive' ? t('positive') : sentimentAnalysis.sentiment === 'negative' ? t('negative') : t('neutral')}
                  {sentimentAnalysis.urgency === 'high' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {selectedEmail.attachments?.length > 0 && (
            <div className="px-5 py-3 border-b border-slate-700/50">
              <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> {selectedEmail.attachments.length} {t('attachments')}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedEmail.attachments.map((att, index) => {
                  const FileIcon = getFileIcon(att.name || att.filename);
                  return (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm hover:bg-slate-700/50 cursor-pointer transition-all">
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

          {/* Body - Scrollable Container */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="bg-white min-h-full rounded-t-2xl mt-2 mx-2 mb-2">
              {loadingBody ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="ml-2 text-slate-600">{t('loading')}</span>
                </div>
              ) : selectedEmail.body ? (
                <iframe
                  srcDoc={`<!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body { 
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          line-height: 1.7;
                          color: #1f2937;
                          padding: 16px;
                          margin: 0;
                          background: white;
                          font-size: 15px;
                        }
                        @media (max-width: 640px) {
                          body { font-size: 14px; padding: 12px; }
                        }
                        img { max-width: 100%; height: auto; border-radius: 8px; }
                        a { color: #4f46e5; }
                        table { max-width: 100%; }
                        pre, code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
                        p { margin: 0 0 1em 0; }
                      </style>
                    </head>
                    <body>${selectedEmail.body}</body>
                    </html>`}
                  className="w-full border-0"
                  style={{ minHeight: '300px', height: isEmailFullscreen ? 'calc(100vh - 380px)' : 'calc(100vh - 500px)' }}
                  sandbox="allow-same-origin"
                  title="Email Content"
                />
              ) : (
                <div className="p-5 text-slate-500">{selectedEmail.snippet || t('noContent')}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 md:p-4 border-t border-slate-700/50 bg-slate-800/80 flex gap-3 flex-shrink-0">
            <Button onClick={() => handleReply(selectedEmail, 'reply')} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl py-4 md:py-5 text-sm md:text-base">
              <Reply className="w-4 h-4 mr-2" />{t('reply')}
            </Button>
            <Button onClick={() => handleReply(selectedEmail, 'forward')} variant="outline" className="flex-1 border-slate-600 text-white hover:bg-slate-700 rounded-xl py-4 md:py-5 text-sm md:text-base">
              <Forward className="w-4 h-4 mr-2" />{t('forward')}
            </Button>
          </div>
        </div>
      )}

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={(open) => { setIsComposeOpen(open); if (!open) setIsComposeFullscreen(false); }}>
        <DialogContent className={`p-0 gap-0 bg-white border-0 flex flex-col shadow-2xl ${isComposeFullscreen ? 'max-w-[100vw] w-[100vw] h-[100vh] max-h-[100vh] rounded-none' : 'max-w-2xl max-h-[85vh] rounded-2xl'}`}>
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
            <span className="text-sm font-bold text-white">
              {replyMode === 'reply' ? t('replyMessage') : replyMode === 'forward' ? t('forwardMessage') : t('newMessage')}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsComposeFullscreen(!isComposeFullscreen)} className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-lg">
                {isComposeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)} className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-lg">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center border-b border-slate-200 px-5 py-3">
              <span className="w-16 text-sm text-slate-500 font-medium">{t('to')}</span>
              <Input value={composeData.to} onChange={(e) => setComposeData({ ...composeData, to: e.target.value })} className="border-0 shadow-none focus-visible:ring-0 text-slate-800" placeholder="recipient@example.com" />
              <Button variant="ghost" size="sm" onClick={() => setShowCc(!showCc)} className="text-xs text-indigo-600">Cc/Bcc</Button>
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
              <span className="w-16 text-sm text-slate-500 font-medium">{t('subject')}</span>
              <Input value={composeData.subject} onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })} className="border-0 shadow-none focus-visible:ring-0 text-slate-800 font-medium" placeholder={t('subject')} />
            </div>
            
            <div ref={editorRef} contentEditable className="min-h-[200px] p-5 focus:outline-none text-slate-800" style={{ minHeight: '200px' }} suppressContentEditableWarning />
            
            {signature && <div className="px-5 pb-3 text-sm text-slate-500" dangerouslySetInnerHTML={{ __html: signature }} />}
          </div>
          
          {/* Toolbar */}
          <div className="border-t border-slate-200 px-3 py-2 flex items-center gap-1 bg-slate-50 flex-wrap">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('bold')}><Bold className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('italic')}><Italic className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('underline')}><Underline className="w-4 h-4" /></Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200"><Palette className="w-4 h-4" /></Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 rounded-xl">
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map(color => (
                    <button key={color} className="w-7 h-7 rounded-lg border-2 border-transparent hover:border-slate-300 hover:scale-110 transition-all" style={{ backgroundColor: color }} onClick={() => execCommand('foreColor', color)} />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => execCommand('insertUnorderedList')}><List className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}><Paperclip className="w-4 h-4" /></Button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleAttachmentSelect} />
            
            <Separator orientation="vertical" className="h-5 mx-1" />
            
            {/* AI Writing Tools */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg hover:bg-purple-100 text-purple-600">
                  <Wand2 className="w-4 h-4 mr-1" /> {t('aiHelper')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-slate-200">
                <DropdownMenuItem onClick={() => setShowAiCompose(true)} className="text-slate-800">
                  <PenLine className="w-4 h-4 mr-2 text-purple-500" /> {t('writeWithAi')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleImproveText('improve')} className="text-slate-800">
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-500" /> {t('improve')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveText('shorten')} className="text-slate-800">
                  <ChevronDown className="w-4 h-4 mr-2 text-green-500" /> {t('shorten')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveText('expand')} className="text-slate-800">
                  <MoreVertical className="w-4 h-4 mr-2 text-blue-500" /> {t('expand')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImproveText('formal')} className="text-slate-800">
                  <FileText className="w-4 h-4 mr-2 text-amber-500" /> {t('formalize')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 flex flex-wrap gap-2 bg-slate-50">
              {attachments.map((att, index) => {
                const FileIcon = getFileIcon(att.name);
                return (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm shadow-sm">
                    <FileIcon className="w-4 h-4 text-indigo-500" />
                    <span className="max-w-[150px] truncate text-slate-700">{att.name}</span>
                    <span className="text-xs text-slate-400">({formatFileSize(att.size)})</span>
                    <button onClick={() => removeAttachment(index)} className="ml-1 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <Button onClick={handleSendEmail} disabled={sending} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 rounded-xl shadow-lg">
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {t('send')}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsComposeOpen(false)} className="rounded-lg hover:bg-slate-200">
              <Trash2 className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Compose Dialog */}
      <Dialog open={showAiCompose} onOpenChange={setShowAiCompose}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              {t('writeWithAi')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t('whatToWrite')}</label>
              <Textarea 
                value={aiComposePrompt}
                onChange={(e) => setAiComposePrompt(e.target.value)}
                placeholder={t('aiWriteHint')}
                className="min-h-[100px]"
              />
            </div>
            
            {/* Language Selection */}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Dil / Language</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'tr', label: '🇹🇷 Türkçe' },
                  { code: 'en', label: '🇬🇧 English' },
                  { code: 'de', label: '🇩🇪 Deutsch' },
                  { code: 'pl', label: '🇵🇱 Polski' },
                  { code: 'el', label: '🇬🇷 Ελληνικά' },
                  { code: 'bg', label: '🇧🇬 Български' },
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setAiComposeLanguage(lang.code)}
                    data-testid={`ai-compose-lang-${lang.code}`}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      aiComposeLanguage === lang.code 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">Email, seçili dile göre yazılacaktır</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t('tone')}</label>
              <div className="flex gap-2">
                {[
                  { id: 'professional', label: t('professional') },
                  { id: 'friendly', label: t('friendly') },
                  { id: 'formal', label: t('formal') },
                ].map(tone => (
                  <button
                    key={tone.id}
                    onClick={() => setAiTone(tone.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      aiTone === tone.id 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowAiCompose(false)}>{t('cancel')}</Button>
            <Button onClick={handleAiCompose} disabled={aiComposing} className="bg-gradient-to-r from-indigo-600 to-purple-600">
              {aiComposing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {t('generate')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Settings */}
      <Dialog open={isSignatureOpen} onOpenChange={setIsSignatureOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('emailSignature')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              contentEditable
              className="min-h-[150px] p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              dangerouslySetInnerHTML={{ __html: signature }}
              onBlur={(e) => setSignature(e.currentTarget.innerHTML)}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => signatureImageRef.current?.click()} className="gap-2">
                <ImageIcon className="w-4 h-4" />
                {t('addImage')}
              </Button>
              <input ref={signatureImageRef} type="file" accept="image/*" className="hidden" onChange={handleSignatureImageUpload} />
              <span className="text-xs text-slate-500">{t('imageHint')}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsSignatureOpen(false)}>{t('cancel')}</Button>
            <Button onClick={saveSignature} className="bg-gradient-to-r from-indigo-600 to-purple-600">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              {t('emailSettings')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {/* Sender Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MailOpen className="w-4 h-4 text-indigo-500" />
                {t('senderInfo')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('senderName')}</label>
                  <Input
                    value={emailSettings.sender_name}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, sender_name: e.target.value }))}
                    placeholder="Gewürzberg GmbH"
                    className="border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('senderEmail')}</label>
                  <Input
                    value={emailSettings.sender_email}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, sender_email: e.target.value }))}
                    placeholder="info@gewuerzberg.de"
                    className="border-slate-200"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* IMAP Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-green-500" />
                {t('imapSettings')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('imapServer')}</label>
                  <Input
                    value={emailSettings.imap_host}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, imap_host: e.target.value }))}
                    placeholder="imap.ionos.de"
                    className="border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('imapPort')}</label>
                  <Input
                    value={emailSettings.imap_port}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, imap_port: e.target.value }))}
                    placeholder="993"
                    className="border-slate-200"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SMTP Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                {t('smtpSettings')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('smtpServer')}</label>
                  <Input
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="smtp.ionos.de"
                    className="border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('smtpPort')}</label>
                  <Input
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_port: e.target.value }))}
                    placeholder="587"
                    className="border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('username')}</label>
                  <Input
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_username: e.target.value }))}
                    placeholder="emre@gewuerzberg.de"
                    className="border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{t('password')}</label>
                  <Input
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp_password: e.target.value }))}
                    placeholder="••••••••"
                    className="border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Not:</strong> {t('settingsNote')}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>{t('cancel')}</Button>
            <Button 
              onClick={saveEmailSettings} 
              disabled={savingSettings}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
              {t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Folder Dialog */}
      <Dialog open={isAddFolderOpen} onOpenChange={setIsAddFolderOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-500" />
              {t('addFolder')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t('folderName')}</label>
              <Input 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t('folderName')}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsAddFolderOpen(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreateFolder} className="bg-gradient-to-r from-indigo-600 to-purple-600">
              {t('createFolder')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MailPage;
