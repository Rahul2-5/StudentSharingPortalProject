import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  CheckCheck,
  Circle,
  Clock3,
  FileText,
  MessageCircle,
  Smartphone,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';

const NOTIFICATIONS_KEY = 'student_portal_notifications';

const notificationStyles = {
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  comment: 'bg-violet-100 text-violet-700',
  milestone: 'bg-amber-100 text-amber-700',
  general: 'bg-slate-100 text-slate-700',
};

const notificationIcons = {
  approved: CheckCheck,
  rejected: XCircle,
  comment: MessageCircle,
  milestone: TrendingUp,
  general: BellRing,
};

const buildSeedNotifications = (materials = []) => {
  const fallbackMaterials = materials.slice(0, 3);
  return [
    {
      id: 1,
      type: 'approved',
      title: 'Material approved',
      message: 'Your notes for Operating Systems are now visible to the community.',
      timestamp: new Date().toISOString(),
      read: false,
      materialId: fallbackMaterials[0]?.id || null,
    },
    {
      id: 2,
      type: 'comment',
      title: 'New comment',
      message: 'A peer left a helpful comment on your uploaded paper.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: false,
      materialId: fallbackMaterials[1]?.id || null,
    },
    {
      id: 3,
      type: 'milestone',
      title: 'Download milestone',
      message: 'Your shared resource crossed 50 downloads.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      read: true,
      materialId: fallbackMaterials[2]?.id || null,
    },
    {
      id: 4,
      type: 'general',
      title: 'Reminder',
      message: 'Your profile is looking great. Consider adding more materials.',
      timestamp: new Date(Date.now() - 604800000).toISOString(),
      read: true,
      materialId: null,
    },
  ];
};

const formatStamp = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const groupNotifications = (items = []) => {
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  items.forEach((item) => {
    const when = new Date(item.timestamp);
    const isToday = when.toDateString() === today.toDateString();
    const isYesterday = when.toDateString() === yesterday.toDateString();

    if (isToday) groups.Today.push(item);
    else if (isYesterday) groups.Yesterday.push(item);
    else groups.Earlier.push(item);
  });

  return groups;
};

const SkeletonCard = () => (
  <div className="rounded-surface border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-4 h-10 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
  </div>
);

const NotificationsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: materials = [] } = useQuery({
    queryKey: ['notifications-materials'],
    queryFn: async () => {
      const res = await api.get('/api/materials');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: notifications = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const saved = localStorage.getItem(NOTIFICATIONS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      const seeded = buildSeedNotifications(materials);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(seeded));
      return seeded;
    },
  });

  const groupedNotifications = useMemo(() => groupNotifications(notifications), [notifications]);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const persistNotifications = (next) => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    queryClient.setQueryData(['notifications'], next);
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const markAsRead = (id) => {
    const next = notifications.map((item) => (item.id === id ? { ...item, read: true } : item));
    persistNotifications(next);
  };

  const markAllAsRead = () => {
    const next = notifications.map((item) => ({ ...item, read: true }));
    persistNotifications(next);
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id) => {
    const next = notifications.filter((item) => item.id !== id);
    persistNotifications(next);
    toast.success('Notification removed');
  };

  const openNotification = (item) => {
    if (!item.read) markAsRead(item.id);
    if (item.materialId) {
      navigate(`/materials/${item.materialId}`);
      return;
    }
    navigate('/dashboard');
  };

  const renderGroup = (label, items) => {
    if (!items.length) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">{label}</h3>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = notificationIcons[item.type] || notificationIcons.general;
            return (
              <div
                key={item.id}
                className={`rounded-surface border p-4 shadow-sm transition ${item.read ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900' : 'border-brand-200 bg-brand-50/60 dark:border-brand-900/50 dark:bg-brand-950/20'}`}
              >
                <div className="flex gap-3">
                  <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl ${notificationStyles[item.type] || notificationStyles.general}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                          {!item.read && <Circle size={8} className="fill-brand-600 text-brand-600" />}
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.message}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Clock3 size={13} />
                        {formatStamp(item.timestamp)}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button onClick={() => openNotification(item)} className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
                        View details
                      </button>
                      {!item.read && (
                        <button onClick={() => markAsRead(item.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400">
                          Mark as read
                        </button>
                      )}
                      <button onClick={() => deleteNotification(item.id)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-900 dark:hover:text-rose-400">
                        <Trash2 size={14} className="mr-1 inline" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Notifications</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Your activity center</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Stay updated on approvals, comments, downloads, and more.</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-500">
                <Smartphone size={13} />
                Generated on this device — not synced across devices or accounts.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={markAllAsRead} className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400">
                <CheckCheck size={16} className="mr-2" />
                Mark all as read
              </button>
              <div className="inline-flex items-center rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
                <BellRing size={16} className="mr-2" />
                {unreadCount} unread
              </div>
            </div>
          </div>
        </section>

        <section className="glass-surface rounded-surface p-5 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-surface border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <FileText size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-rose-800 dark:text-rose-300">We could not load your notifications</h3>
              <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error?.message || 'Please try again in a moment.'}</p>
              <button onClick={() => refetch()} className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-surface border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-slate-800/60">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                <BellRing size={24} />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">You&apos;re all caught up!</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">No new notifications right now. Check back later for updates.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {renderGroup('Today', groupedNotifications.Today)}
              {renderGroup('Yesterday', groupedNotifications.Yesterday)}
              {renderGroup('Earlier', groupedNotifications.Earlier)}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default NotificationsPage;
