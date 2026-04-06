import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile, shown on lg+ */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-white hover:bg-slate-800"
            data-testid="mobile-menu-btn"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <img 
              src="https://customer-assets.emergentagent.com/job_customer-agent-2/artifacts/u9wa6amt_Ads%C4%B1z%20tasar%C4%B1m%20%281%29.png"
              alt="Logo"
              className="w-8 h-8 object-contain bg-white rounded-lg p-0.5"
            />
            <span className="text-white font-bold">Gewürzberg</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
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
