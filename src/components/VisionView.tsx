import { GoogleGenAI } from "@google/genai";
import { Camera, Image as ImageIcon, Loader2, RefreshCw, Sparkles, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';

import { db, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { handleAIError } from '../lib/aiUtils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function VisionView() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image || !user) return;
    setIsAnalyzing(true);

    try {
      const mimeType = image.split(';')[0].split(':')[1];
      const base64Data = image.split(',')[1];
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: "Analyze this image in detail. Provide: 1. A summary of the scene. 2. Key objects detected. 3. Suggestions for developers or creative insights based on the content." },
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ]
        }
      });

      const textOutput = result.text || '';
      setAnalysis(textOutput);

      // Log usage to Firestore
      try {
        await addDoc(collection(db, 'users', user.uid, 'vision_usage'), {
          timestamp: serverTimestamp(),
          prompt: "Analyze this image",
          outputSnippet: textOutput.slice(0, 100)
        });
      } catch (e) {
        console.error("Failed to log vision usage:", e);
      }

    } catch (error) {
      handleAIError(error);
      setAnalysis('Failed to analyze image. Ensure the image is valid and your API key is correct.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-google-green/10 flex items-center justify-center">
          <Camera className="w-6 h-6 text-google-green" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">AI Vision Analyzer</h2>
          <p className="text-gray-400 text-sm">Upload images for deep intelligence and object detection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-12">
        {/* Upload Section */}
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
              image ? "border-google-green/50" : "border-border hover:border-gray-500 bg-surface-dim"
            )}
          >
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-white font-medium flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Change Image
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-bright flex items-center justify-center mx-auto mb-4 border border-border">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Click to upload image</p>
                  <p className="text-gray-500 text-sm mt-1">Supports PNG, JPG, WEBP</p>
                </div>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <button
            onClick={analyzeImage}
            disabled={!image || isAnalyzing}
            className="w-full h-14 rounded-2xl bg-google-green text-white font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale shadow-xl shadow-google-green/10"
          >
            {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            {isAnalyzing ? "Analyzing Intelligence..." : "Run AI Analysis"}
          </button>
        </div>

        {/* Results Section */}
        <div className="h-full min-h-[400px]">
          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface-bright border border-border rounded-3xl p-6 h-full shadow-2xl overflow-y-auto max-h-[600px] custom-scrollbar"
              >
                <div className="flex items-center gap-2 text-google-green font-bold mb-4 uppercase tracking-widest text-xs">
                  <Sparkles className="w-4 h-4" /> Gemini Intelligence
                </div>
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed overflow-hidden">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h1 className="text-xl font-bold text-white mb-4 mt-6">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-bold text-white mb-3 mt-5">{children}</h2>,
                      h3: ({children}) => <h3 className="text-md font-bold text-white mb-2 mt-4">{children}</h3>,
                      p: ({children}) => <div className="mb-4 last:mb-0 leading-relaxed">{children}</div>,
                      ul: ({children}) => <ul className="list-disc pl-5 mb-4 space-y-2">{children}</ul>,
                      li: ({children}) => <li className="pl-1">{children}</li>,
                      strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full border border-border border-dashed rounded-3xl flex flex-col items-center justify-center p-8 bg-surface-dim/50 text-center"
              >
                <ImageIcon className="w-16 h-16 text-gray-700 mb-4" />
                <h3 className="text-gray-400 font-medium">No active analysis</h3>
                <p className="text-gray-600 text-sm mt-2">Upload an image and click analyze to see Gemini's computer vision output</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scrollable Bottom Space */}
      <div className="h-32" />
    </div>
  );
}
