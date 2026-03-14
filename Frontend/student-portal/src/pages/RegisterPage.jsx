import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, Building, Hash } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', college: '', semester: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college,
        semester: form.semester ? parseInt(form.semester) : null,
      };
      const res = await api.post('/api/auth/register', payload);
      login(res.data);
      toast.success(`Account created! Welcome, ${res.data.name}! 🎉`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputProps = (name, placeholder, type = 'text', icon) => ({
    type, name, placeholder, value: form[name], onChange: handleChange,
    className: 'form-input', style: { paddingLeft: icon ? 42 : 16 },
  });

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 540 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <BookOpen size={22} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20 }}>StudyPortal</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands of students sharing knowledge</p>

        {error && (
          <div className="text-error" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '8px' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input {...inputProps('name', 'Rahul Sharma', 'text', true)} autoComplete="name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input {...inputProps('email', 'your@email.com', 'email', true)} autoComplete="email" />
            </div>
          </div>

          <div className="auth-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input {...inputProps('password', '••••••••', 'password')} autoComplete="new-password" style={{ paddingLeft: 16 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input {...inputProps('confirmPassword', '••••••••', 'password')} autoComplete="new-password" style={{ paddingLeft: 16 }} />
            </div>
          </div>

          <div className="auth-row">
            <div className="form-group">
              <label className="form-label">College (optional)</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...inputProps('college', 'ABC College', 'text', true)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Semester (optional)</label>
              <div style={{ position: 'relative' }}>
                <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input {...inputProps('semester', '3', 'number', true)} min="1" max="8" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
