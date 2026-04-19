import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import React from 'react';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([
    { id: 1, text: 'Welcome to Nexus AI Dashboard!', time: 'Just now', read: false },
    { id: 2, text: 'Gemini 3.1 model successfully linked.', time: '5m ago', read: false },
    { id: 4, text: 'Speech Generation system is active.', time: 'Just now', read: false },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-20 border-bottom border-border bg-surface-dim/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="p-2 lg:hidden text-gray-400 hover:text-white transition-all flex-shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
           <p className="text-xs sm:text-sm font-black text-white tracking-widest uppercase">AI Dashboard</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 ml-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-surface-bright border border-border text-gray-400 hover:text-white transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-google-red border-2 border-surface-dim" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-surface-bright border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-border flex items-center justify-between bg-surface-dim/50">
                    <h3 className="font-bold text-sm text-white">Notifications</h3>
                    <button 
                      onClick={markAllRead}
                      className="text-[10px] text-google-blue hover:underline font-bold uppercase tracking-widest"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={cn(
                            "p-4 border-b border-border/50 last:border-0 hover:bg-surface-dim transition-colors cursor-pointer",
                            !n.read && "bg-google-blue/5"
                          )}
                        >
                          <p className="text-xs text-gray-200 leading-relaxed mb-1">{n.text}</p>
                          <span className="text-[10px] text-gray-500">{n.time}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 text-xs">
                        No new notifications
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={logout}
          className="flex items-center gap-2 pr-2.5 sm:pr-4 pl-2.5 py-2.5 rounded-xl bg-surface-bright border border-border text-gray-400 hover:text-google-red transition-all group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:block text-xs font-bold uppercase tracking-widest">Sign Out</span>
        </button>

        <div className="h-8 w-px bg-border mx-1 hidden sm:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white leading-none">{user?.displayName || 'Developer'}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">AI Lead</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-google-blue to-google-red p-[1px]">
            <div className="w-full h-full rounded-[11px] bg-surface-dim flex items-center justify-center overflow-hidden">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <User className="w-6 h-6 text-gray-400" />
               )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
