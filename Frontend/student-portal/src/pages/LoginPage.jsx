import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loginType, setLoginType] = useState('STUDENT');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      
      if (loginType === 'ADMIN' && res.data.role !== 'ADMIN') {
        setError('This account does not have Admin privileges.');
        setLoading(false);
        return;
      }
      
      if (loginType === 'STUDENT' && res.data.role === 'ADMIN') {
        setError('Please use the Admin login tab for administrative accounts.');
        setLoading(false);
        return;
      }

      login(res.data);
      toast.success(`Welcome back, ${res.data.name}! 🎉`);
      navigate(res.data.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <BookOpen size={22} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20 }}>StudyPortal</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to access your study materials</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--card-bg)', padding: '6px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button 
            type="button" 
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: loginType === 'STUDENT' ? 'var(--primary)' : 'transparent', color: loginType === 'STUDENT' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
            onClick={() => { setLoginType('STUDENT'); setError(''); }}
          >
            Student
          </button>
          <button 
            type="button" 
            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: loginType === 'ADMIN' ? 'var(--primary)' : 'transparent', color: loginType === 'ADMIN' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
            onClick={() => { setLoginType('ADMIN'); setError(''); if(!form.email) setForm({...form, email: 'admin@test.com'}); }}
          >
            Admin
          </button>
        </div>

        {error && <div className="text-error" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="email"
                name="email"
                className="form-input"
                style={{ paddingLeft: 42 }}
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type={showPw ? 'text' : 'password'}
                name="password"
                className="form-input"
                style={{ paddingLeft: 42, paddingRight: 42 }}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
