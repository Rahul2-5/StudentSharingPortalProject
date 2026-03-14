import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingMaterials, setPendingMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const fetchPending = async () => {
    try {
      const res = await api.get('/api/admin/materials/pending');
      setPendingMaterials(res.data);
    } catch (err) {
      toast.error('Failed to load pending materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/api/admin/materials/${id}/status?status=${status}`);
      toast.success(`Material ${status.toLowerCase()} successfully`);
      setPendingMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      toast.error(`Failed to ${status.toLowerCase()} material`);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={32} color="var(--primary)" />
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Admin Dashboard</h1>
            <p className="page-subtitle" style={{ margin: 0, marginTop: '4px' }}>Review and approve pending study materials</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : pendingMaterials.length === 0 ? (
        <div className="empty-state card">
          <CheckCircle size={48} color="var(--success-color)" />
          <h3>All caught up!</h3>
          <p>There are no pending materials waiting for approval.</p>
        </div>
      ) : (
        <div className="materials-grid">
          {pendingMaterials.map(material => (
            <div key={material.id} style={{ position: 'relative' }}>
              <MaterialCard material={material} hideDownload={true} />
              
              {/* Admin Action Overlay */}
              <div style={{ 
                position: 'absolute', bottom: '16px', left: '16px', right: '16px', 
                display: 'flex', gap: '8px', zIndex: 10,
                background: 'rgba(20,20,20,0.9)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                backdropFilter: 'blur(4px)'
              }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px', background: 'var(--success-color)' }}
                  onClick={() => handleStatusUpdate(material.id, 'APPROVED')}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px', color: '#ff4444', borderColor: '#ff4444' }}
                  onClick={() => handleStatusUpdate(material.id, 'REJECTED')}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
