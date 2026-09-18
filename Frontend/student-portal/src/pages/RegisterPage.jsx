import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Book, BookOpen, Building, Eye, EyeOff, Hash, Loader2, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    program: z.string().min(1, 'Please select your program'),
    otherProgram: z.string().optional(),
    college: z.string().optional(),
    semester: z.string().optional(),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Passwords do not match',
      });
    }

    if (values.program === 'Other' && !values.otherProgram?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherProgram'],
        message: 'Please specify your program',
      });
    }
  });

const getPasswordStrength = (password) => {
  if (!password) {
    return { label: 'Enter a password', color: 'bg-slate-200', width: 'w-0' };
  }

  const checks = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const score = checks.filter((pattern) => pattern.test(password)).length;

  if (score <= 1) {
    return { label: 'Weak', color: 'bg-rose-500', width: 'w-1/4' };
  }
  if (score === 2) {
    return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
  }
  if (score === 3) {
    return { label: 'Good', color: 'bg-sky-500', width: 'w-3/4' };
  }
  return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      program: '',
      otherProgram: '',
      college: '',
      semester: '',
    },
  });

  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });
  const passwordStrength = getPasswordStrength(passwordValue);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const mutation = useMutation({
    mutationFn: async (values) => {
      const payload = {
        name: values.name,
        email: values.email,
        password: values.password,
        program: values.program === 'Other' ? values.otherProgram.trim() : values.program,
        college: values.college || '',
        semester: values.semester ? Number(values.semester) : null,
      };

      const response = await api.post('/api/auth/register', payload);
      return response.data;
    },
    onSuccess: (data) => {
      login(data);
      toast.success(`Account ready, ${data.name || 'student'}!`);
      navigate('/dashboard', { replace: true });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
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
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Preparing your account workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_55%)] px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="glass-surface w-full max-w-3xl rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <BookOpen size={22} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Create your account</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Join the student community and start sharing resources.</p>
            </div>
          </div>

          <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="Rahul Sharma"
                  className={`w-full rounded-2xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'
                  }`}
                  {...register('name')}
                />
              </div>
              {errors.name ? <p className="mt-2 text-sm text-rose-500">{errors.name.message}</p> : null}
            </div>

            <div className="md:col-span-2">
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
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  className={`w-full rounded-2xl border bg-white py-3 pr-12 pl-4 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
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
              <div className="mt-2">
                <div className={`h-2 rounded-full ${passwordStrength.color}`} />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Strength: {passwordStrength.label}</p>
              </div>
              {errors.password ? <p className="mt-2 text-sm text-rose-500">{errors.password.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className={`w-full rounded-2xl border bg-white py-3 pr-12 pl-4 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'
                  }`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword ? <p className="mt-2 text-sm text-rose-500">{errors.confirmPassword.message}</p> : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="program">
                Program
              </label>
              <div className="relative">
                <Book className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="program"
                  className={`w-full rounded-2xl border bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                    errors.program ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'
                  }`}
                  {...register('program')}
                >
                  <option value="">Select your program</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="BBA">BBA</option>
                  <option value="MBA">MBA</option>
                  <option value="B.Com">B.Com</option>
                  <option value="M.Com">M.Com</option>
                  <option value="B.A">B.A</option>
                  <option value="M.A">M.A</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {errors.program ? <p className="mt-2 text-sm text-rose-500">{errors.program.message}</p> : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="otherProgram">
                Specify program
              </label>
              <input
                id="otherProgram"
                placeholder="For example, PhD or B.LIS"
                className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${
                  errors.otherProgram ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'
                }`}
                {...register('otherProgram')}
              />
              {errors.otherProgram ? <p className="mt-2 text-sm text-rose-500">{errors.otherProgram.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="college">
                College (optional)
              </label>
              <div className="relative">
                <Building className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="college"
                  placeholder="ABC College"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  {...register('college')}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="semester">
                Semester (optional)
              </label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="semester"
                  type="number"
                  min="1"
                  max="8"
                  placeholder="3"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  {...register('semester')}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex w-full items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
