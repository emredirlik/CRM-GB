import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MessageCircle, Send, X, Loader2, Bot, User, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const texts = {
  en: {
    title: 'AI Assistant',
    placeholder: 'Ask me anything...',
    send: 'Send',
    thinking: 'Thinking...',
    error: 'Error',
    errorMessage: 'Could not get response',
    welcome: 'Hello! I am the Gewürzberg AI Assistant. How can I help you today?',
    suggestions: ['Product information', 'Recipe suggestions', 'Order help', 'Business questions']
  },
  tr: {
    title: 'AI Asistan',
    placeholder: 'Bana bir şey sorun...',
    send: 'Gönder',
    thinking: 'Düşünüyor...',
    error: 'Hata',
    errorMessage: 'Yanıt alınamadı',
    welcome: 'Merhaba! Ben Gewürzberg AI Asistanıyım. Size nasıl yardımcı olabilirim?',
    suggestions: ['Ürün bilgisi', 'Reçete önerileri', 'Sipariş yardımı', 'İş soruları']
  },
  de: {
    title: 'KI-Assistent',
    placeholder: 'Fragen Sie mich etwas...',
    send: 'Senden',
    thinking: 'Denkt nach...',
    error: 'Fehler',
    errorMessage: 'Konnte keine Antwort erhalten',
    welcome: 'Hallo! Ich bin der Gewürzberg KI-Assistent. Wie kann ich Ihnen heute helfen?',
    suggestions: ['Produktinformation', 'Rezeptvorschläge', 'Bestellhilfe', 'Geschäftsfragen']
  },
  pl: {
    title: 'Asystent AI',
    placeholder: 'Zapytaj mnie o cokolwiek...',
    send: 'Wyślij',
    thinking: 'Myśli...',
    error: 'Błąd',
    errorMessage: 'Nie można uzyskać odpowiedzi',
    welcome: 'Cześć! Jestem asystentem AI Gewürzberg. Jak mogę ci dzisiaj pomóc?',
    suggestions: ['Informacje o produkcie', 'Propozycje receptur', 'Pomoc z zamówieniem', 'Pytania biznesowe']
  }
};

const AIChatWidget = () => {
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Generate session ID on mount
    setSessionId(`chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    // Add welcome message
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'bot',
        text: t.welcome,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, t.welcome]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/ai/chat`, {
        message: text.trim(),
        session_id: sessionId,
        language: language
      });

      if (response.data.success) {
        const botMessage = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          text: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.data.response || 'Unknown error');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        text: `${t.errorMessage}: ${error.message}`,
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg z-50"
        data-testid="ai-chat-button"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed z-50 shadow-2xl border-2 border-purple-200 transition-all duration-300 ${
      isMinimized 
        ? 'bottom-20 right-6 w-80 h-14' 
        : 'bottom-20 right-6 w-96 h-[500px]'
    }`}>
      {/* Header */}
      <CardHeader className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="font-semibold">{t.title}</span>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">AI</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 text-white hover:bg-white/20"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(100%-56px)]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-1' : 'order-2'}`}>
                    <div className={`flex items-start gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.type === 'user' 
                          ? 'bg-orange-100' 
                          : msg.isError 
                            ? 'bg-red-100' 
                            : 'bg-purple-100'
                      }`}>
                        {msg.type === 'user' 
                          ? <User className="w-4 h-4 text-orange-600" /> 
                          : <Bot className={`w-4 h-4 ${msg.isError ? 'text-red-600' : 'text-purple-600'}`} />
                        }
                      </div>
                      <div className={`rounded-lg p-3 ${
                        msg.type === 'user'
                          ? 'bg-orange-500 text-white'
                          : msg.isError
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">{t.thinking}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {t.suggestions.map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(suggestion)}
                    className="text-xs"
                    disabled={loading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.placeholder}
                disabled={loading}
                className="flex-1"
                data-testid="ai-chat-input"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AIChatWidget;
