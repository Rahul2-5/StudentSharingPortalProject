import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutGrid,
  Search,
  Sparkles,
  Upload,
  Users,
  ShieldCheck,
  BrainCircuit,
  CheckCircle2,
} from 'lucide-react';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';

const categories = [
  { title: 'Notes', description: 'Concise study notes and handouts', icon: FileText },
  { title: 'Previous Year Papers', description: 'Exam-ready question papers', icon: FolderOpen },
  { title: 'Assignments', description: 'Reference solutions and templates', icon: LayoutGrid },
  { title: 'Lab Manuals', description: 'Practical guides and experiments', icon: BookOpen },
  { title: 'Presentations', description: 'Slides for class and revision', icon: GraduationCap },
];

const benefits = [
  {
    title: 'Easy Search',
    description: 'Find the right resource in seconds with keyword search and smart filters.',
    icon: Search,
  },
  {
    title: 'Secure Uploads',
    description: 'Share materials confidently with protected uploads and authenticated access.',
    icon: ShieldCheck,
  },
  {
    title: 'AI Summaries',
    description: 'Get concise summaries that help you review faster and study smarter.',
    icon: BrainCircuit,
  },
  {
    title: 'Verified Study Materials',
    description: 'Discover trusted notes and resources approved by the student community.',
    icon: CheckCircle2,
  },
];

const stats = [
  { label: 'Total Materials', value: '1.2K+' },
  { label: 'Total Downloads', value: '24K+' },
  { label: 'Active Students', value: '4.8K' },
  { label: 'Subjects', value: '180+' },
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const { data: featuredMaterials = [], isLoading: featuredLoading, isError: featuredError } = useQuery({
    queryKey: ['landing-featured-materials'],
    queryFn: async () => {
      const response = await api.get('/api/materials');
      const items = Array.isArray(response.data) ? response.data : [];
      return items.slice(0, 4);
    },
    staleTime: 60000,
  });

  const { data: searchResults = [], isFetching: searchLoading, isError: searchError } = useQuery({
    queryKey: ['landing-search-results', submittedQuery],
    queryFn: async () => {
      const response = await api.get('/api/materials', { params: { keyword: submittedQuery } });
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: Boolean(submittedQuery),
    staleTime: 30000,
  });

  const heroStats = useMemo(() => [
    { label: 'Curated resources', value: '500+' },
    { label: 'Daily learners', value: '2K+' },
  ], []);

  const handleSearch = (event) => {
    event.preventDefault();
    setSubmittedQuery(searchValue.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar onMenuClick={() => undefined} />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="glass-surface overflow-hidden rounded-surface shadow-[0_25px_80px_-30px_rgba(15,23,42,0.35)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-12">
            <div className="flex flex-col justify-center">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300">
                <Sparkles size={16} />
                Smart academic sharing platform
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                Discover, share, and learn from the best study resources.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                A modern hub for notes, assignments, lab manuals, and previous-year papers curated for students and educators.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  Browse Materials
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                {isAuthenticated ? (
                  <Link
                    to="/upload"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Material
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    Join the Community
                  </Link>
                )}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {heroStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/70">
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-surface border border-slate-200 bg-gradient-to-br from-brand-600 via-violet-600 to-sky-500 p-6 text-white shadow-lg dark:border-slate-700">
              <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <div>
                  <p className="text-sm font-medium text-brand-100">Today’s focus</p>
                  <p className="mt-1 text-xl font-semibold">Find study material faster</p>
                </div>
                <div className="rounded-2xl bg-white/15 p-3">
                  <Search size={20} />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/20 bg-slate-950/20 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-100">Search the library</p>
                <div className="mt-4 rounded-2xl border border-white/20 bg-white/90 p-3 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Search size={17} />
                    <span className="text-sm font-medium">Search notes, papers, and assignments</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold">AI summaries</p>
                  <p className="mt-1 text-sm text-brand-100">Jump into key takeaways instantly.</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold">Community driven</p>
                  <p className="mt-1 text-sm text-brand-100">Upload and discover trusted content.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Find resources</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Search your next study material</h2>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-6 rounded-surface border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <Search className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search by title, subject, or category"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Search now
              </button>
            </div>
          </form>

          {submittedQuery ? (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Search results for “{submittedQuery}”</h3>
                <span className="text-sm text-slate-500 dark:text-slate-400">{searchLoading ? 'Searching…' : `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}</span>
              </div>

              {searchLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/70">
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mt-2 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  Search could not be completed right now.
                </div>
              ) : searchResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
                  No materials matched your search yet. Try a broader keyword.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {searchResults.map((material) => (
                    <MaterialCard key={material.id} material={material} showActions={false} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Browse by type</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Popular categories</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{category.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{category.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-surface border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-3xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Featured materials</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Most recently shared</h2>
            </div>
            <Link to="/dashboard" className="text-sm font-semibold text-brand-600 transition hover:text-brand-700">
              Explore all resources →
            </Link>
          </div>

          {featuredLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/70">
                  <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : featuredError ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Featured materials are unavailable right now. Please try again shortly.
            </div>
          ) : featuredMaterials.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
              No featured materials are available yet. Be the first to upload one.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featuredMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} showActions={false} />
              ))}
            </div>
          )}
        </section>

        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Why this portal</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Built for focused academic success</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/70">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
