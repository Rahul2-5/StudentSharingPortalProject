import React from 'react';
import { AlertCircle, Loader2, Search } from 'lucide-react';

export const LoadingState = ({ count = 3, className = 'grid gap-4 md:grid-cols-2 2xl:grid-cols-3' }) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-surface border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-4 h-10 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    ))}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', message = 'Please try again in a moment.', onRetry, actionLabel = 'Retry' }) => (
  <div className="rounded-surface border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
      <AlertCircle size={20} />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-rose-800 dark:text-rose-300">{title}</h3>
    <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{message}</p>
    {onRetry ? (
      <button type="button" onClick={onRetry} className="mt-4 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700">
        {actionLabel}
      </button>
    ) : null}
  </div>
);

export const EmptyState = ({ title, subtitle, action, iconClassName = 'text-brand-600 dark:text-brand-400' }) => (
  <div className="rounded-surface border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/60">
    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40 ${iconClassName}`}>
      <Search size={20} />
    </div>
    <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{title}</p>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
    {action}
  </div>
);

export const InlineSpinner = () => (
  <div className="flex items-center justify-center py-6">
    <Loader2 className="h-6 w-6 animate-spin text-brand-600 dark:text-brand-400" />
  </div>
);

export const FullscreenSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
    <Loader2 className="h-9 w-9 animate-spin text-brand-600 dark:text-brand-400" />
  </div>
);
