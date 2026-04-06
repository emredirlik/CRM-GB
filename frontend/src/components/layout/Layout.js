import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Mobile header - Premium style */}
        <div className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-white hover:bg-white/10 transition-colors"
              data-testid="mobile-menu-btn"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2.5">
              <img 
                src="https://customer-assets.emergentagent.com/job_customer-agent-2/artifacts/u9wa6amt_Ads%C4%B1z%20tasar%C4%B1m%20%281%29.png"
                alt="Logo"
                className="w-8 h-8 object-contain bg-white rounded-lg p-0.5 shadow-md"
              />
              <div className="text-center">
                <span className="text-white font-bold text-sm tracking-tight block">Gewürzberg GmbH</span>
                <span className="text-slate-400 text-[10px] block">Premium CRM</span>
              </div>
            </div>
            
            <div className="w-10" />
          </div>
        </div>
        
        <div className="p-4 md:p-6 lg:p-8 page-enter">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
