import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, ChevronDown, Menu, Moon, Search, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const displayName = user?.name || user?.username || 'Student';

  useEffect(() => {
    const syncNotifications = () => {
      try {
        const notifications = JSON.parse(localStorage.getItem('student_portal_notifications') || '[]');
        setUnreadCount(notifications.filter((item) => !item.read).length);
      } catch {
        setUnreadCount(0);
      }
    };

    syncNotifications();
    window.addEventListener('notifications-updated', syncNotifications);
    return () => window.removeEventListener('notifications-updated', syncNotifications);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="glass-surface sticky top-0 z-20 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-card bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-sm shadow-brand-500/20">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Student Portal</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Academic materials hub</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/search"
            className="glass-control hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-400 sm:inline-flex"
          >
            <Search size={16} />
            <span>Search</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to="/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="glass-control flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-400"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block">{displayName}</span>
              <ChevronDown size={16} />
            </button>

            {menuOpen && (
              <div className="glass-surface absolute right-0 mt-2 w-48 rounded-card p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Signed in</p>
                </div>
                <Link
                  to="/profile"
                  className="mt-2 block rounded-control px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="mt-1 w-full rounded-control px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
