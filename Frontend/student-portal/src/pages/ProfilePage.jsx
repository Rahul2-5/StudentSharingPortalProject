import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Building, Hash, FileText, Download } from 'lucide-react';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';

const ProfilePage = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyUploads = async () => {
      try {
        const res = await api.get('/api/materials/my');
        setUploads(res.data);
      } catch (err) {
        // Silent error
      } finally {
        setLoading(false);
      }
    };
    fetchMyUploads();
  }, []);

  const totalDownloads = uploads.reduce((sum, item) => sum + item.downloadCount, 0);

  const handleDelete = (id) => {
    setUploads(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="page-container fade-in">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="profile-name">{user?.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="badge badge-purple">{user?.role}</span>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              <Mail size={14} />
              {user?.email}
            </div>
          </div>
          <div className="flex gap-4 mt-4" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {user?.college && (
              <div className="flex items-center gap-2">
                <Building size={16} />
                {user.college}
              </div>
            )}
            {user?.semester && (
              <div className="flex items-center gap-2">
                <Hash size={16} />
                Semester {user.semester}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{uploads.length}</span>
            <span className="stat-label">Uploads</span>
          </div>
          <div className="stat-item" style={{ marginLeft: 16 }}>
            <span className="stat-value">{totalDownloads}</span>
            <span className="stat-label">Total Downloads</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
          My Contributions
        </h2>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : uploads.length === 0 ? (
          <div className="empty-state card">
            <FileText size={48} />
            <h3>No uploads yet</h3>
            <p>You haven't shared any study materials with the community.</p>
          </div>
        ) : (
          <div className="materials-grid">
            {uploads.map(material => (
              <MaterialCard key={material.id} material={material} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
