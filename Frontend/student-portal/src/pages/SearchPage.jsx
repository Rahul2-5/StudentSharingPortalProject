import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Filter, Search as SearchIcon, X } from 'lucide-react';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';
import MainLayout from '../layouts/MainLayout';

const semesterOptions = ['All Semesters', '1', '2', '3', '4', '5', '6', '7', '8'];
const categoryOptions = ['All Categories', 'PDF', 'IMAGE', 'PPT', 'OTHER'];

const buildQueryParams = (filters) => {
  const params = {};
  if (filters.keyword) params.keyword = filters.keyword;
  if (filters.semester && filters.semester !== 'All Semesters') params.semester = filters.semester;
  if (filters.category && filters.category !== 'All Categories') params.category = filters.category;
  return params;
};

const SearchPage = () => {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [filters, setFilters] = useState({
    semester: 'All Semesters',
    category: 'All Categories',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const activeFilters = useMemo(() => {
    return Object.entries(filters).filter(([, value]) => value && value !== 'All Semesters' && value !== 'All Categories');
  }, [filters]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search-materials', debouncedKeyword, filters],
    queryFn: async () => {
      const response = await api.get('/api/materials', { params: buildQueryParams({ ...filters, keyword: debouncedKeyword }) });
      return response.data;
    },
    keepPreviousData: true,
  });

  const materials = Array.isArray(data) ? data : [];

  const clearFilters = () => {
    setKeyword('');
    setDebouncedKeyword('');
    setFilters({ semester: 'All Semesters', category: 'All Categories' });
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="glass-surface rounded-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Search library</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Find the perfect study resource</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Search notes, papers, assignments, and more by keyword.</p>
            </div>
          </div>

          <div className="mt-6 rounded-surface border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex flex-1 items-center rounded-card border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <SearchIcon className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Search by title, subject, or keyword"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
                {keyword ? (
                  <button type="button" onClick={() => setKeyword('')} className="ml-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                    <X size={16} />
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-card border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="glass-surface h-fit rounded-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Filter panel</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Refine your search</p>
              </div>
              <div className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Filter size={16} />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                { label: 'Semester', key: 'semester', options: semesterOptions },
                { label: 'Category', key: 'category', options: categoryOptions },
              ].map((item) => (
                <div key={item.key}>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{item.label}</label>
                  <select
                    value={filters[item.key]}
                    onChange={(event) => updateFilter(item.key, event.target.value)}
                    className="w-full rounded-card border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {item.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 w-full rounded-card border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400"
            >
              Reset filters
            </button>
          </aside>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.length > 0 ? (
                activeFilters.map(([key, value]) => (
                  <span key={`${key}-${value}`} className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300">
                    {value}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400">No active filters yet.</span>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-surface border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-2 h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-6 h-20 rounded-card bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-surface border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
                <AlertCircle className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
                <h3 className="mt-3 text-lg font-semibold text-amber-800 dark:text-amber-300">We hit a snag</h3>
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">Unable to load materials right now. Please retry.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 rounded-card bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Retry
                </button>
              </div>
            ) : materials.length === 0 ? (
              <div className="rounded-surface border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                  <SearchIcon size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No materials found</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Try another keyword or clear the filters to explore everything.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-card bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-500 dark:text-slate-400">Showing {materials.length} result{materials.length === 1 ? '' : 's'}</div>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {materials.map((material) => (
                    <MaterialCard key={material.id} material={material} showActions={false} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default SearchPage;
