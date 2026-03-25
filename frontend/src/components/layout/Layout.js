import React from 'react';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/sonner';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 page-enter">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
