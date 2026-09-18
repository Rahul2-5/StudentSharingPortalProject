import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, LayoutGrid, ShieldCheck, Upload, UserCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutGrid },
  { label: 'Upload', to: '/upload', icon: Upload },
  { label: 'Profile', to: '/profile', icon: UserCircle },
  { label: 'Admin', to: '/admin', icon: ShieldCheck, adminOnly: true },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navItems = navigation.filter((item) => !item.adminOnly || user?.role === 'ADMIN');

  return (
    <>
      <aside
        className={`glass-surface fixed inset-y-0 left-0 z-30 w-72 border-y-0 border-l-0 px-3 py-4 shadow-lg transition-transform duration-200 md:static md:translate-x-0 md:border-r-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">Campus</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Learning Hub</p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-card px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-8 rounded-surface border border-brand-100 bg-brand-50 p-4 dark:border-brand-900/40 dark:bg-brand-950/20">
          <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
            <BookOpen size={16} />
            <p className="text-sm font-semibold">Academic resources</p>
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Discover notes, books and study guides with a calm, focused workspace.
          </p>
        </div>
      </aside>

      {isOpen && <div className="fixed inset-0 z-20 bg-slate-950/30 md:hidden" onClick={onClose} />}
    </>
  );
};

export default Sidebar;
