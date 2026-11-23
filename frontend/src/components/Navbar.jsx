import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  ShieldCheck,
  Bell,
  User,
  LogOut,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  useEffect(() => {
    if (user && user.role === 'CITIZEN') {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = () => {
    API.get('/notifications')
      .then(res => setNotifications(res.data || []))
      .catch(() => {});
  };

  const unreadCount = notifications.filter(n => !n.read_status).length;

  const handleMarkRead = async (notif) => {
    try {
      await API.patch(`/notifications/${notif.notification_id}/read`);
      setNotifications(prev =>
        prev.map(n => n.notification_id === notif.notification_id ? { ...n, read_status: true } : n)
      );
      if (notif.document_id) {
        setShowNotifDrawer(false);
        navigate(`/documents?docId=${notif.document_id}`);
      }
    } catch {
      API.put(`/notifications/${notif.notification_id}/read`)
        .then(() => {
          setNotifications(prev =>
            prev.map(n => n.notification_id === notif.notification_id ? { ...n, read_status: true } : n)
          );
          if (notif.document_id) {
            setShowNotifDrawer(false);
            navigate(`/documents?docId=${notif.document_id}`);
          }
        })
        .catch(() => {});
    }
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

          {/* Clean Main Navigation Items (Priority 4 & 6) */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/explorer" className="hover:text-blue-600 flex items-center gap-1.5 text-indigo-600 font-semibold">
              <Search className="w-4 h-4" /> Search Records
            </Link>

            {user && user.role === 'CITIZEN' && (
              <>
                <Link to="/citizen-dashboard" className="hover:text-blue-600 font-semibold text-slate-700">
                  Dashboard
                </Link>
                <Link to="/documents" className="hover:text-blue-600 flex items-center gap-1">
                  <FileText className="w-4 h-4" /> My Documents
                </Link>
                <Link to="/profile" className="hover:text-blue-600">
                  My Profile
                </Link>
              </>
            )}

            {user && user.role === 'VOLUNTEER' && (
              <Link to="/volunteer-dashboard" className="hover:text-indigo-600 flex items-center gap-1.5 font-bold text-indigo-700">
                <FileText className="w-4 h-4" /> Assigned Documents
              </Link>
            )}

            {user && user.role === 'ADMIN' && (
              <Link to="/admin-dashboard" className="hover:text-purple-700 text-purple-700 font-bold flex items-center gap-1">
                <Shield className="w-4 h-4" /> Admin Dashboard
              </Link>
            )}
          </nav>

          {/* User Account & Notifications */}
          <div className="flex items-center space-x-3">
            {user && user.role === 'CITIZEN' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-full relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Drawer */}
                {showNotifDrawer && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-600" /> Notifications
                      </span>
                      <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                        {unreadCount} unread
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="p-5 text-xs text-slate-400 text-center">No notifications in your inbox.</p>
                      ) : (
                        notifications.map(n => {
                          const isUnread = !n.read_status;
                          return (
                            <div
                              key={n.notification_id}
                              onClick={() => handleMarkRead(n)}
                              className={`p-3 text-xs cursor-pointer transition hover:bg-blue-50/70 ${
                                isUnread ? 'bg-blue-50/40 font-medium' : 'text-slate-600'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`font-semibold block ${isUnread ? 'text-blue-900' : 'text-slate-800'}`}>
                                  {n.title || 'Review Update'}
                                </span>
                                {isUnread && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                {n.message}
                              </p>
                              <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                                <span>{new Date(n.created_at).toLocaleString()}</span>
                                {n.document_id && (
                                  <span className="text-blue-600 font-semibold flex items-center gap-0.5 hover:underline">
                                    View Document <ExternalLink className="w-2.5 h-2.5" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-2.5">
                <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-700 font-semibold border border-slate-200">
                  {user.role}
                </span>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50 text-xs py-1 px-2.5 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-outline btn-sm text-xs px-3 py-1.5 rounded-lg">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm text-xs px-3 py-1.5 rounded-lg">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
