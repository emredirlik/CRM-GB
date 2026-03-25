import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEmailHistory } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Mail, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EmailHistory = () => {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getEmailHistory();
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEmailDetails = (email) => {
    setSelectedEmail(email);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="history-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="email-history-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight font-['Manrope']">{t('emailHistory')}</h1>
        <p className="text-muted-foreground mt-1">{history.length} emails in history</p>
      </div>

      {/* History Table */}
      <Card data-testid="history-table-card">
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="no-history">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t('noEmailHistory')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table" data-testid="history-table">
                <thead>
                  <tr>
                    <th>{t('recipient')}</th>
                    <th>{t('company')}</th>
                    <th>{t('subject')}</th>
                    <th>{t('status')}</th>
                    <th>{t('sentAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((email) => (
                    <tr 
                      key={email.id} 
                      className="cursor-pointer"
                      onClick={() => openEmailDetails(email)}
                      data-testid={`history-row-${email.id}`}
                    >
                      <td>
                        <div>
                          <p className="font-medium">{email.lead_name}</p>
                          <p className="text-xs text-muted-foreground">{email.lead_email}</p>
                        </div>
                      </td>
                      <td>{email.company_name}</td>
                      <td className="max-w-xs truncate">{email.subject}</td>
                      <td>
                        {email.status === 'sent' ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {t('sent')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('failed')}
                          </Badge>
                        )}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {formatDate(email.sent_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="email-details-dialog">
          <DialogHeader>
            <DialogTitle className="font-['Manrope'] flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Details
            </DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('recipient')}</p>
                  <p className="font-medium">{selectedEmail.lead_name}</p>
                  <p className="text-muted-foreground">{selectedEmail.lead_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('company')}</p>
                  <p className="font-medium">{selectedEmail.company_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('status')}</p>
                  {selectedEmail.status === 'sent' ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {t('sent')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100">
                      <XCircle className="w-3 h-3 mr-1" />
                      {t('failed')}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">{t('sentAt')}</p>
                  <p className="font-medium">{formatDate(selectedEmail.sent_at)}</p>
                </div>
              </div>
              
              {selectedEmail.error_message && (
                <div className="p-3 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm font-medium text-red-700">Error:</p>
                  <p className="text-sm text-red-600">{selectedEmail.error_message}</p>
                </div>
              )}

              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-2">{t('subject')}</p>
                <p className="font-semibold">{selectedEmail.subject}</p>
              </div>

              <div className="border rounded-lg p-4 bg-white">
                <p className="text-sm text-muted-foreground mb-2">{t('body')}</p>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {selectedEmail.body}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailHistory;
