import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, User as UserIcon, Shield, ChevronDown, Terminal, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Badge } from '../ui/Badge';
export const TopNavBar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMac, setIsMac] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent || navigator.platform));

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleGlobalKeyDown = (e) => {
      // Trigger shortcut: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // Escape to blur search
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/resources?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return (<header className="sticky top-0 z-40 w-full h-16 border-b border-[#E3E3E3] bg-[#FFFFFF] px-4 lg:px-6 flex items-center justify-between">
    {/* Brand */}
    <div className="flex items-center gap-3">
      <Link to="/dashboard" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-sm bg-[#6C35F5] flex items-center justify-center text-white shadow-xs group-hover:bg-[#5824DB] transition-colors">
          <Terminal className="w-4 h-4" />
        </div>
        <span className="font-semibold text-lg tracking-tight text-[#0D0D0D]">Class Connect</span>
      </Link>
    </div>

    {/* Global Search Bar */}
    <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] pointer-events-none" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search subjects, lab manuals, faculty`}
          className="w-full pl-9 pr-14 py-1.5 text-xs bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm text-[#0D0D0D] placeholder:text-[#888888] focus:outline-none focus:border-[#6C35F5] focus:bg-white transition-all font-sans"
        />
        <kbd
          onClick={() => searchInputRef.current?.focus()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-sans font-medium text-[#888888] bg-white border border-[#E3E3E3] rounded-sm shadow-xs cursor-pointer select-none hover:text-[#6C35F5] hover:border-[#6C35F5]/40 transition-colors"
          title={`Shortcut: ${isMac ? 'Cmd + K' : 'Ctrl + K'}`}
        >
          {isMac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </form>
    </div>

    {/* Right Controls: Notifications, Profile */}
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Notifications Popover */}
      <div className="relative" ref={notifRef}>
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-sm text-[#4D4D4D] hover:text-[#0D0D0D] hover:bg-[#F8F8FB] transition-colors" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (<span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#6C35F5] text-white rounded-full text-[10px] font-semibold flex items-center justify-center">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>)}
        </button>

        {showNotifications && (<div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E3E3E3] rounded-lg shadow-subtle p-3 z-50">
          <div className="flex items-center justify-between pb-2 border-b border-[#E3E3E3] mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#0D0D0D]">Notifications</span>
              {unreadNotificationCount > 0 && (<Badge variant="purple">{unreadNotificationCount} unread</Badge>)}
            </div>
            {unreadNotificationCount > 0 && (<button onClick={markAllNotificationsRead} className="text-[11px] text-[#6C35F5] hover:underline">
              Mark all read
            </button>)}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-[#E3E3E3]">
            {notifications.length === 0 ? (<div className="py-6 text-center text-xs text-[#888888]">No notifications right now.</div>) : (notifications.map((notif) => (<div key={notif._id} onClick={() => !notif.isRead && markNotificationRead(notif._id)} className={`pt-2 pb-1.5 cursor-pointer rounded-sm px-1.5 transition-colors ${notif.isRead ? 'opacity-70 hover:bg-[#F8F8FB]' : 'bg-[#F4F0FF]/40 hover:bg-[#F4F0FF]'}`}>
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-semibold text-[#0D0D0D] leading-tight">{notif.title}</p>
                {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#6C35F5] shrink-0 mt-1" />}
              </div>
              <p className="text-[11px] text-[#4D4D4D] mt-0.5 leading-normal">{notif.message}</p>
              <span className="text-[10px] text-[#888888] font-sans mt-1 block">
                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>)))}
          </div>
        </div>)}
      </div>

      <span className="h-4 w-px bg-[#E3E3E3]" />

      {/* User Profile Chip & Menu */}
      <div className="relative" ref={profileRef}>
        <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 pl-1 cursor-pointer group rounded-sm p-1 hover:bg-[#F8F8FB] transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#F4F0FF] border border-[#E3E3E3] flex items-center justify-center text-xs font-semibold text-[#6C35F5]">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="hidden lg:block text-xs font-medium text-[#0D0D0D] group-hover:text-[#6C35F5] transition-colors">
            {user?.name || 'Student'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
        </button>

        {showProfileMenu && (<div className="absolute right-0 mt-2 w-56 bg-white border border-[#E3E3E3] rounded-lg shadow-subtle p-2 z-50">
          <div className="px-2 py-1.5 border-b border-[#E3E3E3] mb-1">
            <p className="text-xs font-semibold text-[#0D0D0D]">{user?.name}</p>
            <p className="text-[11px] text-[#888888] truncate">{user?.email}</p>
          </div>

          <div className="space-y-0.5">
            <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#0D0D0D] hover:bg-[#F8F8FB] rounded-sm transition-colors">
              <Settings className="w-3.5 h-3.5 text-[#4D4D4D]" />
              <span>Settings</span>
            </Link>

            {isAdmin && (<Link to="/admin" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#6C35F5] font-medium hover:bg-[#F4F0FF] rounded-sm transition-colors">
              <Shield className="w-3.5 h-3.5 text-[#6C35F5]" />
              <span>Admin Dashboard</span>
            </Link>)}

            <button onClick={() => {
              setShowProfileMenu(false);
              logout();
              navigate('/login');
            }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-[#D92D20] hover:bg-red-50 rounded-sm transition-colors text-left">
              <LogOut className="w-3.5 h-3.5 text-[#D92D20]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>)}
      </div>
    </div>
  </header>);
};
