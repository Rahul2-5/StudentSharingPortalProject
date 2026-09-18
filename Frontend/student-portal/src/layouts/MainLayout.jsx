import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

const MainLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] transition-colors duration-200">
      <div className="flex min-h-screen flex-col">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} />

        <div className="flex flex-1">
          <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

          <div className="flex flex-1 flex-col">
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="mx-auto max-w-7xl space-y-7">{children}</div>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
