import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookMarked,
  Bookmark,
  Clock3,
  Download,
  MessageCircle,
  Search,
  Sparkles,
  Star,
  Upload,
} from 'lucide-react';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

const RECENT_DOWNLOADS_KEY = 'dashboard_recent_downloads';
const BOOKMARKS_KEY = 'dashboard_bookmarks';

const formatDate = (value) => {
  if (!value) return 'Recently added';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const EmptyState = ({ title, subtitle, action }) => (
  <div className="rounded-surface border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{title}</p>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
    {action}
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-surface border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
    <div className="mt-4 h-10 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [recentDownloads, setRecentDownloads] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_DOWNLOADS_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const { data: materials = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-materials'],
    queryFn: async () => {
      const res = await api.get('/api/materials');
      const payload = res.data;
      return Array.isArray(payload) ? payload : payload?.content || [];
    },
  });

  const sortedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
  }, [materials]);

  const recentUploads = useMemo(() => sortedMaterials.slice(0, 4), [sortedMaterials]);

  const stats = useMemo(() => {
    const totalUploads = materials.length;
    const totalDownloads = materials.reduce((sum, material) => sum + Number(material.downloadCount || 0), 0);
    const averageRating = materials.length
      ? materials.reduce((sum, material) => sum + Number(material.averageRating || 0), 0) / materials.length
      : 0;
    const bookmarks = bookmarkedIds.length;

    return [
      { title: 'Total Uploads', value: totalUploads, hint: 'Shared by the community', icon: Upload, tone: 'bg-brand-100 text-brand-700' },
      { title: 'Total Downloads', value: totalDownloads, hint: 'Across available resources', icon: Download, tone: 'bg-emerald-100 text-emerald-700' },
      { title: 'Bookmarks', value: bookmarks, hint: 'Saved for later', icon: BookMarked, tone: 'bg-amber-100 text-amber-700' },
      { title: 'Average Rating', value: averageRating.toFixed(1), hint: 'Across visible materials', icon: Star, tone: 'bg-rose-100 text-rose-700' },
    ];
  }, [bookmarkedIds.length, materials]);

  const bookmarkedMaterials = useMemo(() => {
    return sortedMaterials.filter((material) => bookmarkedIds.includes(material.id));
  }, [bookmarkedIds, sortedMaterials]);

  const recentActivity = useMemo(() => {
    const items = sortedMaterials.slice(0, 8).flatMap((material) => [
      { type: 'upload', title: `Uploaded ${material.title}`, time: material.uploadedAt || new Date().toISOString(), icon: Upload },
      ...(Number(material.downloadCount) > 0 ? [{ type: 'download', title: `${material.downloadCount} download${material.downloadCount === 1 ? '' : 's'} for ${material.title}`, time: material.uploadedAt || new Date().toISOString(), icon: Download }] : []),
      ...(Number(material.averageRating) > 0 ? [{ type: 'rating', title: `Rated ${Number(material.averageRating).toFixed(1)} ★ for ${material.title}`, time: material.uploadedAt || new Date().toISOString(), icon: Star }] : []),
      ...(material.description ? [{ type: 'comment', title: `Added context for ${material.title}`, time: material.uploadedAt || new Date().toISOString(), icon: MessageCircle }] : []),
    ]);

    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  }, [sortedMaterials]);

  const userSemester = user?.semester;
  const userDepartment = user?.department?.toLowerCase() || '';

  const recommendedMaterials = useMemo(() => {
    const preferred = sortedMaterials.filter((material) => {
      if (!userSemester && !userDepartment) return true;
      const semesterMatch = userSemester ? String(material.semester) === String(userSemester) : false;
      const departmentMatch = userDepartment
        ? `${material.subject || ''} ${material.department || ''}`.toLowerCase().includes(userDepartment)
        : false;
      return semesterMatch || departmentMatch;
    });
    return preferred.length ? preferred.slice(0, 4) : sortedMaterials.slice(0, 4);
  }, [sortedMaterials, userDepartment, userSemester]);

  const toggleBookmark = (materialId) => {
    const next = bookmarkedIds.includes(materialId)
      ? bookmarkedIds.filter((id) => id !== materialId)
      : [...bookmarkedIds, materialId];
    setBookmarkedIds(next);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  };

  const recordDownload = (material) => {
    const next = [
      { id: material.id, title: material.title, subject: material.subject, uploadedAt: material.uploadedAt || new Date().toISOString() },
      ...recentDownloads.filter((item) => item.id !== material.id),
    ].slice(0, 6);
    setRecentDownloads(next);
    localStorage.setItem(RECENT_DOWNLOADS_KEY, JSON.stringify(next));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-surface border border-brand-800 bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-200">Student dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Welcome back, {user?.name || 'student'}</h1>
              <p className="mt-3 max-w-2xl text-sm text-brand-100 sm:text-base">
                Stay on top of your study resources, discover what peers are sharing, and keep your favorite materials close at hand.
              </p>
            </div>
            <div className="rounded-surface border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-sm text-brand-200">Today</p>
              <p className="mt-1 text-lg font-semibold">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/upload" className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50">
              <Upload size={16} className="mr-2" />
              Upload material
            </Link>
            <Link to="/search" className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20">
              <Search size={16} className="mr-2" />
              Browse materials
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="glass-card rounded-surface p-4 transition hover:-translate-y-0.5 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.hint}</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${stat.tone}`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-surface rounded-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recent uploads</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Fresh materials from your community</h2>
              </div>
              <Link to="/search" className="inline-flex items-center text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                Explore all <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
              ) : isError ? (
                <div className="lg:col-span-2">
                  <EmptyState title="Unable to load" subtitle={error?.message || 'The dashboard could not fetch your study materials right now.'} action={<button onClick={() => refetch()} className="mt-4 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Try again</button>} />
                </div>
              ) : recentUploads.length === 0 ? (
                <div className="lg:col-span-2">
                  <EmptyState title="No uploads yet" subtitle="Be the first to share a useful resource with your peers." action={<Link to="/upload" className="mt-4 inline-flex rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Upload one</Link>} />
                </div>
              ) : (
                recentUploads.map((material) => (
                  <MaterialCard key={material.id} material={material} onDelete={() => refetch()} onDownload={recordDownload} />
                ))
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="glass-surface rounded-surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recent downloads</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">What you picked up lately</h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {recentDownloads.length === 0 ? (
                  <EmptyState title="No downloads yet" subtitle="Download a material to build your personal history here." />
                ) : recentDownloads.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-card border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/60">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.subject || 'Recently downloaded'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Clock3 size={14} />
                      {formatDate(item.uploadedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-surface rounded-surface p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Bookmarked materials</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Saved for later</h2>
                </div>
              </div>

              <div className="mt-5 flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible">
                {bookmarkedMaterials.length === 0 ? (
                  <div className="w-full lg:col-span-2">
                    <EmptyState title="No bookmarks yet" subtitle="Bookmark helpful materials to revisit them quickly." />
                  </div>
                ) : bookmarkedMaterials.map((material) => (
                  <div key={material.id} className="min-w-[220px] flex-1 rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 lg:min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{material.title}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.subject || 'Shared material'}</p>
                      </div>
                      <button onClick={() => toggleBookmark(material.id)} className="rounded-full p-2 text-amber-600 transition hover:bg-amber-100 dark:hover:bg-amber-950/40">
                        <Bookmark size={16} fill="currentColor" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>{material.category || 'Resource'}</span>
                      <span>{formatDate(material.uploadedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="glass-surface rounded-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recent activity</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Your learning feed</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles size={14} />
                Based on your materials
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {recentActivity.length === 0 ? (
                <EmptyState title="No activity yet" subtitle="The latest uploads and interactions will appear here soon." />
              ) : recentActivity.map((item, index) => (
                <div key={`${item.type}-${index}`} className="flex gap-3 rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className={`mt-0.5 rounded-2xl p-2 ${item.type === 'upload' ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : item.type === 'download' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : item.type === 'rating' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'}`}>
                    <item.icon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-surface rounded-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Recommended materials</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Tailored for your study path</h2>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
              ) : isError ? (
                <EmptyState title="Recommendation unavailable" subtitle="We could not load tailored suggestions right now." />
              ) : recommendedMaterials.length === 0 ? (
                <EmptyState title="No recommendations" subtitle="Try uploading or browsing more materials to create recommendations." />
              ) : recommendedMaterials.map((material) => (
                <div key={material.id} className="rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{material.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.subject || 'Recommended resource'}</p>
                    </div>
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                      {material.category || 'Resource'}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>{formatDate(material.uploadedAt)}</span>
                    <span>{material.downloadCount || 0} downloads</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
