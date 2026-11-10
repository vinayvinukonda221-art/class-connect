import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const Login = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(loginId, password);
      if (user.status === 'pending') {
        navigate('/pending-approval');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-sm bg-[#6C35F5] flex items-center justify-center text-white shadow-xs">
            <Terminal className="w-5 h-5" />
          </div>
          <span className="font-semibold text-2xl tracking-tight text-[#0D0D0D]">Class Connect</span>
        </div>
        <p className="text-center text-xs text-[#4D4D4D] font-medium">
          CSE Section 21 · Vignan University (VFSTR)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] py-8 px-6 border border-[#E3E3E3] rounded-lg sm:px-8 space-y-6">
          <div className="flex border-b border-[#E3E3E3] pb-3 justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0D]">Sign in to your portal</h2>
            </div>
            <Link to="/register" className="text-xs text-[#6C35F5] hover:underline font-medium">
              Register &rarr;
            </Link>
          </div>

          {error && (
            <div className="p-3 bg-[#FEE4E2] border border-[#FECDCA] rounded-sm flex items-start gap-2 text-xs text-[#D92D20]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Roll Number or Email"
              placeholder="e.g. 211FA04001 or student@vignan.ac.in"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
