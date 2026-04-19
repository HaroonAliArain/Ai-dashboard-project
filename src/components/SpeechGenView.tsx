import React, { useState } from 'react';
import { Mic2, Play, Download, Loader2, Volume2, Settings2, Sparkles, Brain } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleAIError } from '../lib/aiUtils';

export function SpeechGenView() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [mood, setMood] = useState('Professional');

  const voices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const moods = ['Professional', 'Cheerful', 'Calm', 'Urgent', 'Friendly'];

  const createWavHeader = (dataLength: number) => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);

    /* RIFF identifier */
    view.setUint32(0, 0x52494646, false);
    /* file length */
    view.setUint32(4, 36 + dataLength, true);
    /* WAVE identifier */
    view.setUint32(8, 0x57415645, false);
    /* format chunk identifier */
    view.setUint32(12, 0x666d7420, false);
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count (mono) */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, 24000, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, 24000 * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    view.setUint32(36, 0x64617461, false);
    /* data chunk length */
    view.setUint32(40, dataLength, true);

    return buffer;
  };

  const handleGenerate = async () => {
    if (!text.trim() || !user) return;
    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Say ${mood.toLowerCase()}: ${text}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const dataLength = binary.length;
        const header = createWavHeader(dataLength);
        
        const bytes = new Uint8Array(header.byteLength + dataLength);
        bytes.set(new Uint8Array(header), 0);
        
        for (let i = 0; i < dataLength; i++) {
          bytes[header.byteLength + i] = binary.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Log usage to Firestore
        try {
          await addDoc(collection(db, 'users', user.uid, 'speech_usage'), {
            timestamp: serverTimestamp(),
            voice: selectedVoice,
            mood: mood,
            textSnippet: text.slice(0, 50)
          });
        } catch (e) {
          console.error("Failed to log speech usage:", e);
        }
      }
    } catch (error) {
      handleAIError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col py-8 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-google-blue/10 flex items-center justify-center">
          <Mic2 className="w-6 h-6 text-google-blue" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Speech Gen</h2>
          <p className="text-gray-400 text-sm">Advanced neural text-to-speech synthesis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-bright border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <Brain className="w-5 h-5 text-google-blue/20" />
             </div>
             
             <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Input Text</label>
             <textarea
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Enter text to synthesize into high-quality neural speech..."
               className="w-full h-48 bg-surface-dim/50 border border-border focus:border-google-blue outline-none rounded-2xl p-4 text-white placeholder:text-gray-700 resize-none transition-all leading-relaxed"
             />
             
             <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                   <Sparkles className="w-3 h-3 text-google-blue" />
                   Gemini Neural Synthesis Active
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className="px-8 py-3 bg-google-blue hover:bg-google-blue/90 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-3 active:scale-95"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  {isGenerating ? 'Synthesizing...' : 'Generate Speech'}
                </button>
             </div>
          </div>

          <AnimatePresence>
            {audioUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-google-blue/5 border border-google-blue/20 rounded-3xl p-6 flex flex-col items-center gap-6"
              >
                <div className="w-full flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-google-blue/20 flex items-center justify-center text-google-blue">
                      <Volume2 className="w-6 h-6" />
                   </div>
                   <div className="flex-1 h-1.5 bg-google-blue/10 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                        className="absolute top-0 left-0 h-full bg-google-blue" 
                      />
                   </div>
                </div>
                
                <div className="flex items-center gap-4 w-full">
                  <audio controls src={audioUrl} className="flex-1 h-12" />
                  <a 
                    href={audioUrl} 
                    download="generated-speech.wav"
                    className="p-3 bg-surface-bright border border-border rounded-xl text-gray-400 hover:text-white transition-all shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-bright border border-border rounded-3xl p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                <Settings2 className="w-5 h-5 text-google-blue" />
                <h3 className="font-bold text-white uppercase tracking-widest text-xs">Configuration</h3>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Neural Voice</label>
                   <div className="grid grid-cols-2 gap-2">
                      {voices.map(v => (
                        <button
                          key={v}
                          onClick={() => setSelectedVoice(v)}
                          className={cn(
                            "px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center",
                            selectedVoice === v 
                              ? "bg-google-blue/10 border-google-blue text-google-blue font-bold shadow-[0_0_12px_rgba(66,133,244,0.15)]" 
                              : "bg-surface-dim border-border text-gray-500 hover:border-gray-700"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Emotional Tone</label>
                   <select
                     value={mood}
                     onChange={(e) => setMood(e.target.value)}
                     className="w-full bg-surface-dim border border-border rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-google-blue transition-all appearance-none cursor-pointer"
                   >
                      {moods.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                </div>

                <div className="pt-6 border-t border-border mt-6">
                   <div className="bg-surface-dim/50 border border-border rounded-2xl p-4">
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2">Technical Specs</p>
                      <ul className="space-y-2">
                         <li className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-500">Sample Rate</span>
                            <span className="text-gray-400">24kHz / PCM</span>
                         </li>
                         <li className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-500">Processing</span>
                            <span className="text-gray-400">TensorCore AI</span>
                         </li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
      
      {/* Scrollable Bottom Space */}
      <div className="h-12" />
    </div>
  );
}
