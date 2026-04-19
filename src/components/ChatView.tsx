import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send, User, Bot, Loader2, Plus, History, Brain, Copy, Check, Mic, Paperclip, X, FileText, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';
import { db, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  setDoc,
  doc,
  getDocs,
  limit
} from 'firebase/firestore';

import { handleAIError } from '../lib/aiUtils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Thread {
  id: string;
  title: string;
  updatedAt: any;
}

interface Attachment {
  data: string; // base64
  mimeType: string;
  name: string;
}

const CodeBlock = ({ children, className }: { children: any, className?: string }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codeString]);

  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-border bg-black/40 backdrop-blur-sm shadow-2xl group/code">
      <div className="bg-surface-bright/50 px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{match ? match[1] : 'code'}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-google-green" />
              <span className="text-google-green">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto custom-scrollbar">
        <code className={cn("text-[13px] font-mono leading-relaxed text-gray-200", className)}>
          {children}
        </code>
      </pre>
    </div>
  );
};

export function ChatView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user threads
  useEffect(() => {
    if (!user) return;
    const threadsRef = collection(db, 'users', user.uid, 'threads');
    const q = query(threadsRef, orderBy('updatedAt', 'desc'), limit(10));
    
    return onSnapshot(q, (snapshot) => {
      const threadData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Thread[];
      setThreads(threadData);
      
      // Auto-select most recent thread if none selected
      if (!currentThreadId && threadData.length > 0) {
        setCurrentThreadId(threadData[0].id);
      }
    });
  }, [user, currentThreadId]);

  // Sync messages with current thread
  useEffect(() => {
    if (!user || !currentThreadId) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, 'users', user.uid, 'threads', currentThreadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({
        role: doc.data().role === 'model' ? 'assistant' : 'user',
        content: doc.data().content
      })) as Message[];
      setMessages(msgData);
    });
  }, [user, currentThreadId]);

  const [streamingContent, setStreamingContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Synchronize scroll on streaming updates
  useEffect(() => {
    if (scrollRef.current && (streamingContent || messages)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const startNewChat = async () => {
    if (!user) return;
    try {
      const threadsRef = collection(db, 'users', user.uid, 'threads');
      const newThread = await addDoc(threadsRef, {
        title: 'New Conversation',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setCurrentThreadId(newThread.id);
    } catch (e) {
      handleFirestoreError(e, 'create', 'threads');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          data: base64,
          mimeType: file.type,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          setAttachments(prev => [...prev, {
            data: base64,
            mimeType: 'audio/webm',
            name: 'Voice Memo'
          }]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isGenerating || !user) return;

    let activeThreadId = currentThreadId;
    if (!activeThreadId) {
      // Create a thread if none exists
      try {
        const threadsRef = collection(db, 'users', user.uid, 'threads');
        const titleText = input.trim() ? input.slice(0, 30) : (attachments[0]?.name || 'New Attachment Chat');
        const newThread = await addDoc(threadsRef, {
          title: titleText + '...',
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        activeThreadId = newThread.id;
        setCurrentThreadId(activeThreadId);
      } catch (e) {
        handleFirestoreError(e, 'create', 'threads');
      }
    }

    if (!activeThreadId) return;

    const userMessage = input.trim();
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const messagesRef = collection(db, 'users', user.uid, 'threads', activeThreadId, 'messages');
      const threadRef = doc(db, 'users', user.uid, 'threads', activeThreadId);

      // Display text with attachment info if needed
      const displayContent = userMessage + (currentAttachments.length > 0 ? `\n\n[Analysing ${currentAttachments.length} file(s)]` : '');

      // 1. Save User Message
      await addDoc(messagesRef, {
        role: 'user',
        content: displayContent,
        createdAt: serverTimestamp()
      });

      // 2. Setup AI Request
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Prepare parts including attachments
      const parts: any[] = [];
      if (userMessage) parts.push({ text: userMessage });
      currentAttachments.forEach(att => {
        parts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });

      setIsLoading(false); 
      setIsGenerating(true); 

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: 'user', parts: parts }
        ]
      });

      let fullResponse = "";
      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        if (textChunk) {
          fullResponse += textChunk;
          setStreamingContent(fullResponse);
        }
      }
      
      // 3. Save Final AI Message to Cloud
      await addDoc(messagesRef, {
        role: 'model',
        content: fullResponse,
        createdAt: serverTimestamp()
      });

      // 4. Update Thread meta
      await setDoc(threadRef, {
        lastMessage: fullResponse.slice(0, 100),
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (error) {
      handleAIError(error);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="flex h-full max-w-6xl mx-auto py-8 pb-20 px-4 gap-8">
      {/* Thread Sidebar */}
      <div className="hidden lg:flex flex-col w-64 h-full bg-surface-bright/30 border border-border rounded-[32px] p-4">
        <button 
          onClick={startNewChat}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl bg-google-blue text-white font-bold text-sm mb-6 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
            <History className="w-3 h-3" /> Recent History
          </div>
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => setCurrentThreadId(t.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all truncate",
                currentThreadId === t.id ? "bg-google-blue/10 text-google-blue" : "text-gray-400 hover:bg-surface-bright hover:text-gray-200"
              )}
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-google-blue/10 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-google-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Gemini AI Assistant</h2>
            <p className="text-gray-400 text-sm">Synchronized Cloud intelligence with persistent memory</p>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4 custom-scrollbar"
        >
          {messages.length === 0 && !streamingContent && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
              <Brain className="w-16 h-16 text-google-blue mb-4" />
              <h3 className="text-white font-bold">Start a new conversation</h3>
              <p className="text-gray-400 text-sm max-w-xs mt-2">Your chat history is securely encrypted and stored in your private Firebase instance.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' ? "bg-google-blue" : "bg-surface-bright border border-border"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-google-blue" />}
                </div>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-google-blue text-white rounded-tr-none shadow-lg shadow-google-blue/10" 
                    : "bg-surface-bright border border-border text-gray-200 rounded-tl-none"
                )}>
                  <div className="markdown-body">
                    <ReactMarkdown
                      components={{
                        code(props) {
                          const { children, className } = props;
                          const isInline = !className?.includes('language-');
                          
                          if (isInline) {
                            return (
                              <code className="bg-surface-bright/80 px-1.5 py-0.5 rounded-md text-google-green font-mono text-[13px] border border-border/50">
                                {children}
                              </code>
                            );
                          }
                          
                          return <CodeBlock className={className}>{children}</CodeBlock>;
                        },
                        h1: ({children}) => <h1 className="text-2xl font-black text-white mb-4 mt-6 tracking-tight">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 mt-5 tracking-tight">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-bold text-white mb-2 mt-4 tracking-tight">{children}</h3>,
                        // Using div instead of p to avoid hydration errors when blocks are nested (like CodeBlock inside p)
                        p: ({children}) => <div className="mb-4 last:mb-0 text-sm sm:text-base leading-relaxed text-gray-300">{children}</div>,
                        ul: ({children}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-300">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-gray-300">{children}</ol>,
                        li: ({children}) => <li className="pl-1">{children}</li>,
                        strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                        hr: () => <hr className="border-border my-8" />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}

            {streamingContent && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-bright border border-border flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-google-blue" />
                </div>
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-surface-bright border border-border text-gray-200 rounded-tl-none">
                  <div className="markdown-body">
                    <ReactMarkdown
                      components={{
                        code(props) {
                          const { children, className } = props;
                          const isInline = !className?.includes('language-');
                          
                          if (isInline) {
                            return (
                              <code className="bg-surface-bright/80 px-1.5 py-0.5 rounded-md text-google-green font-mono text-[13px] border border-border/50">
                                {children}
                              </code>
                            );
                          }
                          
                          return <CodeBlock className={className}>{children}</CodeBlock>;
                        },
                        h1: ({children}) => <h1 className="text-2xl font-black text-white mb-4 mt-6 tracking-tight">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3 mt-5 tracking-tight">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-bold text-white mb-2 mt-4 tracking-tight">{children}</h3>,
                        // Using div instead of p to avoid hydration errors when blocks are nested (like CodeBlock inside p)
                        p: ({children}) => <div className="mb-4 last:mb-0 text-sm sm:text-base leading-relaxed text-gray-300">{children}</div>,
                        ul: ({children}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-gray-300">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-gray-300">{children}</ol>,
                        li: ({children}) => <li className="pl-1">{children}</li>,
                        strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                        hr: () => <hr className="border-border my-8" />,
                      }}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-bright border border-border flex items-center justify-center">
                <Bot className="w-5 h-5 text-google-blue" />
              </div>
              <div className="bg-surface-bright border border-border px-4 py-3 rounded-2xl rounded-tl-none">
                <Loader2 className="w-5 h-5 text-google-blue animate-spin" />
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface-bright/80 border border-border px-3 py-1.5 rounded-xl text-xs text-gray-300">
                  {att.mimeType.startsWith('audio/') ? <Mic className="w-3 h-3 text-google-blue" /> : <FileText className="w-3 h-3 text-google-green" />}
                  <span className="max-w-[100px] truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="p-0.5 hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative group/input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Recording..." : "Ask Gemini anything, upload files, or use voice..."}
              disabled={isRecording}
              className="w-full bg-surface-bright/50 backdrop-blur-md border border-border focus:border-google-blue outline-none rounded-3xl px-6 py-5 text-white placeholder:text-gray-500 transition-all pr-36 shadow-2xl disabled:opacity-50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                title="Attach Files"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isRecording ? "text-google-red bg-google-red/10 animate-pulse" : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                title="Hold to Record Voice"
              >
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isLoading || isGenerating || isRecording}
                className="p-2.5 rounded-xl bg-google-blue text-white disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-xl"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
