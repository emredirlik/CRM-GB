import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Mail, 
  History, 
  Settings,
  Sparkles,
  Search
} from 'lucide-react';

const Sidebar = () => {
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'dashboard' },
    { path: '/find-leads', icon: Search, label: 'findLeads', highlight: true },
    { path: '/leads', icon: Users, label: 'leads' },
    { path: '/templates', icon: FileText, label: 'templates' },
    { path: '/compose', icon: Mail, label: 'emailComposer' },
    { path: '/history', icon: History, label: 'emailHistory' },
    { path: '/settings', icon: Settings, label: 'settings' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar w-64 min-h-screen flex flex-col" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-['Manrope']">SpiceCRM</h1>
            <p className="text-xs text-slate-400">Berlin Spice Factory</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.label}`}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''} ${item.highlight ? 'bg-orange-900/30 border border-orange-600/30' : ''}`}
          >
            <item.icon className={`w-5 h-5 ${item.highlight ? 'text-orange-400' : ''}`} />
            <span className="font-medium">{t(item.label)}</span>
            {item.highlight && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-orange-600 text-white rounded font-bold">AI</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language Selector */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Language</p>
        <div className="flex gap-2">
          {['tr', 'de', 'en'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              data-testid={`lang-${lang}`}
              className={`lang-btn ${language === lang ? 'active' : ''}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
