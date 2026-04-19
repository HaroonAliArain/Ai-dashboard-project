import {
  Brain,
  ChevronRight,
  Code,
  Image as ImageIcon,
  LayoutDashboard,
  Mic2,
  MessageSquare,
  Settings,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { id: 'vision', label: 'Image Analyzer', icon: ImageIcon },
  { id: 'speechGen', label: 'Speech Gen', icon: Mic2 },
  { id: 'tools', label: 'AI Tools', icon: Zap },
  { id: 'features', label: 'Features', icon: Sparkles },
];

export function Sidebar({ activeView, setActiveView, isOpen, onClose }: SidebarProps) {
  const handleNavClick = (id: string) => {
    setActiveView(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 w-64 h-full bg-surface-dim border-r border-border flex flex-col z-50 transition-transform duration-300 transform lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-google-blue to-google-green flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Nexus AI</h1>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:text-white">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                  isActive 
                    ? "bg-google-blue/10 text-google-blue" 
                    : "text-gray-400 hover:bg-surface-bright hover:text-gray-200"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-google-blue" : "text-gray-500 group-hover:text-gray-300"
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="w-1.5 h-1.5 rounded-full bg-google-blue"
                  />
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-surface-bright/30 rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 text-google-blue font-bold text-[10px] uppercase tracking-widest mb-1">
               <Code className="w-3 h-3" /> System Hub
            </div>
            <p className="text-gray-500 text-[10px] leading-tight">Secure cloud environment is actively monitoring connections.</p>
          </div>
        </div>
      </div>
    </>
  );
}
