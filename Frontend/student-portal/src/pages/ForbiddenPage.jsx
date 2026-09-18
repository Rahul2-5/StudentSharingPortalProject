import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const ForbiddenPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
      <ShieldAlert size={26} />
    </div>
    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">You don't have access to this page</h1>
    <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
      This area is restricted to administrators. If you think this is a mistake, contact your portal admin.
    </p>
    <Link
      to="/dashboard"
      className="mt-2 inline-flex items-center justify-center rounded-control bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      Back to dashboard
    </Link>
  </div>
);

export default ForbiddenPage;
