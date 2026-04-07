import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-[60]
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Mobile header - Premium compact style */}
        <div className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-slate-900 to-indigo-900 border-b border-indigo-500/30 shadow-xl">
          <div className="px-3 py-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-white hover:bg-white/10 transition-colors h-8 w-8 p-0"
              data-testid="mobile-menu-btn"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_customer-agent-2/artifacts/wqgvx1bf_Ads%C4%B1z%20tasar%C4%B1m%20%281%29.png"
                alt="Logo"
                className="w-7 h-7 object-contain rounded-md shadow-md"
              />
              <span className="text-white font-bold text-sm tracking-tight">Gewürzberg CRM</span>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {user?.name?.[0] || 'E'}
            </div>
          </div>
        </div>
        
        <div className="p-3 md:p-4 lg:p-6 page-enter">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
