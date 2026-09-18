import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BookMarked,
  Bookmark,
  Building2,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  LogOut,
  PencilLine,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  UserCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

const BOOKMARKS_KEY = 'dashboard_bookmarks';
const RECENT_DOWNLOADS_KEY = 'dashboard_recent_downloads';

const statusStyles = {
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

const SkeletonCard = () => (
  <div className="rounded-surface border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-4 h-10 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
  </div>
);

const EmptyState = ({ title, subtitle, action }) => (
  <div className="rounded-surface border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{title}</p>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
    {action}
  </div>
);

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('uploads');
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    college: user?.college || '',
    program: user?.program || '',
    semester: user?.semester || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [recentDownloads] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_DOWNLOADS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const {
    data: uploads = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile-uploads'],
    queryFn: async () => {
      const res = await api.get('/api/materials/my');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const stats = useMemo(() => {
    const totalDownloads = uploads.reduce((sum, item) => sum + Number(item.downloadCount || 0), 0);
    const averageRating = uploads.length
      ? uploads.reduce((sum, item) => sum + Number(item.averageRating || 0), 0) / uploads.length
      : 0;
    return {
      uploads: uploads.length,
      downloads: totalDownloads,
      bookmarks: bookmarks.length,
      rating: averageRating.toFixed(1),
    };
  }, [uploads, bookmarks.length]);

  const handleDelete = (id) => {
    queryClient.setQueryData(['profile-uploads'], (prev = []) => prev.filter((item) => item.id !== id));
  };

  const removeBookmark = (materialId) => {
    const next = bookmarks.filter((item) => item.id !== materialId);
    setBookmarks(next);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    toast.success('Bookmark removed');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profileMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.put('/api/users/me', {
        name: values.name.trim(),
        college: values.college.trim(),
        program: values.program.trim(),
        semester: values.semester ? Number(values.semester) : null,
      });
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      setProfileForm({ name: data.name || '', college: data.college || '', program: data.program || '', semester: data.semester || '' });
      setEditOpen(false);
      toast.success('Profile updated successfully.');
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Profile could not be updated.'),
  });

  const passwordMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.put('/api/users/me/password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      return response.data;
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordOpen(false);
      toast.success('Password changed successfully.');
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Password could not be changed.'),
  });

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    if (profileForm.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.');
      return;
    }
    profileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    passwordMutation.mutate(passwordForm);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="rounded-surface border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <AlertCircle size={20} />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-rose-800 dark:text-rose-300">Unable to load your profile data</h3>
          <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{error?.message || 'Please try again in a moment.'}</p>
          <button onClick={() => refetch()} className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
            Retry
          </button>
        </div>
      );
    }

    if (activeTab === 'uploads') {
      if (!uploads.length) {
        return (
          <EmptyState title="No uploads yet" subtitle="Share your first resource and it will appear here." action={<button onClick={() => navigate('/upload')} className="mt-4 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Upload now</button>} />
        );
      }

      return (
        <div className="grid gap-4 lg:grid-cols-2">
          {uploads.map((material) => (
            <div key={material.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles[material.status] || 'bg-slate-100 text-slate-700'}`}>
                  {material.status || 'Pending'}
                </span>
              </div>
              <MaterialCard material={material} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'downloads') {
      if (!recentDownloads.length) {
        return <EmptyState title="No downloads yet" subtitle="Download a resource and it will appear here for quick access." />;
      }

      return (
        <div className="space-y-3">
          {recentDownloads.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-card border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.subject || 'Recently downloaded'}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock3 size={14} />
                {new Date(item.uploadedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!bookmarks.length) {
      return <EmptyState title="No bookmarks yet" subtitle="Save useful materials to revisit them later." />;
    }

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {bookmarks.map((material) => (
          <div key={material.id} className="rounded-surface border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{material.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.subject || 'Saved material'}</p>
              </div>
              <button onClick={() => removeBookmark(material.id)} className="rounded-full p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/30">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{material.category || 'Resource'}</span>
              <span>{new Date(material.uploadedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-3xl font-semibold text-white shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || <UserCircle2 size={32} />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{user?.name || 'Student'}</h1>
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">{user?.role || 'Student'}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={14} />
                    {user?.email || 'No email provided'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={14} />
                    {user?.department || user?.college || 'Department not provided'}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <GraduationCap size={14} />
                    Semester {user?.semester || '—'}
                  </span>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <CalendarDays size={14} />
                  Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'recently'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setEditOpen((value) => !value); setPasswordOpen(false); }} className={`inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${editOpen ? 'bg-brand-600 text-white shadow-sm' : 'glass-control text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-400'}`}>
                <PencilLine size={16} className="mr-2" />
                {editOpen ? 'Close editor' : 'Edit Profile'}
              </button>
              <button onClick={() => { setPasswordOpen((value) => !value); setEditOpen(false); }} className={`inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${passwordOpen ? 'bg-brand-600 text-white shadow-sm' : 'glass-control text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-400'}`}>
                <ShieldCheck size={16} className="mr-2" />
                {passwordOpen ? 'Close password form' : 'Change Password'}
              </button>
              <button onClick={handleLogout} className="inline-flex items-center rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700">
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </section>

        {editOpen && (
          <section className="glass-surface rounded-surface p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Account details</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Edit your profile</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep your academic information up to date.</p>
              </div>
              <PencilLine className="text-brand-500" size={20} />
            </div>
            <form onSubmit={handleProfileSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ['name', 'Full name', 'Your name'],
                ['college', 'College', 'Your college'],
                ['program', 'Program', 'e.g. Computer Science'],
              ].map(([key, label, placeholder]) => (
                <label key={key} className={key === 'name' ? 'md:col-span-2' : ''}>
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <input value={profileForm[key]} onChange={(event) => setProfileForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} className="glass-control w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:text-white" />
                </label>
              ))}
              <label>
                <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Semester</span>
                <input type="number" min="1" max="8" value={profileForm.semester} onChange={(event) => setProfileForm((current) => ({ ...current, semester: event.target.value }))} placeholder="1–8" className="glass-control w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:text-white" />
              </label>
              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={() => setEditOpen(false)} className="glass-control rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={profileMutation.isLoading} className="inline-flex items-center rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">
                  {profileMutation.isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                  Save changes
                </button>
              </div>
            </form>
          </section>
        )}

        {passwordOpen && (
          <section className="glass-surface rounded-surface p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Security</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Change password</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use a strong password with at least 8 characters.</p>
              </div>
              <ShieldCheck className="text-emerald-500" size={20} />
            </div>
            <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ['currentPassword', 'Current password'],
                ['newPassword', 'New password'],
                ['confirmPassword', 'Confirm new password'],
              ].map(([key, label]) => (
                <label key={key}>
                  <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <input type="password" autoComplete={key === 'currentPassword' ? 'current-password' : 'new-password'} value={passwordForm[key]} onChange={(event) => setPasswordForm((current) => ({ ...current, [key]: event.target.value }))} className="glass-control w-full rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:text-white" />
                </label>
              ))}
              <div className="flex justify-end gap-3 md:col-span-3">
                <button type="button" onClick={() => setPasswordOpen(false)} className="glass-control rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={passwordMutation.isLoading} className="inline-flex items-center rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">
                  {passwordMutation.isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                  Update password
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card rounded-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Uploads</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stats.uploads}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Shared by you</p>
              </div>
              <div className="rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"><Upload size={18} /></div>
            </div>
          </div>
          <div className="glass-card rounded-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Downloads</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stats.downloads}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Across your uploads</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Download size={18} /></div>
            </div>
          </div>
          <div className="glass-card rounded-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Bookmarks</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stats.bookmarks}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Saved for later</p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"><BookMarked size={18} /></div>
            </div>
          </div>
          <div className="glass-card rounded-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Rating</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stats.rating}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your shared work</p>
              </div>
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><Star size={18} /></div>
            </div>
          </div>
        </section>

        <section className="glass-surface rounded-surface p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'uploads', label: 'My Uploads' },
              { key: 'downloads', label: 'Downloads' },
              { key: 'bookmarks', label: 'Bookmarks' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {renderContent()}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
