import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (!isStreaming) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    }, [isStreaming]);

    return (
        <div className="w-full mb-2 animate-in fade-in duration-500">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-200 dark:bg-zinc-900/30 hover:bg-zinc-300 dark:hover:bg-zinc-900/50 rounded-lg border border-zinc-300 dark:border-zinc-800/50 transition-colors w-full group text-left"
            >
                {isOpen ? <ChevronDown className="size-3 text-zinc-500" /> : <ChevronRight className="size-3 text-zinc-500" />}
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter italic">
                    {isStreaming ? 'AI is thinking...' : 'Thought Process'}
                </span>
            </button>
            
            {isOpen && (
                <div className="mt-1 bg-zinc-100 dark:bg-zinc-900/20 border-l-2 border-purple-400 dark:border-purple-500/30 p-4 rounded-r-xl italic text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed animate-in slide-in-from-top-1 duration-200">
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
        
        // Find all completed thought blocks
        const allCompletedThoughts: string[] = [];
        let tempContent = content;
        const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
        let match;
        
        while ((match = thinkRegex.exec(content)) !== null) {
            allCompletedThoughts.push(match[1].trim());
        }

        // Remove all completed tags from the final view
        const finalContentCleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        
        // Handle a potential ongoing/streaming thought at the very end
        const openThinkMatch = finalContentCleaned.match(/<think>([\s\S]*)$/i);
        
        let thoughts = allCompletedThoughts.length > 0 ? allCompletedThoughts.join('\n\n---\n\n') : null;
        let finalContent: string | null = finalContentCleaned;
        let isStreamingThoughts = false;

        if (openThinkMatch) {
            const streamingPart = openThinkMatch[1].trim();
            thoughts = thoughts ? `${thoughts}\n\n---\n\n${streamingPart}` : streamingPart;
            finalContent = finalContentCleaned.replace(/<think>[\s\S]*$/i, '').trim();
            isStreamingThoughts = true;
        }

        if (finalContent === '') finalContent = null;

        // Catch edge case where just "<think" comes through from a partial chunk
        if (!isStreamingThoughts && finalContent && finalContent.trim().startsWith('<thin') && !finalContent.includes('>')) {
             return { thoughts, finalContent: null, isStreamingThoughts: true };
        }

        return { thoughts, finalContent, isStreamingThoughts };
    };

    return (
        <div className="space-y-6 pb-4">
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
                            "max-w-[85%] md:max-w-full space-y-1 w-full",
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
                                                    className="max-h-64 rounded-xl border border-zinc-200 dark:border-zinc-800 object-cover shadow-lg" 
                                                />
                                            ) : (
                                                <a 
                                                    href={att.path} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-purple-600 dark:text-purple-400 hover:text-purple-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm text-sm"
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
                                    "flex gap-4",
                                    msg.role === 'user' ? "justify-end" : "justify-start w-full"
                                )}>
                                    {msg.role === 'assistant' && (
                                        <div className="size-8 rounded-xl bg-purple-600 dark:bg-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                            <span className="text-white text-xs font-bold font-serif">✺</span>
                                        </div>
                                    )}
                                    <div className={cn(
                                        msg.role === 'user' 
                                            ? "bg-purple-600 dark:bg-zinc-800 text-white dark:text-zinc-100 rounded-3xl px-5 py-3 text-base shadow-sm max-w-xl" 
                                            : "text-zinc-800 dark:text-zinc-100 prose prose-p:leading-relaxed prose-pre:bg-zinc-100 prose-pre:border prose-pre:border-zinc-200 dark:prose-invert dark:prose-pre:bg-zinc-900 dark:prose-pre:border-zinc-800 max-w-none prose-base pt-1 font-serif"
                                    )}>
                                        {msg.role === 'user' ? (
                                            <p className="leading-relaxed whitespace-pre-wrap">{finalContent}</p>
                                        ) : (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {finalContent}
                                            </ReactMarkdown>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {/* Spacer to push content above the floating input */}
            <div className="h-32 w-full shrink-0"></div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
