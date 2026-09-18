import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Download, Trash2, Calendar, User, Star, Image as ImageIcon, Monitor, File, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import MaterialViewerModal from './MaterialViewerModal';

const TYPE_CONFIG = {
  PDF: { label: 'PDF', icon: FileText, badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  IMAGE: { label: 'Image', icon: ImageIcon, badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
  PPT: { label: 'PPT', icon: Monitor, badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  OTHER: { label: 'Other', icon: File, badge: 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300', iconBg: 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' },
};

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const MaterialCard = ({ material, onDelete, showActions = true, onDownload }) => {
  const { user } = useAuth();
  const config = TYPE_CONFIG[material.category] || TYPE_CONFIG.OTHER;
  const Icon = config.icon;

  const isOwner = user?.userId === material.uploaderId;
  const isAdmin = user?.role === 'ADMIN';
  const canDelete = isOwner || isAdmin;

  const [currentRating, setCurrentRating] = useState(material.averageRating || 0);
  const [ratingCount, setRatingCount] = useState(material.ratingCount || 0);
  const [hoverStar, setHoverStar] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleRate = async (score) => {
    if (isOwner) return toast.error("You can't rate your own document");
    try {
      const res = await api.post(`/api/materials/${material.id}/rate?score=${score}`);
      setCurrentRating(res.data.averageRating);
      setRatingCount(res.data.ratingCount);
      toast.success('Rating submitted');
    } catch {
      toast.error('Rating could not be submitted');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/materials/download/${material.id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      onDownload?.(material);
      toast.success(`Downloading "${material.title}"`);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/materials/${material.id}`);
      toast.success('Material deleted');
      onDelete?.(material.id);
    } catch {
      toast.error('Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="glass-card fade-in flex h-full flex-col gap-3 rounded-card p-5 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg dark:hover:border-brand-800">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${config.iconBg}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/materials/${material.id}`} className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400">
            {material.title}
          </Link>
          {material.subject && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{material.subject}</p>
          )}
        </div>
      </div>

      {material.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{material.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>
          <Icon size={11} />
          {config.label}
        </span>
        {material.semester && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Sem {material.semester}
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{formatFileSize(material.fileSize)}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverStar(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isOwner}
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
              onMouseEnter={() => !isOwner && setHoverStar(star)}
              onClick={() => handleRate(star)}
              className={`p-0.5 transition ${isOwner ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            >
              <Star
                size={15}
                className={(hoverStar || currentRating) >= star ? 'fill-amber-400 text-amber-400' : 'fill-none text-slate-300 dark:text-slate-600'}
              />
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {currentRating ? currentRating.toFixed(1) : '0.0'}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          ({ratingCount})
        </span>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex min-w-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <User size={12} className="shrink-0" />
          <span className="truncate">{material.uploaderName}</span>
          <span className="shrink-0">·</span>
          <Calendar size={12} className="shrink-0" />
          <span className="shrink-0">{formatDate(material.uploadedAt)}</span>
        </div>
        {showActions && (
          <div className="mt-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-control bg-brand-600 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              <Eye size={14} />
              View
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-control border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-800 dark:hover:text-brand-400"
            >
              <Download size={13} />
              Download
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label={isAdmin && !isOwner ? 'Delete material (admin)' : 'Delete material'}
                title={isAdmin && !isOwner ? 'Delete as admin' : 'Delete'}
                className="inline-flex items-center justify-center rounded-control border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {viewerOpen && <MaterialViewerModal material={material} onClose={() => setViewerOpen(false)} />}
    </div>
  );
};

export default MaterialCard;
