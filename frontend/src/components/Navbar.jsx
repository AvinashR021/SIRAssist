import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { ShieldCheck, Bell, User, LogOut, FileText, Database, HelpCircle } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  useEffect(() => {
    if (user && user.role === 'CITIZEN') {
      API.get('/notifications')
        .then(res => setNotifications(res.data))
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read_status).length;

  const handleMarkRead = (id) => {
    API.put(`/notifications/${id}/read`)
      .then(() => {
        setNotifications(notifications.map(n => n.notification_id === id ? { ...n, read_status: true } : n));
      })
      .catch(() => {});
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 text-blue-700 font-bold text-xl hover:text-blue-800 transition">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <div>
              <span>SIRAssist</span>
              <span className="block text-[10px] text-slate-500 font-normal tracking-wide">CITIZEN ASSISTANCE PLATFORM</span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-blue-600 flex items-center gap-1">Home</Link>
            <Link to="/demo" className="hover:text-blue-600 flex items-center gap-1 text-indigo-600 font-semibold">
              <Database className="w-4 h-4" /> DBMS Showcase
            </Link>

            {user && user.role === 'CITIZEN' && (
              <>
                <Link to="/citizen-dashboard" className="hover:text-blue-600">My Dashboard</Link>
                <Link to="/documents" className="hover:text-blue-600 flex items-center gap-1">
                  <FileText className="w-4 h-4" /> My Documents
                </Link>
                <Link to="/profile" className="hover:text-blue-600">Profile</Link>
              </>
            )}

            {user && user.role === 'VOLUNTEER' && (
              <Link to="/volunteer-dashboard" className="hover:text-blue-600">Volunteer Dashboard</Link>
            )}

            {user && user.role === 'ADMIN' && (
              <Link to="/admin-dashboard" className="hover:text-blue-600 text-purple-700 font-bold">Admin Dashboard</Link>
            )}
          </nav>

          {/* User Account Controls */}
          <div className="flex items-center space-x-4">
            {user && user.role === 'CITIZEN' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {showNotifDrawer && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-semibold text-xs uppercase tracking-wider text-slate-500">Notifications</span>
                      <span className="text-xs text-blue-600 font-medium">{unreadCount} unread</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-xs text-slate-500 text-center">No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.notification_id}
                            onClick={() => handleMarkRead(n.notification_id)}
                            className={`p-3 text-xs border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${!n.read_status ? 'bg-blue-50/50 font-medium' : 'text-slate-600'}`}
                          >
                            <p>{n.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-700 font-semibold border border-slate-200">
                  {user.role}
                </span>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
