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
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'dashboard' },
    { path: '/find-leads', icon: Search, label: 'findLeads', highlight: true },
    { path: '/leads', icon: Users, label: 'leads' },
    { path: '/orders', icon: ShoppingCart, label: 'orders' },
    { path: '/products', icon: Package, label: 'products' },
    { path: '/recipes', icon: BookOpen, label: 'recipes' },
    { path: '/route-planner', icon: MapPin, label: 'routePlanner' },
    { path: '/templates', icon: FileText, label: 'templates' },
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

  return (
    <aside className="sidebar w-64 min-h-screen flex flex-col" data-testid="sidebar">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_customer-agent-2/artifacts/u9wa6amt_Ads%C4%B1z%20tasar%C4%B1m%20%281%29.png"
            alt="Gewürzberg Logo"
            className="w-10 h-10 object-contain bg-white rounded-lg p-1"
          />
          <div>
            <h1 className="text-lg font-bold text-white font-['Manrope']">Gewürzberg GmbH</h1>
            <p className="text-xs text-slate-400">Emre Dirlik</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-sm text-white font-medium">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400">{user?.role || 'admin'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
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
