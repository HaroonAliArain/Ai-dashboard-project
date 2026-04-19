import { Activity, Brain, Mic2, MessageSquare, Zap, Clock, ShieldCheck, Cpu, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, getCountFromServer, query } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

interface OverviewProps {
  onNavigate: (view: string) => void;
}

export function OverviewView({ onNavigate }: OverviewProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    chat: 0,
    vision: 0,
    speech: 0,
    tools: 0,
    loading: true
  });

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        const chatQuery = query(collection(db, 'users', user.uid, 'threads'));
        const visionQuery = query(collection(db, 'users', user.uid, 'vision_usage'));
        const speechQuery = query(collection(db, 'users', user.uid, 'speech_usage'));
        const toolsQuery = query(collection(db, 'users', user.uid, 'tools_usage'));

        const [chatSnapshot, visionSnapshot, speechSnapshot, toolsSnapshot] = await Promise.all([
          getCountFromServer(chatQuery),
          getCountFromServer(visionQuery),
          getCountFromServer(speechQuery),
          getCountFromServer(toolsQuery)
        ]);

        setCounts({
          chat: chatSnapshot.data().count,
          vision: visionSnapshot.data().count,
          speech: speechSnapshot.data().count,
          tools: toolsSnapshot.data().count,
          loading: false
        });
      } catch (error) {
        console.error("Error fetching overview counts:", error);
        setCounts(prev => ({ ...prev, loading: false }));
      }
    };

    fetchCounts();
  }, [user]);

  const totalIntelligence = counts.chat + counts.vision + counts.speech + counts.tools;

  const stats = [
    { label: 'Intelligence Ops', value: counts.loading ? '...' : totalIntelligence.toString(), icon: Brain, color: 'text-google-blue', bg: 'bg-google-blue/10' },
    { label: 'Total Conversations', value: counts.loading ? '...' : counts.chat.toString(), icon: MessageSquare, color: 'text-google-green', bg: 'bg-google-green/10' },
    { label: 'Vision Analyses', value: counts.loading ? '...' : counts.vision.toString(), icon: ShieldCheck, color: 'text-google-yellow', bg: 'bg-google-yellow/10' },
    { label: 'Neural Syntheses', value: counts.loading ? '...' : counts.speech.toString(), icon: Mic2, color: 'text-google-red', bg: 'bg-google-red/10' },
  ];

  const features = [
    { id: 'chat', title: 'Neural Chat', desc: 'Real-time context-aware assistant powered by multi-turn Gemini 3.1 architecture.', icon: MessageSquare, color: 'border-google-blue/20' },
    { id: 'vision', title: 'Visual Compute', desc: 'Enterprise-grade computer vision for object detection and scene analysis.', icon: ShieldCheck, color: 'border-google-green/20' },
    { id: 'speechGen', title: 'Vocal Synthesis', desc: 'High-fidelity neural text-to-speech engine with emotional tone control.', icon: Mic2, color: 'border-google-yellow/20' },
    { id: 'tools', title: 'Core Processing', desc: 'Edge-based low-latency reasoning via optimized Google AI Studio runtime.', icon: Cpu, color: 'border-google-red/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 pb-20 px-4 h-full overflow-y-auto custom-scrollbar">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back, Developer</h2>
          <p className="text-gray-400">Your unified AI intelligence dashboard is standing by for instructions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-google-blue/10 border border-google-blue/20 text-google-blue text-xs font-bold uppercase tracking-widest">
            System Live
          </div>
          <div className="px-4 py-2 rounded-full bg-surface-bright border border-border text-gray-400 text-xs font-bold uppercase tracking-widest">
            v3.2.0-stable
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface-bright border border-border rounded-3xl p-6 hover:border-gray-600 transition-colors group"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Core Pipeline Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              onClick={() => onNavigate(f.id)}
              className={cn("bg-surface-bright/50 border rounded-3xl p-8 flex gap-6 hover:bg-surface-bright transition-all text-left group active:scale-[0.98]", f.color)}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-bright border border-border flex items-center justify-center flex-shrink-0 group-hover:bg-surface-dim transition-colors">
                <f.icon className="w-6 h-6 text-gray-300 group-hover:text-google-blue transition-colors" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-google-blue/10 via-transparent to-google-red/5 rounded-[40px] border border-border p-8 md:p-12 text-center relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-20">
          <Brain className="w-64 h-64 text-google-blue" />
        </div>
        <div className="relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 tracking-tight">Accelerate Your Workflow with <span className="text-google-blue">Nexus AI</span></h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-base md:text-lg">Nexus is designed for the modern developer. Integrate computer vision, neural speech, and neural reasoning into your daily stack with one unified hub.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => onNavigate('chat')}
              className="px-8 py-4 rounded-2xl bg-google-blue text-white font-bold hover:shadow-2xl hover:shadow-google-blue/20 transition-all active:scale-95 text-lg"
            >
              Explore Intelligence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
