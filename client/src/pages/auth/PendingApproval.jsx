import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, CheckCircle2, RotateCw, LogOut, Mail, Building } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
export const PendingApproval = () => {
    const { user, refreshUser, logout } = useAuth();
    const [checking, setChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState('');
    const navigate = useNavigate();
    const handleCheckStatus = async () => {
        setChecking(true);
        setCheckMessage('');
        try {
            await refreshUser();
            const saved = localStorage.getItem('classconnect_user') || localStorage.getItem('sectionspace_user');
            const currentUser = saved ? JSON.parse(saved) : null;
            if (currentUser?.status === 'approved') {
                navigate('/dashboard');
            }
            else if (currentUser?.status === 'rejected') {
                setCheckMessage('Your registration was rejected by the Section Administrator.');
            }
            else if (currentUser?.status === 'suspended') {
                setCheckMessage('Your account is currently suspended.');
            }
            else {
                setCheckMessage('Status: Still pending verification by Section 21 Administrator.');
            }
        }
        catch {
            setCheckMessage('Could not connect to server to check status.');
        }
        finally {
            setChecking(false);
        }
    };
    const isRejected = user?.status === 'rejected';
    const isSuspended = user?.status === 'suspended';
    return (<div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-[#FFFFFF] border border-[#E3E3E3] rounded-lg p-6 sm:p-8 space-y-6 text-center">
        {/* Status Icon */}
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-[#F4F0FF] border border-purple-200 text-[#6C35F5]">
          {isRejected || isSuspended ? (<ShieldAlert className="w-7 h-7 text-[#D92D20]"/>) : (<Clock className="w-7 h-7 text-[#6C35F5]"/>)}
        </div>

        <div>
          <Badge variant={isRejected || isSuspended ? 'error' : 'deploying'}>
            {isRejected
            ? 'Registration Rejected'
            : isSuspended
                ? 'Account Suspended'
                : 'Pending Administrator Verification'}
          </Badge>
          <h1 className="text-xl font-bold text-[#0D0D0D] mt-3 tracking-tight">
            {isRejected
            ? 'Registration Review Declined'
            : isSuspended
                ? 'Section 21 Account Suspended'
                : 'Account Under Review'}
          </h1>
          <p className="text-xs text-[#4D4D4D] mt-1 font-medium">
            {user?.name} · {user?.rollNumber} · CSE Section {user?.section || '21'}
          </p>
        </div>

        {/* Informative Notice */}
        <div className="p-4 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm text-xs text-[#4D4D4D] text-left space-y-2">
          {isRejected ? (<p className="text-[#D92D20]">
              {user?.approvalNotes ||
                'Your registration for Section 21 was not approved. Only enrolled students on the official roster are eligible.'}
            </p>) : isSuspended ? (<p className="text-[#D92D20]">
              Your account access has been paused. Please contact your Class Representative or HOD office to resolve this.
            </p>) : (<>
              <p className="leading-relaxed">
                Your account registration for Section 21 is under admin review. Once approved by Section Administrators, you can access course materials and connected Google Drive features.
              </p>
              <div className="pt-2 border-t border-[#E3E3E3] text-[11px] text-[#888888] space-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1F8A5B]"/>
                  <span>Student registration received</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6C35F5]"/>
                  <span>Roll number verification in progress</span>
                </div>
              </div>
            </>)}
        </div>

        {checkMessage && (<p className="text-xs font-medium text-[#6C35F5]">{checkMessage}</p>)}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {!isRejected && !isSuspended && (<Button type="button" variant="primary" className="w-full" onClick={handleCheckStatus} isLoading={checking}>
              <RotateCw className="w-3.5 h-3.5 mr-1.5"/>
              <span>Check Approval Status</span>
            </Button>)}

          <Button type="button" variant="secondary" className="w-full" onClick={() => {
            logout();
            navigate('/login');
        }}>
            <LogOut className="w-3.5 h-3.5 mr-1.5"/>
            <span>Sign Out</span>
          </Button>
        </div>

        {/* Department Contact Info */}
        <div className="pt-4 border-t border-[#E3E3E3] text-[11px] text-[#888888] space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#6C35F5]"/>
            <span>Department of CSE · VFSTR Vadlamudi Campus</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5"/>
            <span>Section CR Email: cr.cse21@vignan.ac.in</span>
          </div>
        </div>
      </div>
    </div>);
};
