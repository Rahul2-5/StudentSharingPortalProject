import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';

const UploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'PDF', subject: '', semester: ''
  });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error('File size cannot exceed 20MB');
      return;
    }
    setFile(selectedFile);
    if (!form.title) {
      // Auto-fill title with original filename (without extension)
      const nameWithoutExt = selectedFile.name.split('.').slice(0, -1).join('.') || selectedFile.name;
      setForm(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file to upload');
    if (!form.title) return toast.error('Title is required');

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title);
    formData.append('category', form.category);
    if (form.description) formData.append('description', form.description);
    if (form.subject) formData.append('subject', form.subject);
    if (form.semester) formData.append('semester', form.semester);

    try {
      await api.post('/api/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Material uploaded successfully! 🚀');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container fade-in">
      <div className="page-header text-center" style={{ paddingBottom: '24px' }}>
        <h1 className="page-title">Upload Material</h1>
        <p className="page-subtitle">Share your knowledge with the student community.</p>
      </div>

      <div className="card">
        {!file ? (
          <div
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-icon">
              <UploadCloud size={32} />
            </div>
            <div className="dropzone-text">Click or drag file to this area to upload</div>
            <div className="dropzone-hint">Support for a single file upload. Maximum file size 20MB.</div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.jpeg,.png"
            />
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-preview-icon">
              <File size={32} />
            </div>
            <div className="file-preview-info">
              <div className="file-preview-name">{file.name}</div>
              <div className="file-preview-size">{formatSize(file.size)}</div>
            </div>
            <button className="btn btn-ghost" onClick={() => setFile(null)} title="Remove file">
              <X size={20} />
            </button>
          </div>
        )}

        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Material Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              placeholder="E.g., Operating Systems Unit 1 Notes"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                <option value="PDF">PDF Document</option>
                <option value="IMAGE">Image</option>
                <option value="PPT">PowerPoint (PPT)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Semester (Optional)</label>
              <input
                type="number"
                name="semester"
                className="form-input"
                value={form.semester}
                onChange={handleChange}
                min="1" max="8"
                placeholder="E.g., 3"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject Label (Optional)</label>
            <input
              type="text"
              name="subject"
              className="form-input"
              value={form.subject}
              onChange={handleChange}
              placeholder="E.g., Computer Networks"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Add some details about this material..."
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <button type="button" className="btn btn-secondary flex-1" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={!file || loading} style={{ flex: 2 }}>
              {loading ? 'Uploading...' : 'Upload to Portal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
