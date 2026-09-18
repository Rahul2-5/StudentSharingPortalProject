import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Bookmark,
  Calendar,
  Download,
  Loader2,
  Monitor,
  Share2,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';
import MainLayout from '../layouts/MainLayout';

const BOOKMARKS_KEY = 'dashboard_bookmarks';

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown date';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getPreview = (material) => {
  const fileType = material?.fileType?.toLowerCase() || '';
  if (fileType.includes('image')) {
    return 'image';
  }
  if (fileType.includes('pdf')) {
    return 'pdf';
  }
  return 'generic';
};

const readBookmarks = () => {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
  } catch {
    return [];
  }
};

const MaterialDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showSummary, setShowSummary] = useState(false);
  const [rating, setRating] = useState(0);
  const [bookmarked, setBookmarked] = useState(() => readBookmarks().includes(Number(id)));

  const { data: material, isLoading, isError, refetch } = useQuery({
    queryKey: ['material-detail', id],
    queryFn: async () => {
      const response = await api.get(`/api/materials/${id}`);
      return response.data;
    },
  });

  const { data: relatedMaterials = [] } = useQuery({
    queryKey: ['related-materials', id],
    queryFn: async () => {
      const response = await api.get('/api/materials');
      const items = Array.isArray(response.data) ? response.data : [];
      return items.filter((item) => item.id !== Number(id)).slice(0, 4);
    },
  });

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/materials/${id}/summarize`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['material-detail', id], (current) => current ? { ...current, aiSummary: data.aiSummary } : current);
      toast.success('AI summary ready.');
    },
    onError: () => {
      toast.error('Unable to generate summary right now.');
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (score) => {
      const response = await api.post(`/api/materials/${id}/rate?score=${score}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['material-detail', id], (current) => current ? { ...current, averageRating: data.averageRating, ratingCount: data.ratingCount } : current);
      toast.success('Your rating has been saved.');
    },
    onError: () => {
      toast.error('Your rating could not be saved.');
    },
  });

  const previewType = useMemo(() => getPreview(material), [material]);
  const isPreviewable = previewType === 'pdf' || previewType === 'image';

  const {
    data: previewBlob,
    isLoading: previewLoading,
    isError: previewError,
  } = useQuery({
    queryKey: ['material-preview', id],
    queryFn: async () => {
      const response = await api.get(`/api/materials/preview/${id}`, { responseType: 'blob' });
      return response.data;
    },
    enabled: Boolean(id) && isPreviewable,
    staleTime: 5 * 60 * 1000,
  });

  const previewUrl = useMemo(
    () => (previewBlob ? window.URL.createObjectURL(previewBlob) : null),
    [previewBlob],
  );

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => window.URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/materials/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material?.fileName || 'material');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started.');
    } catch {
      toast.error('Download failed.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: material?.title, text: `Check out this material: ${material?.title}` });
        toast.success('Shared successfully.');
      } catch {
        toast.error('Sharing was cancelled.');
      }
      return;
    }

    navigator.clipboard?.writeText(window.location.href).then(() => toast.success('Link copied to clipboard.'));
  };

  const toggleBookmark = () => {
    const numericId = Number(id);
    const current = readBookmarks();
    const next = current.includes(numericId)
      ? current.filter((bookmarkId) => bookmarkId !== numericId)
      : [...current, numericId];
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    setBookmarked(next.includes(numericId));
    toast.success(next.includes(numericId) ? 'Bookmarked' : 'Removed from bookmarks');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="animate-pulse rounded-surface border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-3 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-6 h-40 rounded-surface bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-pulse rounded-surface border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            </div>
            <div className="animate-pulse rounded-surface border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError || !material) {
    return (
      <MainLayout>
        <div className="rounded-surface border border-amber-200 bg-amber-50 p-8 text-center shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
          <h2 className="mt-4 text-xl font-semibold text-amber-800 dark:text-amber-300">Material could not be loaded</h2>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">Please refresh or try again in a moment.</p>
          <button type="button" onClick={() => refetch()} className="mt-4 rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700">
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Link to="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
          <ArrowLeft size={16} />
          Back to search
        </Link>

        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                {material.category || 'Study Material'}
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">{material.title}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-400">{material.description || 'Explore this resource and discover the details behind it.'}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                {material.subject ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{material.subject}</span> : null}
                {material.department ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{material.department}</span> : null}
                {material.semester ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">Semester {material.semester}</span> : null}
                {material.fileType ? <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{material.fileType}</span> : null}
              </div>
            </div>

            <div className="rounded-surface border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <div className="flex items-center gap-2"><User size={16} className="text-brand-600 dark:text-brand-400" /> <span className="font-semibold text-slate-900 dark:text-white">{material.uploaderName || 'Community uploader'}</span></div>
              <div className="mt-3 flex items-center gap-2"><Calendar size={16} className="text-brand-600 dark:text-brand-400" /> {formatDate(material.uploadedAt)}</div>
              <div className="mt-2 flex items-center gap-2"><Download size={16} className="text-brand-600 dark:text-brand-400" /> {material.downloadCount || 0} downloads</div>
              <div className="mt-2 flex items-center gap-2"><BookOpen size={16} className="text-brand-600 dark:text-brand-400" /> {formatFileSize(material.fileSize)}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-surface border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preview</h2>
                <span className="rounded-full bg-white px-3 py-1 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">{material.fileType || 'File'}</span>
              </div>

              <div className="mt-4 overflow-hidden rounded-card border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {!isPreviewable ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center text-slate-500 dark:text-slate-400">
                    <Monitor className="h-12 w-12" />
                    <p className="mt-3 text-sm">Inline preview isn&apos;t available for this file type.</p>
                    <button type="button" onClick={handleDownload} className="mt-4 inline-flex items-center rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                      <Download size={15} className="mr-2" />
                      Download to view
                    </button>
                  </div>
                ) : previewLoading ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
                    <p className="mt-3 text-sm">Loading preview…</p>
                  </div>
                ) : previewError || !previewUrl ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center px-4 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="h-10 w-10 text-amber-500" />
                    <p className="mt-3 text-sm">Preview couldn&apos;t be loaded. You can still download the file.</p>
                  </div>
                ) : previewType === 'pdf' ? (
                  <iframe
                    title={`Preview of ${material.title}`}
                    src={previewUrl}
                    className="h-[70vh] min-h-[420px] w-full"
                  />
                ) : (
                  <div className="flex min-h-[240px] items-center justify-center bg-slate-50 p-3 dark:bg-slate-950">
                    <img
                      src={previewUrl}
                      alt={`Preview of ${material.title}`}
                      className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
            <div className="glass-card rounded-surface p-5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Actions</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={handleDownload} className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
                    <Download size={16} className="mr-2" />
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={toggleBookmark}
                    className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      bookmarked
                        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400'
                    }`}
                  >
                    <Bookmark size={16} className="mr-2" fill={bookmarked ? 'currentColor' : 'none'} />
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button type="button" onClick={handleShare} className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400 sm:col-span-2">
                    <Share2 size={16} className="mr-2" />
                    Share
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-surface p-5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ratings</h2>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-3xl font-semibold text-slate-900 dark:text-white">{material.averageRating ? material.averageRating.toFixed(1) : '0.0'}</div>
                  <div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} className={star <= (rating || material.averageRating || 0) ? 'fill-current' : ''} />
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{material.ratingCount || 0} ratings</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`} onClick={() => { setRating(star); rateMutation.mutate(star); }} className="text-amber-400 transition hover:scale-110">
                      <Star size={18} className={star <= rating ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-surface border border-ai-100 bg-ai-50/60 p-6 shadow-sm dark:border-ai-900/40 dark:bg-ai-950/10 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ai-100 text-ai-600 dark:bg-ai-950/50 dark:text-ai-400">
                <Sparkles size={16} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">AI summary</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">AI-generated — verify before relying on it</p>
              </div>
            </div>
            <button
              type="button"
              disabled={summaryMutation.isPending}
              onClick={() => summaryMutation.mutate()}
              className="text-sm font-semibold text-ai-600 transition hover:text-ai-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-ai-400 dark:hover:text-ai-300"
            >
              {summaryMutation.isPending ? 'Generating…' : 'Generate summary'}
            </button>
          </div>
          <div className="mt-5 rounded-surface border border-ai-100 bg-white p-5 dark:border-ai-900/40 dark:bg-slate-900">
            {summaryMutation.isPending ? (
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-ai-100 dark:bg-ai-950/40" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-ai-100 dark:bg-ai-950/40" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-ai-100 dark:bg-ai-950/40" />
              </div>
            ) : material.aiSummary ? (
              <>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">{showSummary ? material.aiSummary : `${material.aiSummary.slice(0, 240)}${material.aiSummary.length > 240 ? '…' : ''}`}</p>
                <div className="mt-4 flex items-center justify-between">
                  {material.aiSummary.length > 240 ? (
                    <button type="button" onClick={() => setShowSummary((value) => !value)} className="text-sm font-semibold text-ai-600 transition hover:text-ai-700 dark:text-ai-400 dark:hover:text-ai-300">
                      {showSummary ? 'Show less' : 'Read more'}
                    </button>
                  ) : <span />}
                  {material.aiSummaryGeneratedAt ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Generated {formatDate(material.aiSummaryGeneratedAt)}</span>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-400">No summary is available yet. Generate one to get a quick overview of this material.</p>
            )}
          </div>
        </section>

        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Related materials</h2>
            <Link to="/search" className="text-sm font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">View all</Link>
          </div>

          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
            {relatedMaterials.map((item) => (
              <div key={item.id} className="min-w-[280px] flex-1 lg:min-w-0">
                <MaterialCard material={item} showActions={false} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default MaterialDetailPage;
