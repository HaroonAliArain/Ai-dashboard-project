import React from 'react';
import { 
  MessageCircle, 
  Camera, 
  Mic2, 
  Code, 
  FileText, 
  Lightbulb, 
  Zap, 
  Brain, 
  Cpu, 
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export function FeaturesView() {
  const mainFeatures = [
    {
      title: "AI Chat Assistant",
      description: "Advanced conversational agent with persistent thread memory and real-time streaming responses.",
      icon: MessageCircle,
      color: "text-google-blue",
      bg: "bg-google-blue/10",
      details: ["Persistent History", "Markdown Support", "Real-time Streaming"]
    },
    {
      title: "Vision & Image Analysis",
      description: "Deep object detection and scene intelligence powered by Gemini's computer vision capabilities.",
      icon: Camera,
      color: "text-google-green",
      bg: "bg-google-green/10",
      details: ["Object Recognition", "Creative Insights", "Scene Description"]
    },
    {
      title: "Neural Speech Gen",
      description: "High-fidelity text-to-speech synthesis using advanced neural voices with emotional tone control.",
      icon: Mic2,
      color: "text-google-blue",
      bg: "bg-google-blue/10",
      details: ["5 Distinct Voices", "Tone Selection", "WAV Downloads"]
    }
  ];

  const powerTools = [
    {
      title: "Code Writer",
      description: "Generate production-ready code, components, and logic using modern best practices.",
      icon: Code,
      color: "text-google-green",
      bg: "bg-google-green/10"
    },
    {
      title: "Smart Summarizer",
      description: "Distill long documents and dense information into concise, actionable bullet points.",
      icon: FileText,
      color: "text-google-blue",
      bg: "bg-google-blue/10"
    },
    {
      title: "Idea Brainstormer",
      description: "Overcome creative blocks with instant, high-quality ideation and strategic planning.",
      icon: Lightbulb,
      color: "text-google-yellow",
      bg: "bg-google-yellow/10"
    }
  ];

  return (
    <div className="flex flex-col py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">System Capabilities</h2>
          <p className="text-gray-400 text-sm">Professional AI orchestration layer powered by Gemini 3.1 Flash</p>
        </div>
      </div>

      <div className="space-y-16">
        {/* Core Modules */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-5 h-5 text-google-red" />
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">Core UI Modules</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mainFeatures.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-bright/30 border border-border rounded-[32px] p-6 hover:bg-surface-bright/50 transition-all group"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", f.bg)}>
                  <f.icon className={cn("w-6 h-6", f.color)} />
                </div>
                <h4 className="text-lg font-bold text-white mb-3">{f.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed mb-6">{f.description}</p>
                <div className="space-y-2">
                  {f.details.map(d => (
                    <div key={d} className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-google-green" />
                      {d}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Intelligence Layer */}
        <section className="bg-gradient-to-br from-surface-bright to-surface-dim border border-border rounded-[40px] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Brain className="w-64 h-64 text-white" />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-google-red/10 border border-google-red/20 text-google-red text-[10px] font-bold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" /> Ultra-Fast Delivery
            </div>
            <h3 className="text-3xl font-black text-white mb-6">Enterprise Intelligence</h3>
            <p className="text-gray-400 max-w-2xl leading-relaxed mb-10 italic">
              "Experience the next generation of AI integration. We combine the raw power of Gemini 3.1 Flash with a low-latency streaming infrastructure to deliver instant intelligence."
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-google-blue" />
                </div>
                <div>
                  <h5 className="text-white font-bold mb-1">Secure & Persistent</h5>
                  <p className="text-sm text-gray-500">All interactions are encrypted and stored in your personalized Firebase instance, ensuring data privacy and thread continuity.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-5 h-5 text-google-green" />
                </div>
                <div>
                  <h5 className="text-white font-bold mb-1">Optimized Inference</h5>
                  <p className="text-sm text-gray-500">Leverage Gemini's 3.1 Flash architecture for the perfect balance of deep reasoning and near-instant processing speed.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Productivity Tools */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-5 h-5 text-google-yellow" />
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">Productivity Power Tools</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {powerTools.map((t, i) => (
              <motion.div 
                key={t.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-5 p-4 rounded-3xl hover:bg-white/5 transition-all"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", t.bg)}>
                  <t.icon className={cn("w-5 h-5", t.color)} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{t.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Scrollable Bottom Space */}
      <div className="h-12" />
    </div>
  );
}
