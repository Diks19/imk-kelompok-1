import React from 'react';

interface Message {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface MessageListProps {
    messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                How can I help you today?
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                    </div>
                </div>
            ))}
        </div>
    );
}
