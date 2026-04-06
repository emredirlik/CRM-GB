import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, LogIn, AlertCircle, Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Login = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const LANGUAGES = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱' }
  ];
  
  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Force re-render when language changes
  const [, forceUpdate] = useState(0);
  
  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    forceUpdate(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Language Selector - Top Right Corner */}
      <div className="absolute top-4 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Globe className="w-4 h-4 mr-2" />
              {currentLang.flag} {currentLang.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem 
                key={lang.code} 
                onClick={() => handleLanguageChange(lang.code)}
                className={`cursor-pointer ${language === lang.code ? 'bg-indigo-100 text-indigo-700' : ''}`}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
                {language === lang.code && <Check className="w-4 h-4 ml-auto text-indigo-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Background with spice images */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Spice pattern overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px)'
          }}
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-orange-900/30" />
        
        {/* Decorative spice circles */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1599909533681-74084c802052?w=200&q=80')`,
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=200&q=80')`,
            backgroundSize: 'cover'
          }}
        />
        <div className="absolute top-1/3 right-10 w-24 h-24 rounded-full opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=200&q=80')`,
            backgroundSize: 'cover'
          }}
        />
      </div>
      
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Company Name */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 bg-white rounded-2xl p-4 shadow-2xl transform hover:scale-105 transition-transform">
              <img 
                src="https://customer-assets.emergentagent.com/job_customer-agent-2/artifacts/u9wa6amt_Ads%C4%B1z%20tasar%C4%B1m%20%281%29.png"
                alt="Gewürzberg Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white font-['Manrope'] tracking-tight">Gewürzberg GmbH</h1>
          <p className="text-orange-300/80 mt-2 text-lg">B2B Customer Relationship Management</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center font-['Manrope']">{t('welcome')}</CardTitle>
            <CardDescription className="text-center">
              {t('signInDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  {t('username')}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder={t('enterUsername')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="login-username"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('enterPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    data-testid="login-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-orange-600 hover:bg-orange-700"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('signingIn')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    <span>{t('signIn')}</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-6">
          The Secret Is In The Taste
        </p>
      </div>
    </div>
  );
};

export default Login;
