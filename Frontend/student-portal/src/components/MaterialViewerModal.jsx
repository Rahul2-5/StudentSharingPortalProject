import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, Download, FileText, Loader2, Maximize2, Minimize2, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const getViewType = (material) => {
  const type = (material?.fileType || '').toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('image')) return 'image';
  return 'other';
};

const MaterialViewerModal = ({ material, onClose }) => {
  const viewType = getViewType(material);
  const viewable = viewType === 'pdf' || viewType === 'image';
  const viewerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(Boolean(material.aiSummary));
  const [summary, setSummary] = useState(material.aiSummary || '');

  const { data: previewBlob, isLoading, isError } = useQuery({
    queryKey: ['material-preview', material.id],
    queryFn: async () => {
      const response = await api.get(`/api/materials/preview/${material.id}`, { responseType: 'blob' });
      return response.data;
    },
    enabled: viewable,
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

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/materials/${material.id}/summarize`);
      return response.data;
    },
    onSuccess: (data) => {
      setSummary(data.aiSummary || 'No summary was returned for this material.');
      setSummaryOpen(true);
      toast.success('AI summary ready.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Unable to generate an AI summary right now.');
    },
  });

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/materials/download/${material.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material.fileName || 'material');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await viewerRef.current?.requestFullscreen();
      }
    } catch {
      toast.error('Fullscreen mode is not available in this browser.');
    }
  };

  const handleClose = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Viewing ${material.title}`}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={handleClose} />

      <div ref={viewerRef} className={`glass-surface relative flex w-full flex-col overflow-hidden shadow-2xl ${isFullscreen ? 'h-screen rounded-none' : 'h-[88vh] max-w-5xl rounded-surface'}`}>
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <FileText className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{material.title}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{material.fileName || material.fileType}</p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-control border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSummaryOpen((open) => !open);
              if (!summary && !summaryMutation.isLoading) summaryMutation.mutate();
            }}
            disabled={summaryMutation.isLoading}
            className={`inline-flex items-center gap-1.5 rounded-control border px-3 py-1.5 text-xs font-semibold shadow-sm transition disabled:cursor-wait disabled:opacity-70 ${summaryOpen ? 'border-ai-500 bg-ai-600 text-white shadow-ai-500/25 hover:bg-ai-700 dark:border-ai-400 dark:bg-ai-500 dark:hover:bg-ai-400' : 'border-ai-200 bg-ai-50 text-ai-700 hover:border-ai-400 hover:bg-ai-100 dark:border-ai-800 dark:bg-ai-950/40 dark:text-ai-300 dark:hover:border-ai-600 dark:hover:bg-ai-950/70'}`}
            aria-expanded={summaryOpen}
          >
            {summaryMutation.isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{summaryMutation.isLoading ? 'Summarizing' : 'AI Summary'}</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close viewer"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {summaryOpen && (
          <section className="max-h-56 shrink-0 overflow-y-auto border-b border-ai-100 bg-ai-50/70 px-5 py-4 dark:border-ai-900/40 dark:bg-ai-950/20" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-ai-100 text-ai-600 dark:bg-ai-950/60 dark:text-ai-300">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">AI summary</h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Verify before relying on it</span>
                </div>
                {summaryMutation.isLoading ? (
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-ai-100 dark:bg-ai-950/50" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-ai-100 dark:bg-ai-950/50" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-ai-100 dark:bg-ai-950/50" />
                  </div>
                ) : summaryMutation.isError ? (
                  <div className="mt-3 rounded-control border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm leading-5 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {summaryMutation.error?.response?.data?.error || 'The AI service could not generate a summary. Check the backend AI configuration and try again.'}
                    <button type="button" onClick={() => summaryMutation.mutate()} className="ml-2 font-semibold underline underline-offset-2">
                      Try again
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {summary || 'Select AI Summary to generate a concise overview of this material.'}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
          {!viewable ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-500 dark:text-slate-400">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <p className="text-sm">This file type can&apos;t be previewed in the browser. Download it to view.</p>
              <button type="button" onClick={handleDownload} className="rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                Download
              </button>
            </div>
          ) : isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
              <p className="text-sm">Loading document…</p>
            </div>
          ) : isError || !previewUrl ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-slate-500 dark:text-slate-400">
              <AlertCircle className="h-10 w-10 text-amber-500" />
              <p className="text-sm">Couldn&apos;t load the document. Try downloading it instead.</p>
              <button type="button" onClick={handleDownload} className="rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
                Download
              </button>
            </div>
          ) : viewType === 'pdf' ? (
            <iframe title={`Preview of ${material.title}`} src={previewUrl} className="h-full w-full" />
          ) : (
            <div className="flex min-h-full items-center justify-center p-4">
              <img src={previewUrl} alt={`Preview of ${material.title}`} className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MaterialViewerModal;
