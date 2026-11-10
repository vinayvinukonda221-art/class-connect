import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { AppLayout } from './components/layout/AppLayout';
// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PendingApproval } from './pages/auth/PendingApproval';
// Main Application Pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { Assignments } from './pages/assignments/Assignments';
import { Projects } from './pages/projects/Projects';
import { LabRecords } from './pages/lab-records/LabRecords';
import { Seminars } from './pages/seminars/Seminars';
import { Resources } from './pages/resources/Resources';
import { QuestionPapers } from './pages/question-papers/QuestionPapers';
import { Timetable } from './pages/timetable/Timetable';
import { Attendance } from './pages/attendance/Attendance';
import { Notes } from './pages/notes/Notes';
import { Reminders } from './pages/reminders/Reminders';
import { TemporaryMessages } from './pages/messages/TemporaryMessages';
import { ProfileSettings } from './pages/profile/ProfileSettings';
import { AdminDashboard } from './pages/admin/AdminDashboard';
// Guard for protected student routes
const ProtectedRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#6C35F5] border-t-transparent rounded-full animate-spin"/>
          <p className="text-xs font-sans text-[#4D4D4D] tracking-wider uppercase">Loading Class Connect...</p>
        </div>
      </div>);
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }
    // If student registration is not yet approved or suspended, send them to pending approval page
    if (user?.role !== 'admin' && user?.status !== 'approved') {
        return <Navigate to="/pending-approval" replace/>;
    }
    return <AppLayout>{children}</AppLayout>;
};
// Guard for admin-only routes
const AdminRoute = ({ children }) => {
    const { user, loading, isAuthenticated, isAdmin } = useAuth();
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-[#FFFFFF]">
        <div className="w-8 h-8 border-2 border-[#6C35F5] border-t-transparent rounded-full animate-spin"/>
      </div>);
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    if (!isAdmin) {
        return <Navigate to="/dashboard" replace/>;
    }
    return <AppLayout>{children}</AppLayout>;
};
// Route for guests only (redirect if already logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isApproved, loading } = useAuth();
    if (loading) {
        return null;
    }
    if (isAuthenticated) {
        if (isApproved) {
            return <Navigate to="/dashboard" replace/>;
        }
        return <Navigate to="/pending-approval" replace/>;
    }
    return <>{children}</>;
};
export const App = () => {
    return (<BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<PublicRoute>
                  <Login />
                </PublicRoute>}/>
            <Route path="/register" element={<PublicRoute>
                  <Register />
                </PublicRoute>}/>
            <Route path="/pending-approval" element={<PendingApproval />}/>

            {/* Protected Student Routes */}
            <Route path="/dashboard" element={<ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>}/>
            <Route path="/assignments" element={<ProtectedRoute>
                  <Assignments />
                </ProtectedRoute>}/>
            <Route path="/projects" element={<ProtectedRoute>
                  <Projects />
                </ProtectedRoute>}/>
            <Route path="/lab-records" element={<ProtectedRoute>
                  <LabRecords />
                </ProtectedRoute>}/>
            <Route path="/seminars" element={<ProtectedRoute>
                  <Seminars />
                </ProtectedRoute>}/>
            <Route path="/resources" element={<ProtectedRoute>
                  <Resources />
                </ProtectedRoute>}/>
            <Route path="/question-papers" element={<ProtectedRoute>
                  <QuestionPapers />
                </ProtectedRoute>}/>
            <Route path="/timetable" element={<ProtectedRoute>
                  <Timetable />
                </ProtectedRoute>}/>
            <Route path="/attendance" element={<ProtectedRoute>
                  <Attendance />
                </ProtectedRoute>}/>
            <Route path="/notes" element={<ProtectedRoute>
                  <Notes />
                </ProtectedRoute>}/>
            <Route path="/reminders" element={<ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>}/>
            <Route path="/messages" element={<ProtectedRoute>
                  <TemporaryMessages />
                </ProtectedRoute>}/>
            <Route path="/profile" element={<ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>}/>

            {/* Admin Management Route */}
            <Route path="/admin" element={<AdminRoute>
                  <AdminDashboard />
                </AdminRoute>}/>

            {/* Default Catch-All */}
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
            <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>);
};
export default App;
