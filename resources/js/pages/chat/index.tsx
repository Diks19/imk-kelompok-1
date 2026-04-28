import { Head, router } from '@inertiajs/react';
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import ChatController from '@/actions/App/Http/Controllers/ChatController';
import { ChatSidebar } from './components/chat-sidebar';
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
}

interface ChatIndexProps {
    conversations: Conversation[];
    currentConversation?: Conversation;
    messages: Message[];
}

export default function ChatIndex({ conversations, currentConversation, messages }: ChatIndexProps) {
    const handleSendMessage = (prompt: string) => {
        router.post(ChatController.storeMessage().url(), {
            content: prompt,
            conversation_id: currentConversation?.id || null,
        });
    };

    return (
        <AppLayout>
            <Head title="Chat" />
            <div className="flex h-[calc(100vh-4rem)]">
                <ChatSidebar 
                    conversations={conversations} 
                    currentConversationId={currentConversation?.id} 
                />

                <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 overflow-y-auto p-4">
                        <MessageList messages={messages} />
                    </div>

                    <MessageInput onSubmit={handleSendMessage} />
                </div>
            </div>
        </AppLayout>
    );
}
