import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import ChatController from '@/actions/App/Http/Controllers/ChatController';
import { MessageList } from './components/message-list';
import { MessageInput } from './components/message-input';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';

interface Conversation {
    id: number;
    title: string;
}

interface Message {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: any[];
}

interface ChatIndexProps {
    conversations: Conversation[];
    currentConversation?: Conversation & { model: string | null };
    messages: Message[];
    availableModels: any[];
}

export default function ChatIndex({ currentConversation, messages: initialMessages = [], availableModels = [] }: ChatIndexProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedModel, setSelectedModel] = useState(currentConversation?.model || 'deepseek-r1:8b');
    const { appearance, updateAppearance } = useAppearance();

    // Sync state with props
    useEffect(() => {
        setMessages(initialMessages);
        if (currentConversation?.model) {
            setSelectedModel(currentConversation.model);
        }
    }, [initialMessages, currentConversation?.model]);

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        setSelectedModel(newModel);
        
        if (currentConversation) {
            router.patch(`/chat/${currentConversation.id}/model`, {
                model: newModel
            }, {
                preserveScroll: true
            });
        }
    };

    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    const handleSendMessage = (prompt: string, image?: File | null) => {
        setIsTyping(true);
        
        // Optimistic Update
        const tempId = Date.now();
        const optimisticMessage: Message = {
            id: tempId,
            role: 'user',
            content: prompt,
            attachments: image ? [{ id: -1, path: URL.createObjectURL(image), original_name: image.name, type: 'uploaded_vision' }] : [],
        };
        
        setMessages(prev => [...prev, optimisticMessage]);

        router.post(ChatController.storeMessage().url, {
            content: prompt,
            conversation_id: currentConversation?.id || null,
            image: image || null,
            model: selectedModel, // selectedModel matches state
        }, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                // Background job will handle the assistant response
            },
            onError: () => {
                setIsTyping(false);
            }
        });
    };

    useEffect(() => {
        if (!currentConversation || typeof window === 'undefined' || !(window as any).Echo) return;

        // Ensure we stop listening to old channels if currentConversation changes quickly
        const channelName = `conversation.${currentConversation.id}`;
        const channel = (window as any).Echo.private(channelName);

        channel.listen('.token.streamed', (event: { messageId: number, token: string }) => {
                setIsTyping(false); // Hide the typing indicator once we get actual tokens
                setMessages(prev => {
                    const messageExists = prev.find(m => m.id === event.messageId);
                    
                    if (messageExists) {
                        return prev.map(m => 
                            m.id === event.messageId 
                                ? { ...m, content: event.token } 
                                : m
                        );
                    } else {
                        return [...prev, {
                            id: event.messageId,
                            role: 'assistant',
                            content: event.token
                        }];
                    }
                });
            })
            .listen('.message.updated', (event: { message: Message }) => {
                setIsTyping(false);
                setMessages(prev => {
                    const messageExists = prev.find(m => m.id === event.message.id);
                    if (messageExists) {
                        return prev.map(m => m.id === event.message.id ? event.message : m);
                    } else {
                        return [...prev, event.message];
                    }
                });
            });

        return () => {
            (window as any).Echo.leave(channelName);
        };
    }, [currentConversation?.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    return (
        <>
            <Head title={currentConversation?.title || 'LarAI Chat'} />
            <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 font-sans transition-colors duration-300">
                {/* Transparent Top Bar */}
                <header className="h-16 flex items-center justify-between px-8 shrink-0 relative z-10">
                    <h1 className="text-zinc-800 dark:text-zinc-100 font-medium text-lg flex items-center gap-2 font-serif">
                        <span className="text-2xl text-purple-600 dark:text-purple-500">✺</span> LarAI 
                    </h1>

                    <div className="flex items-center gap-4">
                        <select 
                            value={selectedModel}
                            onChange={handleModelChange}
                            className="bg-transparent text-zinc-500 dark:text-zinc-400 text-sm font-medium focus:ring-0 cursor-pointer block p-1.5 outline-none transition-all hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                            {availableModels.filter((m: any) => !m.name.includes('nomic-embed-text')).map((model: any) => (
                                <option key={model.name} value={model.name} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                                    {model.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
                            title="Toggle Theme"
                        >
                            {appearance === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
                        </button>
                    </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide relative z-0">
                    <div className="max-w-3xl mx-auto w-full p-4 md:p-8 pb-48">
                        <MessageList messages={messages} />
                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in duration-500 mt-4 gap-4 w-full">
                                <div className="size-8 rounded-xl bg-purple-600 dark:bg-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                    <span className="text-white text-xs font-bold font-serif">✺</span>
                                </div>
                                <div className="pt-3 flex gap-1">
                                    <div className="size-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="size-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="size-1.5 bg-zinc-400 dark:bg-zinc-600 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 w-full bg-gradient-to-t from-zinc-50 via-zinc-50/90 dark:from-zinc-950 dark:via-zinc-950/90 to-transparent pt-12 pb-6 px-4 md:px-8 z-20">
                    <div className="max-w-2xl mx-auto w-full">
                        <MessageInput onSubmit={handleSendMessage} disabled={isTyping} />
                    </div>
                </div>
            </div>
        </>
    );
}
