import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, FileText, Send, Search, CheckCircle, Layers, Radio, RefreshCw, FolderSync } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
export const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userSearch, setUserSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('pending');
    // Announcement State
    const [announceTitle, setAnnounceTitle] = useState('');
    const [announceMessage, setAnnounceMessage] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState('');
    // Action Modals
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'approve',
        user: null,
        notes: '',
    });
    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsRes, pendingRes, usersRes] = await Promise.all([
                adminApi.getStats(),
                adminApi.getPendingUsers(),
                adminApi.getUsers({ status: statusFilter !== 'all' ? statusFilter : undefined }),
            ]);
            setStats(statsRes.data.stats);
            setPendingUsers(pendingRes.data.users);
            setAllUsers(usersRes.data.users);
        }
        catch (err) {
            console.error('Failed to load admin dashboard data', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, [statusFilter]);
    const handleApprove = async () => {
        const id = actionModal.user?._id || actionModal.user?.id;
        if (!id)
            return;
        try {
            await adminApi.approveUser(id, actionModal.notes);
            setActionModal({ isOpen: false, type: 'approve', user: null, notes: '' });
            fetchData();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };
    const handleReject = async () => {
        const id = actionModal.user?._id || actionModal.user?.id;
        if (!id)
            return;
        try {
            await adminApi.rejectUser(id, actionModal.notes);
            setActionModal({ isOpen: false, type: 'reject', user: null, notes: '' });
            fetchData();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
    };
    const handleStatusChange = async () => {
        const id = actionModal.user?._id || actionModal.user?.id;
        if (!id || !actionModal.newStatus)
            return;
        try {
            await adminApi.updateUserStatus(id, actionModal.newStatus, actionModal.notes);
            setActionModal({ isOpen: false, type: 'status', user: null, notes: '' });
            fetchData();
        }
        catch (err) {
            alert(err.response?.data?.message || 'Status update failed');
        }
    };
    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!announceTitle || !announceMessage)
            return;
        try {
            setSendingBroadcast(true);
            await adminApi.postAnnouncement(announceTitle, announceMessage);
            setBroadcastSuccess('Announcement broadcast successfully via real-time WebSocket and notification inbox!');
            setAnnounceTitle('');
            setAnnounceMessage('');
            setTimeout(() => setBroadcastSuccess(''), 6000);
        }
        catch (err) {
            alert(err.response?.data?.message || 'Broadcast failed');
        }
        finally {
            setSendingBroadcast(false);
        }
    };
    const filteredUsers = allUsers.filter((u) => {
        const query = userSearch.toLowerCase();
        return (u.name.toLowerCase().includes(query) ||
            u.rollNumber.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query));
    });
    return (<div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0D0D0D]">
              Section 21 Administration
            </h1>
          </div>
          <p className="text-sm text-[#4D4D4D]">
            Manage student registrations, enforce section gatekeeping, monitor academic deliverables, and dispatch announcements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1.5"/>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4D4D4D]">Enrolled Students</span>
            <Users className="w-4 h-4 text-[#6C35F5]"/>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D0D0D]">{stats?.totalStudents ?? '--'}</div>
          <p className="text-xs text-[#888888] mt-1">Section {stats?.section || '21'} roster</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4D4D4D]">Pending Approval</span>
            <Clock className="w-4 h-4 text-amber-500"/>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{stats?.pendingApprovals ?? '--'}</div>
          <p className="text-xs text-[#888888] mt-1">Requiring verification</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4D4D4D]">Active Submissions</span>
            <FileText className="w-4 h-4 text-[#1F8A5B]"/>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D0D0D]">{stats?.totalSubmissions ?? '--'}</div>
          <p className="text-xs text-[#888888] mt-1">From {stats?.totalAssignments ?? '--'} assignments</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4D4D4D]">Repository Items</span>
            <Layers className="w-4 h-4 text-sky-500"/>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D0D0D]">
            {(stats?.totalResources || 0) + (stats?.totalPYQs || 0)}
          </div>
          <p className="text-xs text-[#888888] mt-1">Lecture & Lab Notes + Question Papers</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E3E3E3]">
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'pending'
            ? 'border-[#6C35F5] text-[#6C35F5]'
            : 'border-transparent text-[#4D4D4D] hover:text-[#0D0D0D]'}`}>
          <UserCheck className="w-4 h-4"/>
          Pending Approvals
          {pendingUsers.length > 0 && (<span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
              {pendingUsers.length}
            </span>)}
        </button>

        <button onClick={() => setActiveTab('directory')} className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'directory'
            ? 'border-[#6C35F5] text-[#6C35F5]'
            : 'border-transparent text-[#4D4D4D] hover:text-[#0D0D0D]'}`}>
          <Users className="w-4 h-4"/>
          Student Directory ({allUsers.length})
        </button>

        <button onClick={() => setActiveTab('broadcast')} className={`px-4 py-2.5 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'broadcast'
            ? 'border-[#6C35F5] text-[#6C35F5]'
            : 'border-transparent text-[#4D4D4D] hover:text-[#0D0D0D]'}`}>
          <Radio className="w-4 h-4"/>
          Broadcast Announcement
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (<div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#0D0D0D]">
              Student Registration Queue ({pendingUsers.length})
            </h2>
            <span className="text-xs text-[#888888]">
              Registration is restricted to CSE Section 21 students.
            </span>
          </div>

          {loading ? (<div className="py-12 text-center text-[#4D4D4D]">Loading pending students...</div>) : pendingUsers.length === 0 ? (<Card className="p-8 text-center bg-[#F8F8FB]">
              <CheckCircle className="w-10 h-10 text-[#1F8A5B] mx-auto mb-2"/>
              <h3 className="text-base font-medium text-[#0D0D0D]">No pending registrations</h3>
              <p className="text-sm text-[#4D4D4D] mt-1">
                All submitted student registrations have been processed and vetted.
              </p>
            </Card>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map((user) => (<Card key={user._id || user.id} className="p-5 border border-amber-200 bg-amber-50/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0D0D0D] text-base">{user.name}</span>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                      <p className="text-sm font-mono text-[#6C35F5] mt-0.5">{user.rollNumber}</p>
                      <p className="text-xs text-[#4D4D4D] mt-0.5">{user.email}</p>
                    </div>
                    <span className="text-xs text-[#888888] font-mono">
                      Sec {user.section}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E3E3E3] flex items-center justify-between text-xs text-[#888888]">
                    <span>Requested: {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" onClick={() => setActionModal({
                        isOpen: true,
                        type: 'reject',
                        user,
                        notes: 'Roll number not verified on official Section 21 roster.',
                    })}>
                        Reject
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => setActionModal({
                        isOpen: true,
                        type: 'approve',
                        user,
                        notes: 'Verified enrollment in CSE Section 21.',
                    })}>
                        Approve
                      </Button>
                    </div>
                  </div>
                </Card>))}
            </div>)}
        </div>)}

      {/* TAB 2: STUDENT DIRECTORY */}
      {activeTab === 'directory' && (<div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#888888]"/>
              <input type="text" placeholder="Search name, roll no, email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-[#FFFFFF] border border-[#E3E3E3] rounded-md focus:outline-none focus:border-[#6C35F5]"/>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#4D4D4D]">Status:</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm bg-[#FFFFFF] border border-[#E3E3E3] rounded-md px-3 py-1.5 focus:outline-none focus:border-[#6C35F5]">
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#E3E3E3] bg-[#FFFFFF]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8F8FB] border-b border-[#E3E3E3] text-xs font-semibold text-[#4D4D4D] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Google Drive</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E3E3]">
                {filteredUsers.length === 0 ? (<tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#888888]">
                      No students found matching your criteria.
                    </td>
                  </tr>) : (filteredUsers.map((u) => (<tr key={u._id || u.id} className="hover:bg-[#F8F8FB]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0D0D0D]">{u.name}</div>
                        <div className="text-xs text-[#888888]">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{u.rollNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.status === 'approved'
                    ? 'success'
                    : u.status === 'pending'
                        ? 'warning'
                        : 'error'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.googleDriveConnected ? (<span className="inline-flex items-center gap-1 text-xs text-[#1F8A5B] font-medium">
                            <FolderSync className="w-3.5 h-3.5"/>
                            Connected
                          </span>) : (<span className="text-xs text-[#888888]">Not linked</span>)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'admin' && (<div className="flex items-center justify-end gap-1.5">
                            {u.status === 'approved' && (<button onClick={() => setActionModal({
                            isOpen: true,
                            type: 'status',
                            user: u,
                            newStatus: 'suspended',
                            notes: 'Temporary hold by administrator.',
                        })} className="text-xs px-2 py-1 text-amber-600 hover:bg-amber-50 rounded">
                                Suspend
                              </button>)}
                            {u.status === 'suspended' && (<button onClick={() => setActionModal({
                            isOpen: true,
                            type: 'status',
                            user: u,
                            newStatus: 'approved',
                            notes: 'Account reactivated.',
                        })} className="text-xs px-2 py-1 text-[#1F8A5B] hover:bg-emerald-50 rounded">
                                Reactivate
                              </button>)}
                            {u.status === 'pending' && (<button onClick={() => setActionModal({
                            isOpen: true,
                            type: 'approve',
                            user: u,
                            notes: 'Approved from directory.',
                        })} className="text-xs px-2 py-1 text-[#6C35F5] hover:bg-purple-50 rounded">
                                Approve
                              </button>)}
                          </div>)}
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* TAB 3: BROADCAST ANNOUNCEMENT */}
      {activeTab === 'broadcast' && (<Card className="p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-[#6C35F5]"/>
            <h2 className="text-base font-semibold text-[#0D0D0D]">
              Section 21 Emergency & General Announcement
            </h2>
          </div>
          <p className="text-xs text-[#4D4D4D] mb-4">
            Dispatches an immediate notification to all currently approved students in CSE Section 21 over real-time WebSockets and records an inbox notification.
          </p>

          {broadcastSuccess && (<div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0"/>
              <span>{broadcastSuccess}</span>
            </div>)}

          <form onSubmit={handleBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4D4D4D] uppercase mb-1">
                Announcement Headline *
              </label>
              <Input placeholder="e.g. Tomorrow Lab Schedule Shifted to Room 402" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} required/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4D4D4D] uppercase mb-1">
                Detailed Message Body *
              </label>
              <textarea rows={4} placeholder="Write full notice details for Section 21 students..." value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} required className="w-full px-3 py-2 text-sm bg-[#FFFFFF] border border-[#E3E3E3] rounded-md focus:outline-none focus:border-[#6C35F5]"/>
            </div>

            <Button type="submit" variant="primary" disabled={sendingBroadcast}>
              <Send className="w-4 h-4 mr-1.5"/>
              {sendingBroadcast ? 'Broadcasting...' : 'Broadcast to Section 21'}
            </Button>
          </form>
        </Card>)}

      {/* ACTION CONFIRMATION MODAL */}
      <Modal isOpen={actionModal.isOpen} onClose={() => setActionModal({ isOpen: false, type: 'approve', user: null, notes: '' })} title={actionModal.type === 'approve'
            ? `Approve Student Registration`
            : actionModal.type === 'reject'
                ? `Reject Student Registration`
                : `Update Student Account Status`}>
        <div className="space-y-4">
          <p className="text-sm text-[#4D4D4D]">
            Target student:{' '}
            <strong className="text-[#0D0D0D]">
              {actionModal.user?.name} ({actionModal.user?.rollNumber})
            </strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#4D4D4D] uppercase mb-1">
              {actionModal.type === 'reject' ? 'Reason for Rejection *' : 'Administrative Note (Optional)'}
            </label>
            <textarea rows={3} value={actionModal.notes} onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })} className="w-full px-3 py-2 text-sm bg-[#FFFFFF] border border-[#E3E3E3] rounded-md focus:outline-none focus:border-[#6C35F5]" placeholder="Add comments or audit remarks..."/>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setActionModal({ isOpen: false, type: 'approve', user: null, notes: '' })}>
              Cancel
            </Button>
            {actionModal.type === 'approve' && (<Button variant="primary" onClick={handleApprove}>
                Confirm Approval
              </Button>)}
            {actionModal.type === 'reject' && (<Button variant="danger" onClick={handleReject}>
                Confirm Rejection
              </Button>)}
            {actionModal.type === 'status' && (<Button variant="primary" onClick={handleStatusChange}>
                Update Status
              </Button>)}
          </div>
        </div>
      </Modal>
    </div>);
};
export default AdminDashboard;
