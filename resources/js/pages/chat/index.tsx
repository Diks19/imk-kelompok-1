import { Head, router, usePage } from '@inertiajs/react';
import React, { useEffect, useRef, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import ChatController from '@/actions/App/Http/Controllers/ChatController';
import { MessageList } from './components/message-list';
import { MessageInput } from './components/message-input';

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
            <Head title={currentConversation?.title || 'New Chat'} />
            <div className="flex flex-col h-screen bg-zinc-950">
                {/* Minimalist Top Bar */}
                <header className="h-14 border-b border-zinc-900 flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-zinc-100 font-medium text-sm">
                        {currentConversation?.title || 'New Chat'}
                    </h1>

                    <div className="flex items-center gap-4">
                        <select 
                            value={selectedModel}
                            onChange={handleModelChange}
                            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-1.5 outline-none transition-all hover:border-zinc-700"
                        >
                            {availableModels.filter((m: any) => !m.name.includes('nomic-embed-text')).map((model: any) => (
                                <option key={model.name} value={model.name}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
                        <MessageList messages={messages} />
                        {isTyping && (
                            <div className="flex justify-start animate-in fade-in duration-500 mt-4">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 rounded-tl-none">
                                    <div className="flex gap-1">
                                        <div className="size-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="size-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="size-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 md:p-8 pt-0">
                    <MessageInput onSubmit={handleSendMessage} disabled={isTyping} />
                </div>
            </div>
        </>
    );
}
