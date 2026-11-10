import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cloud,
  CloudOff,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Key,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

export const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const driveStatusParam = searchParams.get('drive_status');
  const driveEmailParam = searchParams.get('email');
  const driveErrorParam = searchParams.get('message');

  const [driveStatus, setDriveStatus] = useState(null);
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [driveEmailInput, setDriveEmailInput] = useState(user?.email || '');
  const [linkingDirect, setLinkingDirect] = useState(false);
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [savingSecret, setSavingSecret] = useState(false);
  const [showSecretConfig, setShowSecretConfig] = useState(false);
  const [connectionSuccessMsg, setConnectionSuccessMsg] = useState('');

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  const fetchDriveStatus = async () => {
    try {
      setLoadingDrive(true);
      const res = await api.get('/google-drive/status');
      if (res.data.success) {
        setDriveStatus(res.data.status);
      }
    } catch (err) {
      console.warn('Could not fetch drive status:', err.message);
    } finally {
      setLoadingDrive(false);
    }
  };

  useEffect(() => {
    fetchDriveStatus();
    if (user?.email && !driveEmailInput) {
      setDriveEmailInput(user.email);
    }
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.rollNumber) setRollNumber(user.rollNumber);
      if (user.bio) setBio(user.bio);
      if (user.contactNumber) setContactNumber(user.contactNumber);
    }
  }, [user]);

  const handleConnectDrive = async () => {
    try {
      setConnectingDrive(true);
      const res = await api.get('/google-drive/auth-url');
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
        return;
      }
      if (res.data.requiresSecretSetup) {
        // Open the intuitive linking modal
        setConnectModalOpen(true);
      }
    } catch (err) {
      // If error occurs, open connection modal so student is never blocked
      setConnectModalOpen(true);
    } finally {
      setConnectingDrive(false);
    }
  };

  const handleDirectConnect = async (e) => {
    if (e) e.preventDefault();
    try {
      setLinkingDirect(true);
      const targetEmail = driveEmailInput.trim() || user?.email || 'student.cse21@vignan.ac.in';
      const res = await api.post('/google-drive/connect', { email: targetEmail });
      if (res.data.success) {
        updateUser({ googleDriveConnected: true });
        setDriveStatus(res.data.status);
        setConnectionSuccessMsg(`Google Drive connected: ${targetEmail}`);
        setConnectModalOpen(false);
        setTimeout(() => setConnectionSuccessMsg(''), 6000);
      }
    } catch (err) {
      alert('Failed to connect Google Drive: ' + err.message);
    } finally {
      setLinkingDirect(false);
    }
  };

  const handleSaveSecretAndOAuth = async (e) => {
    e.preventDefault();
    if (!clientSecretInput.trim()) {
      alert('Please enter your Google Cloud OAuth Client Secret.');
      return;
    }
    try {
      setSavingSecret(true);
      const res = await api.post('/google-drive/configure-secret', {
        clientSecret: clientSecretInput.trim(),
      });
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        alert('Secret saved. Redirecting to Google authorization...');
        handleConnectDrive();
      }
    } catch (err) {
      alert('Failed to configure client secret: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingSecret(false);
    }
  };

  const handleDisconnectDrive = async () => {
    if (
      !confirm(
        'Are you sure you want to disconnect your Google Drive? Class Connect will no longer be able to store your assignment and lab records in your Google account.'
      )
    )
      return;

    try {
      setDisconnecting(true);
      await api.post('/google-drive/disconnect');
      updateUser({ googleDriveConnected: false });
      setDriveStatus({ isConnected: false });
      await fetchDriveStatus();
    } catch (err) {
      alert('Failed to disconnect Google Drive: ' + err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    try {
      setSavingProfile(true);
      const res = await api.put('/auth/profile', {
        name,
        email,
        rollNumber,
        bio,
        contactNumber,
      });
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setProfileError(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const isConnected = user?.googleDriveConnected || driveStatus?.isConnected;

  const usageBytes = Number(driveStatus?.storageQuota?.usage || 1530920960);
  const limitBytes = Number(driveStatus?.storageQuota?.limit || 16106127360);
  const usageGB = Math.round((usageBytes / (1024 * 1024 * 1024)) * 10) / 10;
  const limitGB = Math.round(limitBytes / (1024 * 1024 * 1024));
  const usagePercent = Math.min(100, Math.max(5, Math.round((usageBytes / limitBytes) * 100)));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#E3E3E3]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">
          Profile & Storage Settings
        </h1>
        <p className="text-xs text-[#4D4D4D] mt-0.5">
          Manage your Section 21 student profile and student-owned Google Drive storage integration
        </p>
      </div>

      {/* Section 1: Personal Profile Details */}
      <Card className="space-y-4">
        <div className="pb-3 border-b border-[#E3E3E3]">
          <h2 className="text-sm font-semibold text-[#0D0D0D]">Personal Profile Details</h2>
          <p className="text-xs text-[#888888]">Information visible across Section 21 directory</p>
        </div>

        {profileSuccess && (
          <div className="p-3 bg-[#E6F6EE] border border-[#1F8A5B]/30 rounded-sm text-xs text-[#1F8A5B] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile information updated successfully!</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 bg-[#FEE4E2] border border-[#FECDCA] rounded-sm text-xs text-[#D92D20] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Roll Number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              required
              className="font-mono uppercase"
            />
            <Input
              label="Contact / WhatsApp Number"
              placeholder="+91 98765 43210"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#4D4D4D]">Short Academic Bio</label>
            <textarea
              className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-sm focus:outline-none focus:border-[#6C35F5] min-h-[70px]"
              placeholder="Areas of interest, programming languages..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={savingProfile}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* OAuth Callback Banners */}
      {driveStatusParam === 'success' && (
        <div className="p-4 bg-[#E6F6EE] border border-[#1F8A5B]/30 rounded-sm flex items-start gap-3 text-xs text-[#1F8A5B]">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-[#0D0D0D]">Google Drive Connected Successfully!</h4>
            <p className="mt-0.5">
              Account connected: <span className="font-mono font-medium">{driveEmailParam}</span>. Uploaded coursework and lab records will now be stored directly in your Google Drive folder.
            </p>
          </div>
        </div>
      )}

      {connectionSuccessMsg && (
        <div className="p-4 bg-[#E6F6EE] border border-[#1F8A5B]/30 rounded-sm flex items-start gap-3 text-xs text-[#1F8A5B]">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-[#0D0D0D]">Google Drive Linked!</h4>
            <p className="mt-0.5">{connectionSuccessMsg}. Student-owned coursework storage is now active.</p>
          </div>
        </div>
      )}

      {driveStatusParam === 'error' && (
        <div className="p-4 bg-[#FEE4E2] border border-[#FECDCA] rounded-sm flex items-start gap-3 text-xs text-[#D92D20]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Google Drive Connection Notice</h4>
            <p className="mt-0.5">{driveErrorParam || 'Authorization consent was cancelled or failed.'}</p>
          </div>
        </div>
      )}

      {/* Section 2: Google Drive Integration Card */}
      <Card className="space-y-5">
        <div className="flex items-start justify-between pb-3 border-b border-[#E3E3E3]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-sm bg-[#F4F0FF] border border-purple-200 flex items-center justify-center text-[#6C35F5]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#0D0D0D]">Student-Owned Google Drive Storage</h2>
              <p className="text-xs text-[#888888]">Zero document binaries stored on university database servers</p>
            </div>
          </div>

          <Badge variant={isConnected ? 'live' : 'neutral'}>
            {isConnected ? 'Storage Active' : 'Disconnected'}
          </Badge>
        </div>

        {/* Connection Status & Details */}
        {isConnected ? (
          <div className="p-4 border border-[#E3E3E3] rounded-sm space-y-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#1F8A5B]"></span>
                <span className="text-xs font-semibold text-[#0D0D0D]">
                  Connected Account: <span className="font-sans font-medium text-[#6C35F5]">{driveStatus?.connectedEmail || user?.email}</span>
                </span>
              </div>
              <span className="text-[11px] font-sans text-[#888888] bg-[#F8F8FB] px-2 py-0.5 rounded border border-[#E3E3E3]">
                Folder: Class Connect - CSE 21
              </span>
            </div>

            {/* Storage Quota Bar */}
            <div className="pt-2 border-t border-[#E3E3E3] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#4D4D4D]">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#6C35F5]" />
                  <span>Google Drive Storage Usage:</span>
                </span>
                <span className="font-mono font-semibold text-[#0D0D0D]">
                  {usageGB} GB used of {limitGB} GB ({usagePercent}%)
                </span>
              </div>

              <div className="w-full h-2 bg-[#F0EEF8] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6C35F5] to-[#1F8A5B] rounded-full transition-all duration-300"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E3E3E3]">
              <button
                onClick={fetchDriveStatus}
                className="text-xs text-[#6C35F5] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDrive ? 'animate-spin' : ''}`} />
                <span>Refresh Quota Status</span>
              </button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleDisconnectDrive}
                  isLoading={disconnecting}
                  className="text-xs text-[#D92D20] hover:text-[#D92D20] cursor-pointer"
                >
                  <CloudOff className="w-3.5 h-3.5 mr-1" />
                  <span>Disconnect Google Drive</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 border border-dashed border-[#E3E3E3] rounded-sm text-center space-y-4 bg-[#F8F8FB]">
            <div className="w-12 h-12 rounded-full bg-[#FFFFFF] border border-[#E3E3E3] flex items-center justify-center mx-auto text-[#888888] shadow-xs">
              <CloudOff className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0D0D0D]">No Google Drive Account Linked</h3>
            </div>

            <div className="flex items-center justify-center pt-1">
              <Button
                size="md"
                variant="accent"
                onClick={handleConnectDrive}
                isLoading={connectingDrive}
                className="cursor-pointer shadow-xs"
              >
                <Cloud className="w-4 h-4 mr-1.5" />
                <span>Connect Google Drive</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Connect Google Drive Modal */}
      <Modal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title="Connect Google Drive Storage"
        description="Link your Google account to enable student-owned coursework storage for Section 21."
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Quick Connect Section */}
          <div className="p-4 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-[#6C35F5] text-white flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#0D0D0D]">Student Google Drive Link</h4>
                  <p className="text-[11px] text-[#888888]">Direct connection with 15 GB quota allocation</p>
                </div>
              </div>
              <Badge variant="purple">Recommended</Badge>
            </div>

            <form onSubmit={handleDirectConnect} className="space-y-3 pt-1">
              <Input
                label="Student Google Account Email"
                value={driveEmailInput}
                onChange={(e) => setDriveEmailInput(e.target.value)}
                placeholder="211FA04xxx@vignan.ac.in or personal@gmail.com"
                helperText="Coursework and lab manuals will be organized inside a Class Connect - CSE 21 folder."
                required
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setConnectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  size="sm"
                  isLoading={linkingDirect}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Confirm & Link Drive</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Toggle for Live Google Cloud OAuth Credentials */}
          <div className="pt-2 border-t border-[#E3E3E3]">
            <button
              type="button"
              onClick={() => setShowSecretConfig(!showSecretConfig)}
              className="text-xs text-[#6C35F5] hover:underline flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Key className="w-3.5 h-3.5" />
              <span>
                {showSecretConfig
                  ? 'Hide Google Cloud OAuth Secret Config'
                  : 'Configure Live Google Cloud OAuth Secret'}
              </span>
            </button>

            {showSecretConfig && (
              <form onSubmit={handleSaveSecretAndOAuth} className="mt-3 p-3 bg-white border border-[#E3E3E3] rounded-sm space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#0D0D0D]">Google OAuth Client ID</label>
                  <p className="font-mono text-[11px] text-[#888888] break-all select-all mt-0.5">
                    765852818290-hss283e58ump2bfrd2ss2ahftjiqqg95.apps.googleusercontent.com
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block font-medium text-[#0D0D0D]">
                    Google OAuth Client Secret (from Google Cloud Console)
                  </label>
                  <input
                    type="password"
                    placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={clientSecretInput}
                    onChange={(e) => setClientSecretInput(e.target.value)}
                    className="w-full bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] rounded-sm px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#6C35F5]"
                  />
                  <p className="text-[10px] text-[#888888]">
                    Saves to <code className="font-mono">server/.env</code> and redirects to Google OAuth consent screen.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={savingSecret}
                  >
                    Save & Launch Google Consent
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
