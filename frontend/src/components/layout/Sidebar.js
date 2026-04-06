import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Mail, 
  History, 
  Settings,
  Search,
  ShoppingCart,
  BookOpen,
  Package,
  MapPin,
  LogOut,
  ClipboardList,
  Calendar,
  Truck,
  Video,
  Inbox,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ onClose }) => {
  const { t, language, setLanguage } = useLanguage();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'dashboard' },
    { path: '/find-leads', icon: Search, label: 'findLeads', highlight: true },
    { path: '/leads', icon: Users, label: 'leads' },
    { path: '/orders', icon: ShoppingCart, label: 'orders' },
    { path: '/shipments', icon: Truck, label: 'shipments' },
    { path: '/products', icon: Package, label: 'products' },
    { path: '/product-videos', icon: Video, label: 'productVideos' },
    { path: '/specifications', icon: ClipboardList, label: 'specifications' },
    { path: '/recipes', icon: BookOpen, label: 'recipes' },
    { path: '/daily-reports', icon: Calendar, label: 'dailyReports' },
    { path: '/route-planner', icon: MapPin, label: 'routePlanner' },
    { path: '/templates', icon: FileText, label: 'templates' },
    { path: '/mail-inbox', icon: Inbox, label: 'mailInbox' },
    { path: '/compose', icon: Mail, label: 'emailComposer' },
    { path: '/history', icon: History, label: 'emailHistory' },
    { path: '/settings', icon: Settings, label: 'settings' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className="sidebar w-64 min-h-screen flex flex-col" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-4 lg:p-6 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_customer-agent-2/artifacts/u9wa6amt_Ads%C4%B1z%20tasar%C4%B1m%20%281%29.png"
            alt="Gewürzberg Logo"
            className="w-10 h-10 object-contain bg-white rounded-lg p-1"
          />
          <div>
            <h1 className="text-lg font-bold text-white font-['Manrope']">Gewürzberg</h1>
            <p className="text-xs text-slate-400">GmbH</p>
          </div>
        </div>
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            data-testid={`nav-${item.label}`}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''} ${item.highlight ? 'bg-indigo-900/30 border border-indigo-600/30' : ''}`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${item.highlight ? 'text-indigo-400' : ''}`} />
            <span className="font-medium truncate">{t(item.label)}</span>
            {item.highlight && (
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-indigo-600 text-white rounded font-bold flex-shrink-0">AI</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language Selector */}
      <div className="p-3 lg:p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">{t('language')}</p>
        <div className="flex gap-1 lg:gap-2 flex-wrap">
          {['en', 'tr', 'de', 'pl'].map((lang) => (
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

      {/* User Info & Logout */}
      <div className="p-3 lg:p-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400">{user?.role || 'admin'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-slate-700 flex-shrink-0"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
