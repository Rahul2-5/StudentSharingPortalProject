import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Loader2,
  Monitor,
  UploadCloud,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import MainLayout from '../layouts/MainLayout';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];

const uploadSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  subject: z.string().optional(),
  department: z.string().optional(),
  semester: z.string().optional(),
  category: z.string().min(1, 'Please choose a category'),
  tags: z.string().optional(),
});

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (file) => {
  if (!file) return FileText;
  const type = file.type?.toLowerCase() || '';
  if (type.includes('image')) return ImageIcon;
  if (type.includes('pdf')) return FileText;
  if (type.includes('powerpoint') || type.includes('presentation')) return Monitor;
  return FileText;
};

const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [validationError, setValidationError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      department: '',
      semester: '',
      category: 'PDF',
      tags: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', values.title);
      formData.append('category', values.category);
      if (values.description) formData.append('description', values.description);
      if (values.subject) formData.append('subject', values.subject);
      if (values.department) formData.append('department', values.department);
      if (values.semester) formData.append('semester', values.semester);
      if (values.tags) formData.append('tags', values.tags);

      const response = await api.post('/api/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / (event.total || 1));
          setUploadProgress(percent);
          setUploadStatus(percent === 100 ? 'Finishing up…' : 'Uploading…');
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setUploadStatus('Uploaded');
      setSuccessData(data);
      ['dashboard-materials', 'profile-uploads', 'search-materials', 'admin-materials', 'admin-pending-materials', 'landing-featured-materials'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      toast.success('Material uploaded successfully.');
    },
    onError: (error) => {
      setUploadStatus('Failed');
      setUploadProgress(0);
      toast.error(error.response?.data?.error || 'Upload failed. Please try again.');
    },
  });

  const previewIcon = useMemo(() => getFileIcon(file), [file]);

  const fileType = file?.type?.toLowerCase() || '';
  const isImage = fileType.includes('image');
  const isPdf = fileType.includes('pdf');
  const localPreviewUrl = useMemo(
    () => (file && (isImage || isPdf) ? window.URL.createObjectURL(file) : null),
    [file, isImage, isPdf],
  );

  useEffect(() => {
    if (!localPreviewUrl) return undefined;
    return () => window.URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  const validateAndSetFile = (selectedFile) => {
    setValidationError('');
    if (!selectedFile) return;
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setValidationError('Only PDF, image, and presentation files are supported.');
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setValidationError('File size cannot exceed 20MB.');
      return;
    }
    setFile(selectedFile);
    if (!selectedFile.name) return;
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleFiles = (event) => {
    const inputFile = event.target.files?.[0];
    if (inputFile) validateAndSetFile(inputFile);
  };

  const onSubmit = (values) => {
    if (!file) {
      setValidationError('Please select a file to upload.');
      toast.error('Please select a file to upload.');
      return;
    }
    setUploadProgress(0);
    setUploadStatus('Preparing…');
    mutation.mutate(values);
  };

  const resetUpload = () => {
    setFile(null);
    setValidationError('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setSuccessData(null);
    reset();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="glass-surface rounded-surface p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-600">Upload module</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Share a new academic resource</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Drag and drop a file or browse from your device to add it to the library.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <div
                className={`rounded-surface border-2 border-dashed p-6 text-center transition ${dragActive ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60'}`}
                onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={(event) => { event.preventDefault(); setDragActive(false); }}
                onDrop={handleDrop}
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                  <UploadCloud size={26} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Drop your file here</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">PNG, JPG, PDF, and presentation files are supported. Max size is 20MB.</p>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-5 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                  Browse files
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFiles} accept=".pdf,.png,.jpg,.jpeg,.ppt,.pptx,.txt" />
              </div>

              {validationError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                </div>
              ) : null}

              {file ? (
                <div className="glass-card rounded-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                        {React.createElement(previewIcon, { size: 22 })}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{formatSize(file.size)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFile(null)} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>{uploadStatus}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-surface border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/60">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Preview</h3>
                <div className="mt-4 overflow-hidden rounded-card border border-dashed border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                  {isImage && localPreviewUrl ? (
                    <div className="flex min-h-[180px] items-center justify-center bg-slate-50 p-3 dark:bg-slate-950">
                      <img src={localPreviewUrl} alt={file?.name || 'Selected file'} className="max-h-[420px] w-auto max-w-full rounded-lg object-contain" />
                    </div>
                  ) : isPdf && localPreviewUrl ? (
                    <iframe title={file?.name || 'PDF preview'} src={localPreviewUrl} className="h-[480px] w-full" />
                  ) : file ? (
                    <div className="flex min-h-[180px] flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                      <Monitor className="mx-auto h-10 w-10" />
                      <p className="mt-3 text-sm">Preview isn&apos;t available for this file type.</p>
                    </div>
                  ) : (
                    <div className="flex min-h-[180px] flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                      <BookOpen className="mx-auto h-10 w-10" />
                      <p className="mt-3 text-sm">Select a file to see a preview.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form className="glass-surface rounded-surface p-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="title">Title</label>
                  <input id="title" placeholder="e.g. Operating Systems Unit 1 Notes" className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${errors.title ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'}`} {...register('title')} />
                  {errors.title ? <p className="mt-2 text-sm text-rose-500">{errors.title.message}</p> : null}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="description">Description</label>
                  <textarea id="description" rows="3" placeholder="Share what learners will find in this resource" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" {...register('description')} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="subject">Subject</label>
                  <input id="subject" placeholder="Computer Networks" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" {...register('subject')} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="department">Department</label>
                  <input id="department" placeholder="Computer Science" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" {...register('department')} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="semester">Semester</label>
                  <input id="semester" type="number" min="1" max="8" placeholder="3" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" {...register('semester')} />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="category">Category</label>
                  <select id="category" className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition dark:bg-slate-800 dark:text-white ${errors.category ? 'border-rose-400' : 'border-slate-200 focus:border-brand-500 dark:border-slate-700'}`} {...register('category')}>
                    <option value="PDF">PDF</option>
                    <option value="IMAGE">Image</option>
                    <option value="PPT">PPT</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="tags">Tags</label>
                  <input id="tags" placeholder="notes, exam, revision" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" {...register('tags')} />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="submit" disabled={mutation.isPending || !file} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400">
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload material'
                  )}
                </button>
                <button type="button" onClick={resetUpload} className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400">
                  Clear form
                </button>
              </div>
            </form>
          </div>
        </section>

        {successData ? (
          <section className="rounded-surface border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400">Upload complete</p>
                <h2 className="mt-2 text-xl font-semibold text-emerald-900 dark:text-emerald-300">Your material is now live</h2>
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">You can upload another file or open the newly shared resource.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={resetUpload} className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-400">
                  Upload another
                </button>
                <button type="button" onClick={() => navigate(`/materials/${successData.id}`)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  View material
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default UploadPage;
