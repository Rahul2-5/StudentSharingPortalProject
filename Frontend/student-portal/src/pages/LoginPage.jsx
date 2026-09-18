import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { BookOpen, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post('/api/auth/login', {
        email: values.email,
        password: values.password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      login(data);
      toast.success(`Welcome back, ${data.name || 'student'}!`);
      navigate(data.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Unable to sign in right now.');
    },
  });

  const onSubmit = (values) => {
    mutation.mutate(values);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Preparing your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_55%)] px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="glass-surface w-full max-w-xl rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Student Sharing Portal</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Academic materials, built for collaboration</p>
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Sign in to access your dashboard and study resources.</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full rounded-2xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.email ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email ? <p className="mt-2 text-sm text-rose-500">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`w-full rounded-2xl border bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p> : null}
            </div>

            <div className="flex items-center justify-end gap-2 text-sm text-slate-500 dark:text-slate-400">
              <ShieldCheck size={16} className="text-emerald-500" />
              Secure sign-in
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
