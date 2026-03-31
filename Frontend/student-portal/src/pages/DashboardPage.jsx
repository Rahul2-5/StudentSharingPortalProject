import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import MaterialCard from '../components/MaterialCard';

const DashboardPage = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ keyword: '', semester: '', category: '' });
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(filters.keyword);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.keyword]);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (filters.semester) params.semester = filters.semester;
      if (filters.category) params.category = filters.category;

      const res = await api.get('/api/materials', { params });
      setMaterials(res.data);
    } catch (err) {
      setError('Failed to load study materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, filters.semester, filters.category]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleDelete = (id) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Explore Materials</h1>
        <p className="page-subtitle">Find notes, assignments, and past papers shared by your peers.</p>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <div className="search-input-wrap">
            <Search size={18} />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by title or subject..."
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Filter size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <select
                className="form-select"
                style={{ paddingLeft: 40, width: '150px' }}
                value={filters.semester}
                onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            <select
              className="form-select"
              style={{ width: '160px' }}
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              <option value="PDF">PDF</option>
              <option value="IMAGE">Image</option>
              <option value="PPT">PowerPoint</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button className="btn btn-primary mt-4" onClick={fetchMaterials}>Try Again</button>
          </div>
        ) : materials.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <h3>No materials found</h3>
            <p>We couldn't find any study materials matching your criteria.</p>
            {(filters.keyword || filters.semester || filters.category) && (
              <button
                className="btn btn-ghost mt-4"
                onClick={() => setFilters({ keyword: '', semester: '', category: '' })}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="materials-grid">
            {materials.map(material => (
              <MaterialCard key={material.id} material={material} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
