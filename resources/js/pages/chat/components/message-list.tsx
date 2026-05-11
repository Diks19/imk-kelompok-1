import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Attachment {
    id: number;
    path: string;
    original_name?: string;
    type: 'uploaded_vision' | 'generated_output';
}

interface Message {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string | null;
    attachments?: Attachment[];
}

interface MessageListProps {
    messages: Message[];
}

function ThoughtBlock({ thoughts, isStreaming }: { thoughts: string, isStreaming?: boolean }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="w-full mb-2 animate-in fade-in duration-500">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-900/30 hover:bg-zinc-900/50 rounded-lg border border-zinc-800/50 transition-colors w-full group text-left"
            >
                {isOpen ? <ChevronDown className="size-3 text-zinc-500" /> : <ChevronRight className="size-3 text-zinc-500" />}
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter italic">
                    {isStreaming ? 'AI is thinking...' : 'Thought Process'}
                </span>
            </button>
            
            {isOpen && (
                <div className="mt-1 bg-zinc-900/20 border-l-2 border-purple-500/30 p-4 rounded-r-xl italic text-zinc-400 text-xs leading-relaxed animate-in slide-in-from-top-1 duration-200">
                    <p className="whitespace-pre-wrap">{thoughts}</p>
                    {isStreaming && (
                         <div className="flex gap-1 mt-2">
                            <div className="size-1 bg-purple-500/50 rounded-full animate-pulse"></div>
                            <div className="size-1 bg-purple-500/50 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="size-1 bg-purple-500/50 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function MessageList({ messages }: MessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 animate-in fade-in duration-700">
                <div className="size-12 rounded-2xl bg-purple-600/10 flex items-center justify-center border border-purple-600/20">
                    <span className="text-purple-500 font-bold">AI</span>
                </div>
                <p className="text-lg font-medium tracking-tight">How can I help you today?</p>
            </div>
        );
    }

    const parseContent = (content: string | null) => {
        if (!content) return { thoughts: null, finalContent: null, isStreamingThoughts: false };
        
        // Handle complete thought block (case-insensitive for safety)
        const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);
        if (thinkMatch) {
            const thoughts = thinkMatch[1].trim();
            let finalContent: string | null = content.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
            if (finalContent === '') finalContent = null;
            return { thoughts, finalContent, isStreamingThoughts: false };
        }
        
        // Handle streaming thought block (open but not closed)
        const openThinkMatch = content.match(/<think>([\s\S]*)$/i);
        if (openThinkMatch) {
            const thoughts = openThinkMatch[1].trim();
            let finalContent: string | null = content.replace(/<think>[\s\S]*$/i, '').trim();
            if (finalContent === '') finalContent = null;
            return { thoughts, finalContent, isStreamingThoughts: true };
        }

        // Catch edge case where just "<think" comes through from a partial chunk
        if (content.trim().startsWith('<thin') && !content.includes('>')) {
             return { thoughts: null, finalContent: null, isStreamingThoughts: true };
        }

        return { thoughts: null, finalContent: content, isStreamingThoughts: false };
    };

    return (
        <div className="space-y-6 pb-20">
            {messages.map((msg) => {
                const { thoughts, finalContent, isStreamingThoughts } = parseContent(msg.content);
                
                return (
                    <div 
                        key={msg.id} 
                        className={cn(
                            "flex w-full animate-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        <div className={cn(
                            "max-w-[85%] md:max-w-[70%] space-y-1",
                            msg.role === 'user' ? "flex flex-col items-end" : "flex flex-col items-start"
                        )}>
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="grid grid-cols-1 gap-2 mb-1">
                                    {msg.attachments.map((att) => (
                                        <div key={att.id}>
                                            {att.path.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || att.path.startsWith('http') ? (
                                                <img 
                                                    src={att.path} 
                                                    alt="Attachment" 
                                                    className="max-h-64 rounded-xl border border-zinc-800 object-cover shadow-lg" 
                                                />
                                            ) : (
                                                <a 
                                                    href={att.path} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 p-3 bg-zinc-800 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-zinc-700 transition-colors shadow-sm text-sm"
                                                >
                                                    <span>📄</span>
                                                    <span className="truncate max-w-[200px]">{att.original_name || 'Document'}</span>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {thoughts && thoughts.length > 0 && (
                                <ThoughtBlock 
                                    thoughts={thoughts} 
                                    isStreaming={isStreamingThoughts} 
                                />
                            )}

                            {finalContent && (
                                <div className={cn(
                                    "rounded-2xl p-4 shadow-sm",
                                    msg.role === 'user' 
                                        ? "bg-purple-600 text-white rounded-tr-none" 
                                        : "bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-tl-none prose prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700 max-w-none prose-sm"
                                )}>
                                    {msg.role === 'user' ? (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{finalContent}</p>
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {finalContent}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
