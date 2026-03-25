import React, { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  tr: {
    // Navigation
    dashboard: 'Kontrol Paneli',
    leads: 'Müşteriler',
    templates: 'Şablonlar',
    emailComposer: 'Mail Oluştur',
    emailHistory: 'Mail Geçmişi',
    settings: 'Ayarlar',
    
    // Dashboard
    totalLeads: 'Toplam Müşteri',
    emailsSent: 'Gönderilen Mail',
    emailsFailed: 'Başarısız Mail',
    recentLeads: 'Son Eklenen Müşteriler',
    noLeadsYet: 'Henüz müşteri yok',
    
    // Leads
    addLead: 'Müşteri Ekle',
    editLead: 'Müşteri Düzenle',
    deleteLead: 'Müşteri Sil',
    firstName: 'Ad',
    lastName: 'Soyad',
    companyName: 'Firma Adı',
    taxNumber: 'Vergi Numarası',
    address: 'Adres',
    email: 'E-posta',
    city: 'Şehir',
    country: 'Ülke',
    notes: 'Notlar',
    actions: 'İşlemler',
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    sendEmail: 'Mail Gönder',
    confirmDelete: 'Bu müşteriyi silmek istediğinize emin misiniz?',
    
    // Templates
    addTemplate: 'Şablon Ekle',
    templateName: 'Şablon Adı',
    subject: 'Konu',
    body: 'İçerik',
    language: 'Dil',
    noTemplates: 'Henüz şablon yok',
    
    // Email Composer
    selectLead: 'Müşteri Seç',
    generateWithAI: 'AI ile Oluştur',
    generating: 'Oluşturuluyor...',
    send: 'Gönder',
    preview: 'Önizleme',
    emailSubject: 'Mail Konusu',
    emailBody: 'Mail İçeriği',
    tone: 'Ton',
    professional: 'Profesyonel',
    friendly: 'Samimi',
    formal: 'Resmi',
    
    // Email History
    recipient: 'Alıcı',
    company: 'Firma',
    status: 'Durum',
    sentAt: 'Gönderim Zamanı',
    sent: 'Gönderildi',
    failed: 'Başarısız',
    noEmailHistory: 'Henüz mail geçmişi yok',
    
    // Settings
    smtpSettings: 'SMTP Ayarları',
    smtpHost: 'SMTP Sunucusu',
    smtpPort: 'Port',
    smtpUsername: 'Kullanıcı Adı',
    smtpPassword: 'Şifre',
    fromEmail: 'Gönderen E-posta',
    fromName: 'Gönderen Adı',
    useTLS: 'TLS Kullan',
    testConnection: 'Bağlantıyı Test Et',
    saveSettings: 'Ayarları Kaydet',
    
    // Messages
    leadAdded: 'Müşteri eklendi',
    leadUpdated: 'Müşteri güncellendi',
    leadDeleted: 'Müşteri silindi',
    templateAdded: 'Şablon eklendi',
    templateDeleted: 'Şablon silindi',
    emailSent: 'Mail gönderildi',
    emailQueued: 'Mail kuyruğa eklendi',
    settingsSaved: 'Ayarlar kaydedildi',
    connectionSuccess: 'Bağlantı başarılı',
    connectionFailed: 'Bağlantı başarısız',
    error: 'Hata',
    success: 'Başarılı',
  },
  de: {
    // Navigation
    dashboard: 'Dashboard',
    leads: 'Kunden',
    templates: 'Vorlagen',
    emailComposer: 'E-Mail erstellen',
    emailHistory: 'E-Mail-Verlauf',
    settings: 'Einstellungen',
    
    // Dashboard
    totalLeads: 'Gesamtkunden',
    emailsSent: 'Gesendete E-Mails',
    emailsFailed: 'Fehlgeschlagene E-Mails',
    recentLeads: 'Neueste Kunden',
    noLeadsYet: 'Noch keine Kunden',
    
    // Leads
    addLead: 'Kunde hinzufügen',
    editLead: 'Kunde bearbeiten',
    deleteLead: 'Kunde löschen',
    firstName: 'Vorname',
    lastName: 'Nachname',
    companyName: 'Firmenname',
    taxNumber: 'Steuernummer',
    address: 'Adresse',
    email: 'E-Mail',
    city: 'Stadt',
    country: 'Land',
    notes: 'Notizen',
    actions: 'Aktionen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    sendEmail: 'E-Mail senden',
    confirmDelete: 'Möchten Sie diesen Kunden wirklich löschen?',
    
    // Templates
    addTemplate: 'Vorlage hinzufügen',
    templateName: 'Vorlagenname',
    subject: 'Betreff',
    body: 'Inhalt',
    language: 'Sprache',
    noTemplates: 'Noch keine Vorlagen',
    
    // Email Composer
    selectLead: 'Kunde auswählen',
    generateWithAI: 'Mit KI erstellen',
    generating: 'Wird erstellt...',
    send: 'Senden',
    preview: 'Vorschau',
    emailSubject: 'E-Mail-Betreff',
    emailBody: 'E-Mail-Inhalt',
    tone: 'Ton',
    professional: 'Professionell',
    friendly: 'Freundlich',
    formal: 'Formell',
    
    // Email History
    recipient: 'Empfänger',
    company: 'Firma',
    status: 'Status',
    sentAt: 'Gesendet am',
    sent: 'Gesendet',
    failed: 'Fehlgeschlagen',
    noEmailHistory: 'Noch kein E-Mail-Verlauf',
    
    // Settings
    smtpSettings: 'SMTP-Einstellungen',
    smtpHost: 'SMTP-Server',
    smtpPort: 'Port',
    smtpUsername: 'Benutzername',
    smtpPassword: 'Passwort',
    fromEmail: 'Absender-E-Mail',
    fromName: 'Absendername',
    useTLS: 'TLS verwenden',
    testConnection: 'Verbindung testen',
    saveSettings: 'Einstellungen speichern',
    
    // Messages
    leadAdded: 'Kunde hinzugefügt',
    leadUpdated: 'Kunde aktualisiert',
    leadDeleted: 'Kunde gelöscht',
    templateAdded: 'Vorlage hinzugefügt',
    templateDeleted: 'Vorlage gelöscht',
    emailSent: 'E-Mail gesendet',
    emailQueued: 'E-Mail in Warteschlange',
    settingsSaved: 'Einstellungen gespeichert',
    connectionSuccess: 'Verbindung erfolgreich',
    connectionFailed: 'Verbindung fehlgeschlagen',
    error: 'Fehler',
    success: 'Erfolg',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    leads: 'Leads',
    templates: 'Templates',
    emailComposer: 'Compose Email',
    emailHistory: 'Email History',
    settings: 'Settings',
    
    // Dashboard
    totalLeads: 'Total Leads',
    emailsSent: 'Emails Sent',
    emailsFailed: 'Failed Emails',
    recentLeads: 'Recent Leads',
    noLeadsYet: 'No leads yet',
    
    // Leads
    addLead: 'Add Lead',
    editLead: 'Edit Lead',
    deleteLead: 'Delete Lead',
    firstName: 'First Name',
    lastName: 'Last Name',
    companyName: 'Company Name',
    taxNumber: 'Tax Number',
    address: 'Address',
    email: 'Email',
    city: 'City',
    country: 'Country',
    notes: 'Notes',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    sendEmail: 'Send Email',
    confirmDelete: 'Are you sure you want to delete this lead?',
    
    // Templates
    addTemplate: 'Add Template',
    templateName: 'Template Name',
    subject: 'Subject',
    body: 'Body',
    language: 'Language',
    noTemplates: 'No templates yet',
    
    // Email Composer
    selectLead: 'Select Lead',
    generateWithAI: 'Generate with AI',
    generating: 'Generating...',
    send: 'Send',
    preview: 'Preview',
    emailSubject: 'Email Subject',
    emailBody: 'Email Body',
    tone: 'Tone',
    professional: 'Professional',
    friendly: 'Friendly',
    formal: 'Formal',
    
    // Email History
    recipient: 'Recipient',
    company: 'Company',
    status: 'Status',
    sentAt: 'Sent At',
    sent: 'Sent',
    failed: 'Failed',
    noEmailHistory: 'No email history yet',
    
    // Settings
    smtpSettings: 'SMTP Settings',
    smtpHost: 'SMTP Host',
    smtpPort: 'Port',
    smtpUsername: 'Username',
    smtpPassword: 'Password',
    fromEmail: 'From Email',
    fromName: 'From Name',
    useTLS: 'Use TLS',
    testConnection: 'Test Connection',
    saveSettings: 'Save Settings',
    
    // Messages
    leadAdded: 'Lead added',
    leadUpdated: 'Lead updated',
    leadDeleted: 'Lead deleted',
    templateAdded: 'Template added',
    templateDeleted: 'Template deleted',
    emailSent: 'Email sent',
    emailQueued: 'Email queued',
    settingsSaved: 'Settings saved',
    connectionSuccess: 'Connection successful',
    connectionFailed: 'Connection failed',
    error: 'Error',
    success: 'Success',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('tr');
  
  const t = useCallback((key) => {
    return translations[language][key] || key;
  }, [language]);
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
