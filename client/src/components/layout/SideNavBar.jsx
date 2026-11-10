import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, CheckSquare, FolderGit2, BookOpen, Presentation, Files, FileQuestion, UserCheck, StickyNote, Clock, MessageSquare, ShieldAlert, Settings, Plus, } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
export const SideNavBar = ({ onQuickNoteClick }) => {
    const { isAdmin, user } = useAuth();
    const navItems = [
        { label: 'Academic Hub', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Timetable', to: '/timetable', icon: Calendar },
        { label: 'Assignments', to: '/assignments', icon: CheckSquare },
        { label: 'Projects', to: '/projects', icon: FolderGit2 },
        { label: 'Lab Records', to: '/lab-records', icon: BookOpen },
        { label: 'Seminars', to: '/seminars', icon: Presentation },
        { label: 'Subject Resources', to: '/resources', icon: Files },
        { label: 'Question Papers', to: '/question-papers', icon: FileQuestion },
        { label: 'Attendance', to: '/attendance', icon: UserCheck },
        { label: 'Personal Scratchpad', to: '/notes', icon: StickyNote },
        { label: 'Reminders', to: '/reminders', icon: Clock },
        { label: 'Messages', to: '/messages', icon: MessageSquare },
    ];
    return (<aside className="w-64 shrink-0 border-r border-[#E3E3E3] bg-[#FFFFFF] flex flex-col justify-between p-3 min-h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        {/* Section Profile Badge Card */}
        <div className="p-3 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#FFFFFF] border border-[#E3E3E3] flex items-center justify-center font-sans font-bold text-xs text-[#6C35F5]">
            S21
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#0D0D0D] truncate">CSE Section 21</p>
            <p className="text-[11px] text-[#888888] truncate">{user?.rollNumber || 'VFSTR Portal'}</p>
          </div>
        </div>

        {/* Quick Note CTA button (Render Modern Light button-primary) */}
        {onQuickNoteClick && (<button onClick={onQuickNoteClick} type="button" className="w-full flex items-center justify-center gap-2 h-9 px-3 bg-[#0D0D0D] text-white rounded-sm text-xs font-medium hover:bg-[#2A2A2A] active:bg-black transition-colors">
            <Plus className="w-3.5 h-3.5"/>
            <span>Quick Note</span>
          </button>)}

        {/* Primary Navigation Links */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (<NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium transition-colors ${isActive
                    ? 'bg-[#F4F0FF] text-[#6C35F5] font-semibold'
                    : 'text-[#4D4D4D] hover:text-[#0D0D0D] hover:bg-[#F8F8FB]'}`}>
                <Icon className="w-4 h-4 shrink-0"/>
                <span className="truncate">{item.label}</span>
              </NavLink>);
        })}

          {/* Admin Navigation (Role-based) */}
          {isAdmin && (<div className="pt-2 mt-2 border-t border-[#E3E3E3]">
              <span className="px-3 text-[10px] font-sans font-semibold uppercase tracking-wider text-[#888888] block mb-1">
                Administration
              </span>
              <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium transition-colors ${isActive
                ? 'bg-[#F4F0FF] text-[#6C35F5] font-semibold'
                : 'text-[#4D4D4D] hover:text-[#0D0D0D] hover:bg-[#F8F8FB]'}`}>
                <ShieldAlert className="w-4 h-4 text-[#6C35F5] shrink-0"/>
                <span className="truncate">Admin Dashboard</span>
              </NavLink>
            </div>)}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 border-t border-[#E3E3E3] space-y-1">
        <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-medium transition-colors ${isActive
            ? 'bg-[#F4F0FF] text-[#6C35F5] font-semibold'
            : 'text-[#4D4D4D] hover:text-[#0D0D0D] hover:bg-[#F8F8FB]'}`}>
          <Settings className="w-4 h-4 shrink-0"/>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>);
};
