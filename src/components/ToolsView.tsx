import { GoogleGenAI } from "@google/genai";
import { Code, FileText, Lightbulb, Loader2, Play, Sparkles, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { cn } from '../lib/utils';

import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleAIError } from '../lib/aiUtils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type ToolType = 'summarize' | 'code' | 'ideas';

export function ToolsView() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('summarize');

  const runTool = async () => {
    if (!input.trim() || !user) return;
    setIsLoading(true);
    setOutput('');

    try {
      let prompt = '';
      if (activeTool === 'summarize') {
        prompt = `Summarize the following text into key bullet points:\n\n${input}`;
      } else if (activeTool === 'code') {
        prompt = `Generate high-quality, documented code for the following request. Use modern best practices:\n\n${input}`;
      } else if (activeTool === 'ideas') {
        prompt = `Brainstorm at least 10 creative and unique ideas for:\n\n${input}`;
      }

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: prompt }] }
      });
      const textOutput = result.text || '';
      setOutput(textOutput);

      // Log usage to Firestore
      try {
        await addDoc(collection(db, 'users', user.uid, 'tools_usage'), {
          timestamp: serverTimestamp(),
          toolType: activeTool,
          inputSnippet: input.slice(0, 100)
        });
      } catch (e) {
        console.error("Failed to log tool usage:", e);
      }

    } catch (e) {
      handleAIError(e);
      setOutput("An error occurred while running the AI tool.");
    } finally {
      setIsLoading(false);
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const tools = [
    { id: 'summarize', label: 'Summarizer', icon: FileText, color: 'text-google-blue', bg: 'bg-google-blue/10' },
    { id: 'code', label: 'Code Gen', icon: Code, color: 'text-google-green', bg: 'bg-google-green/10' },
    { id: 'ideas', label: 'Brainstorm', icon: Lightbulb, color: 'text-google-yellow', bg: 'bg-google-yellow/10' },
  ];

  return (
    <div className="flex flex-col max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-google-red/10 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-google-red" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Power Tools</h2>
          <p className="text-gray-400 text-sm">Automated productivity workflows powered by Gemini</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 mb-10 pb-2 custom-scrollbar">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as ToolType)}
            className={cn(
              "flex items-center justify-center sm:justify-start gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border transition-all active:scale-95",
              activeTool === tool.id 
                ? `${tool.bg} border-google-red/20 shadow-xl shadow-google-red/5` 
                : "bg-surface-bright/30 border-border text-gray-500 hover:bg-surface-bright hover:border-gray-500"
            )}
          >
            <tool.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", activeTool === tool.id ? tool.color : "text-gray-500")} />
            <span className={cn("font-bold text-xs sm:text-sm", activeTool === tool.id ? "text-white" : "text-gray-500")}>
              {tool.label}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start mb-12">
        <div className="space-y-4 sm:space-y-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeTool === 'summarize' ? "Paste long text to summarize..." :
              activeTool === 'code' ? "Describe the utility or component you want to build..." :
              "What topic are we brainstorming for?"
            }
            className="w-full h-64 sm:h-80 bg-surface-bright/50 backdrop-blur-sm border border-border focus:border-google-red outline-none rounded-3xl p-6 text-white placeholder:text-gray-600 transition-all resize-none shadow-2xl overflow-y-auto custom-scrollbar"
          />
          <button
            onClick={runTool}
            disabled={!input.trim() || isLoading}
            className="w-full h-14 rounded-2xl bg-google-red text-white font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-google-red/10"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
            <span className="truncate">{isLoading ? "Processing AI..." : `Generate ${activeTool.toUpperCase()}`}</span>
          </button>
        </div>

        <div className="bg-surface-dim border border-dashed border-border rounded-3xl min-h-[300px] lg:min-h-[460px] relative overflow-hidden group">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-google-red font-bold uppercase tracking-widest text-[10px] opacity-50">
            <Sparkles className="w-3 h-3" /> Output Terminal
          </div>
          
          <div className="h-full">
            <AnimatePresence mode="wait">
              {output ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={activeTool + output.length}
                  className="p-6 sm:p-8 pt-12 font-mono text-xs sm:text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[400px] lg:max-h-[460px] overflow-y-auto custom-scrollbar"
                >
                  <ReactMarkdown
                    components={{
                      code(props) {
                        const { children, className, ...rest } = props;
                        return (
                          <code className={cn("bg-surface-bright px-1.5 py-0.5 rounded-md text-google-green", className)} {...rest}>
                            {children}
                          </code>
                        );
                      },
                      p: ({children}) => <div className="mb-4 last:mb-0 leading-relaxed">{children}</div>,
                    }}
                  >
                    {output}
                  </ReactMarkdown>
                </motion.div>
              ) : (
                <div className="h-full min-h-[300px] lg:min-h-[460px] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-surface-bright border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-google-red/50 ml-1" />
                  </div>
                  <h3 className="text-gray-500 font-medium">Ready for generation</h3>
                  <p className="text-gray-600 text-[10px] sm:text-xs mt-2 max-w-[200px]">Results will appear here in high precision format using Gemini 3.1 Flash</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Scrollable Bottom Space */}
      <div className="h-12" />
    </div>
  );
}
