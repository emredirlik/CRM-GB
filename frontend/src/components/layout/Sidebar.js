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
  X,
  Sparkles,
  UserCog,
  Brain,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = ({ onClose }) => {
  const { t, language, setLanguage } = useLanguage();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'dashboard' },
    { path: '/leads', icon: Users, label: 'leads' },
    { path: '/shipments', icon: Truck, label: 'shipments' },
    { path: '/find-leads', icon: Search, label: 'findLeads', highlight: true },
    { path: '/customer-segments', icon: Crown, label: 'customerSegments', highlight: true },
    { path: '/orders', icon: ShoppingCart, label: 'orders' },
    { path: '/specifications', icon: ClipboardList, label: 'specifications' },
    { path: '/product-videos', icon: Video, label: 'productVideos' },
    { path: '/recipes', icon: BookOpen, label: 'recipes' },
    { path: '/daily-reports', icon: Calendar, label: 'dailyReports' },
    { path: '/route-planner', icon: MapPin, label: 'routePlanner' },
    { path: '/mail', icon: Mail, label: 'mail' },
    { path: '/compose', icon: Sparkles, label: 'aiMailComposer', highlight: true },
    { path: '/templates', icon: FileText, label: 'templates' },
    { path: '/ai-analytics', icon: Brain, label: 'aiAnalytics', highlight: true },
    { path: '/history', icon: History, label: 'emailHistory' },
    { path: '/settings', icon: Settings, label: 'settings' },
  ];

  // Add admin page only for admin user
  if (user?.role === 'admin' || user?.name === 'Admin' || user?.name === 'Emre Dirlik') {
    navItems.push({ path: '/admin', icon: UserCog, label: 'admin', adminOnly: true });
  }

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
    <aside className="sidebar w-64 h-screen flex flex-col sticky top-0" data-testid="sidebar">
      {/* Company Header */}
      <div className="p-4 lg:p-5 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_customer-agent-2/artifacts/u9wa6amt_Ads%C4%B1z%20tasar%C4%B1m%20%281%29.png"
              alt="Gewürzberg Logo"
              className="w-10 h-10 object-contain bg-white rounded-lg p-1"
            />
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Gewürzberg GmbH</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <p className="text-xs text-slate-300">{user?.name || 'Admin'}</p>
              </div>
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            data-testid={`nav-${item.label}`}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''} ${item.highlight ? 'bg-indigo-900/30 border border-indigo-600/30' : ''} ${item.adminOnly ? 'border-l-2 border-amber-500' : ''}`}
          >
            <item.icon className={`w-4 h-4 flex-shrink-0 ${item.highlight ? 'text-indigo-400' : ''} ${item.adminOnly ? 'text-amber-400' : ''}`} />
            <span className="font-medium truncate text-sm">{t(item.label)}</span>
            {item.highlight && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-indigo-600 text-white rounded font-bold flex-shrink-0">AI</span>
            )}
            {item.adminOnly && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-amber-600 text-white rounded font-bold flex-shrink-0">ADMIN</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Language Selector */}
      <div className="p-3 border-t border-slate-700">
        <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-medium">{t('language')}</p>
        <div className="flex gap-1">
          {['en', 'tr', 'de', 'pl'].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              data-testid={`lang-${lang}`}
              className={`lang-btn flex-1 ${language === lang ? 'active' : ''}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700"
          data-testid="logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('logout') || 'Çıkış'}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
