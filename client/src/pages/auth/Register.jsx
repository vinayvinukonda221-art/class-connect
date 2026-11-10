import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
export const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rollNumber: '',
        section: '21',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (formData.section !== '21') {
            setError('Registration is restricted to CSE Section 21 students.');
            return;
        }
        setLoading(true);
        try {
            await register({
                name: formData.name,
                email: formData.email,
                rollNumber: formData.rollNumber.toUpperCase(),
                section: formData.section,
                password: formData.password,
            });
            // Redirect to Pending Approval state
            navigate('/pending-approval');
        }
        catch (err) {
            setError(err.message || 'Registration failed. Please check your details.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-sm bg-[#6C35F5] flex items-center justify-center text-white shadow-xs">
            <Terminal className="w-5 h-5"/>
          </div>
          <span className="font-semibold text-2xl tracking-tight text-[#0D0D0D]">Class Connect</span>
        </div>
        <p className="text-center text-xs text-[#4D4D4D] font-medium">
          CSE Section 21 Student Registration · VFSTR
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FFFFFF] py-8 px-6 border border-[#E3E3E3] rounded-lg sm:px-8 space-y-6">
          <div className="flex border-b border-[#E3E3E3] pb-3 justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-[#0D0D0D]">Section 21 Enrollment</h2>
              <p className="text-xs text-[#888888]">Requires administrator roll verification</p>
            </div>
            <Link to="/login" className="text-xs text-[#6C35F5] hover:underline font-medium">
              Sign In &rarr;
            </Link>
          </div>

          {error && (<div className="p-3 bg-[#FEE4E2] border border-[#FECDCA] rounded-sm flex items-start gap-2 text-xs text-[#D92D20]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
              <span>{error}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name (As per University Records)" name="name" placeholder="e.g. Aditya Varma" value={formData.name} onChange={handleChange} required/>

            <Input label="Email" name="email" type="email" placeholder="e.g. 211fa04021@vignan.ac.in" value={formData.email} onChange={handleChange} required helperText="Must be a valid email"/>

            <Input label="Roll Number" name="rollNumber" placeholder="e.g. 211FA04021" value={formData.rollNumber} onChange={handleChange} required/>

            {/* Locked Section Indicator */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4D4D4D]">Academic Section</label>
              <div className="flex items-center justify-between p-2.5 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#6C35F5]"/>
                  <span className="text-xs font-semibold text-[#0D0D0D]">CSE - Section 21</span>
                </div>
                <Badge variant="deploying">Locked to Section 21</Badge>
              </div>
              <p className="text-[11px] text-[#888888]">
                Only students officially allotted to Section 21 are eligible for registration.
              </p>
            </div>

            <Input label="Password (min. 6 characters)" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required/>

            <Input label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required/>

            <div className="p-3 bg-[#F4F0FF] rounded-sm border border-purple-200 text-xs text-[#0D0D0D] space-y-1">
              <div className="flex items-center gap-1 font-semibold text-[#6C35F5]">
                <ShieldCheck className="w-4 h-4"/>
                <span>Admin Approval Workflow</span>
              </div>
              <p className="text-[11px] text-[#4D4D4D]">
                To maintain academic integrity, new accounts require Section Administrator approval before accessing shared course materials and Google Drive storage.
              </p>
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Submit Section 21 Registration
            </Button>
          </form>
        </div>
      </div>
    </div>);
};
