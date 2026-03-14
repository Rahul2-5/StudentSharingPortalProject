import React from 'react';
import {
  FileText, ClipboardList, BookMarked, BookOpen, File,
  Download, Trash2, Calendar, User
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TYPE_CONFIG = {
  NOTES:        { label: 'Notes',       icon: FileText,     className: 'notes',      badge: 'badge-purple' },
  ASSIGNMENT:   { label: 'Assignment',  icon: ClipboardList, className: 'assignment', badge: 'badge-yellow' },
  PAST_PAPER:   { label: 'Past Paper',  icon: BookMarked,   className: 'past_paper', badge: 'badge-red' },
  REFERENCE_BOOK: { label: 'Reference', icon: BookOpen,     className: 'reference',  badge: 'badge-green' },
  OTHER:        { label: 'Other',       icon: File,         className: 'other',      badge: 'badge-blue' },
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

const MaterialCard = ({ material, onDelete, showActions = true }) => {
  const { user } = useAuth();
  const config = TYPE_CONFIG[material.materialType] || TYPE_CONFIG.OTHER;
  const IconComponent = config.icon;
  const isOwner = user?.userId === material.uploaderId;

  const handleDownload = async () => {
    try {
      const response = await api.get(`/api/materials/download/${material.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', material.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloading "${material.title}"`);
    } catch (err) {
      toast.error('Download failed. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${material.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/materials/${material.id}`);
      toast.success('Material deleted');
      onDelete?.(material.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="material-card fade-in">
      <div className="material-card-header">
        <div className={`material-icon ${config.className}`}>
          <IconComponent size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="material-title">{material.title}</div>
          {material.subject && (
            <div className="material-subject">{material.subject}</div>
          )}
        </div>
      </div>

      {material.description && (
        <div className="material-desc">{material.description}</div>
      )}

      <div className="material-meta">
        <span className={`badge ${config.badge}`}>
          <IconComponent size={11} />
          {config.label}
        </span>
        {material.semester && (
          <span className="badge badge-blue">Sem {material.semester}</span>
        )}
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {formatFileSize(material.fileSize)}
        </span>
      </div>

      <div className="material-footer">
        <div className="material-uploader">
          <User size={12} />
          <span>{material.uploaderName}</span>
          <span style={{ margin: '0 4px' }}>·</span>
          <Calendar size={12} />
          <span>{formatDate(material.uploadedAt)}</span>
          <span style={{ margin: '0 4px' }}>·</span>
          <Download size={12} />
          <span>{material.downloadCount}</span>
        </div>
        {showActions && (
          <div className="material-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleDownload}>
              <Download size={14} />
              Download
            </button>
            {isOwner && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialCard;
