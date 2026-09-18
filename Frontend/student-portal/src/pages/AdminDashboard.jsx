import React, { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Filter,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';
import MaterialCard from '../components/MaterialCard';
import { useAuth } from '../context/AuthContext';

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

const AdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingSearch, setPendingSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialStatus, setMaterialStatus] = useState('ALL');
  const [materialSort, setMaterialSort] = useState('newest');
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('ALL');
  const isAdmin = user?.role === 'ADMIN';

  const { data: pendingMaterials = [], isLoading: pendingLoading, isError: pendingError, error: pendingErrorMessage, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-materials'],
    queryFn: async () => {
      const res = await api.get('/api/admin/materials/pending');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAdmin,
  });

  const { data: allMaterials = [], isLoading: materialsLoading, isError: materialsError, error: materialsErrorMessage, refetch: refetchMaterials } = useQuery({
    queryKey: ['admin-materials'],
    queryFn: async () => {
      const res = await api.get('/api/materials');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAdmin,
  });

  const { data: users = [], isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/api/admin/materials/users');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isAdmin,
    retry: false,
  });

  const filteredPending = useMemo(() => {
    const term = pendingSearch.toLowerCase();
    return pendingMaterials.filter((material) => {
      const matchesSearch = !term || `${material.title} ${material.subject || ''} ${material.description || ''}`.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [pendingMaterials, pendingSearch]);

  const filteredMaterials = useMemo(() => {
    const term = materialSearch.toLowerCase();
    const sorted = [...allMaterials].sort((a, b) => {
      if (materialSort === 'oldest') return new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0);
      return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0);
    });

    return sorted.filter((material) => {
      const matchesStatus = materialStatus === 'ALL' || (material.status || 'PENDING') === materialStatus;
      const matchesSearch = !term || `${material.title} ${material.subject || ''} ${material.uploaderName || ''}`.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [allMaterials, materialSearch, materialSort, materialStatus]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase();
    return users.filter((userItem) => {
      const matchesRole = userRole === 'ALL' || userItem.role === userRole;
      const matchesSearch = !term || `${userItem.name} ${userItem.email} ${userItem.department || ''}`.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [users, userRole, userSearch]);

  const overviewStats = useMemo(() => [
    { title: 'Total Users', value: usersError ? '—' : users.length, icon: Users, tone: 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' },
    { title: 'Total Materials', value: allMaterials.length, icon: FileText, tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300' },
    { title: 'Pending Approvals', value: pendingMaterials.length, icon: Clock3, tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    { title: 'Total Downloads', value: allMaterials.reduce((sum, material) => sum + Number(material.downloadCount || 0), 0), icon: Download, tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
  ], [allMaterials, pendingMaterials.length, users.length, usersError]);

  const analytics = useMemo(() => {
    const categoryCounts = allMaterials.reduce((acc, material) => {
      const category = material.category || 'OTHER';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      categoryCounts,
      topMaterials: [...allMaterials].sort((a, b) => Number(b.downloadCount || 0) - Number(a.downloadCount || 0)).slice(0, 5),
    };
  }, [allMaterials]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/admin/materials/${id}/status?status=${status}`);
      toast.success(`Material ${status.toLowerCase()} successfully`);
      queryClient.setQueryData(['admin-pending-materials'], (prev = []) => prev.filter((item) => item.id !== id));
      queryClient.setQueryData(['admin-materials'], (prev = []) => prev.map((item) => item.id === id ? { ...item, status } : item));
      refetchPending();
      refetchMaterials();
    } catch {
      toast.error(`Failed to ${status.toLowerCase()} material`);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-surface border border-slate-800 bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">
                <ShieldCheck size={14} />
                Admin console
              </div>
              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Moderate content and manage the student portal</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">Review pending uploads, supervise materials and keep the community experience healthy.</p>
            </div>
            <div className="rounded-surface border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-sm text-slate-300">Signed in as</p>
              <p className="mt-1 text-lg font-semibold">{user?.name || 'Administrator'}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewStats.map((stat) => (
          <div key={stat.title} className="glass-card rounded-surface p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${stat.tone}`}>
                  <stat.icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-surface rounded-surface p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Moderation queue</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Pending materials</h2>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <Search size={16} className="text-slate-400" />
                <input value={pendingSearch} onChange={(event) => setPendingSearch(event.target.value)} placeholder="Search pending" className="w-36 bg-transparent text-sm text-slate-900 outline-none dark:text-white" />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {pendingLoading ? (
                Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
              ) : pendingError ? (
                <EmptyState title="Unable to load" subtitle={pendingErrorMessage?.message || 'The moderation queue could not be loaded.'} action={<button onClick={() => refetchPending()} className="mt-4 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Retry</button>} />
              ) : filteredPending.length === 0 ? (
                <EmptyState title="All caught up" subtitle="There are no pending materials matching your search." />
              ) : filteredPending.map((material) => (
                <div key={material.id} className="rounded-surface border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{material.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.subject || 'Pending submission'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles[material.status] || statusStyles.PENDING}`}>
                      {material.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => handleStatusUpdate(material.id, 'APPROVED')} className="inline-flex items-center rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                      <CheckCircle2 size={16} className="mr-2" />
                      Approve
                    </button>
                    <button onClick={() => handleStatusUpdate(material.id, 'REJECTED')} className="inline-flex items-center rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
                      <XCircle size={16} className="mr-2" />
                      Reject
                    </button>
                  </div>
                  <div className="mt-4">
                    <MaterialCard material={material} showActions={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-surface border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Analytics</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Category distribution</h2>
                </div>
                <TrendingUp className="text-brand-600 dark:text-brand-400" size={18} />
              </div>
              <div className="mt-5 space-y-3">
                {Object.entries(analytics.categoryCounts).map(([name, value]) => (
                  <div key={name} className="flex items-center justify-between rounded-card border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800/60">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-surface border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Top materials</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Most downloaded</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {analytics.topMaterials.map((material) => (
                  <div key={material.id} className="rounded-card border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-900 dark:text-white">{material.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.downloadCount || 0} downloads</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-surface border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Material management</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">All uploaded materials</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <Search size={16} className="text-slate-400" />
                <input value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Search materials" className="w-40 bg-transparent text-sm text-slate-900 outline-none dark:text-white" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <Filter size={16} className="text-slate-400" />
                <select value={materialStatus} onChange={(event) => setMaterialStatus(event.target.value)} className="bg-transparent text-sm text-slate-900 outline-none dark:text-white">
                  <option value="ALL">All statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <select value={materialSort} onChange={(event) => setMaterialSort(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {materialsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}
              </div>
            ) : materialsError ? (
              <EmptyState title="Unable to load" subtitle={materialsErrorMessage?.message || 'Could not load materials.'} action={<button onClick={() => refetchMaterials()} className="mt-4 rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Retry</button>} />
            ) : filteredMaterials.length === 0 ? (
              <EmptyState title="No materials" subtitle="No materials match your filter criteria." />
            ) : (
              <div className="space-y-3">
                {filteredMaterials.map((material) => (
                  <div key={material.id} className="flex flex-col gap-3 rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{material.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.subject || 'Shared material'} · {material.uploaderName || 'Unknown uploader'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles[material.status] || statusStyles.PENDING}`}>
                        {material.status || 'PENDING'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{material.category || 'OTHER'}</span>
                      <Link to={`/materials/${material.id}`} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400">
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-surface border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">User management</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">Community members</h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <Search size={16} className="text-slate-400" />
                <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" className="w-40 bg-transparent text-sm text-slate-900 outline-none dark:text-white" />
              </div>
              <select value={userRole} onChange={(event) => setUserRole(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="ALL">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {usersLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)}
              </div>
            ) : usersError ? (
              <EmptyState
                title="Not available yet"
                subtitle="User management needs a backend endpoint that hasn't been built. This section will populate once it's added — no data is being fabricated here."
              />
            ) : filteredUsers.length === 0 ? (
              <EmptyState title="No users" subtitle="No account records match your search." />
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((userItem) => (
                  <div key={userItem.id} className="flex flex-col gap-3 rounded-card border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{userItem.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{userItem.email} · {userItem.department || 'Department not provided'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${userItem.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {userItem.status || 'ACTIVE'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{userItem.role}</span>
                      <button
                        type="button"
                        disabled
                        title="Not supported by the current backend yet"
                        className="cursor-not-allowed rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-400 opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                      >
                        {userItem.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
