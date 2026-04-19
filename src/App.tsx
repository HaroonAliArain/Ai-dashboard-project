/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { ChatView } from './components/ChatView';
import { VisionView } from './components/VisionView';
import { ToolsView } from './components/ToolsView';
import { SpeechGenView } from './components/SpeechGenView';
import { FeaturesView } from './components/FeaturesView';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth, LoginScreen } from './components/AuthProvider';
import { Toaster } from 'sonner';

function DashboardContent() {
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-surface flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-12 h-12 rounded-2xl border-4 border-t-google-blue border-border" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <OverviewView onNavigate={setActiveView} />;
      case 'chat': return <ChatView />;
      case 'vision': return <VisionView />;
      case 'speechGen': return <SpeechGenView />;
      case 'tools': return <ToolsView />;
      case 'features': return <FeaturesView />;
      default: return <OverviewView onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      {/* Sidebar - Fixed width */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onMenuToggle={() => setIsSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 overflow-y-auto"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
      <Toaster position="top-right" theme="dark" richColors />
    </AuthProvider>
  );
}
