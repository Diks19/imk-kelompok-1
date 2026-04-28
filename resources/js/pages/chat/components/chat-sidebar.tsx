import { Link } from '@inertiajs/react';
import React from 'react';

interface Conversation {
    id: number;
    title: string;
}

interface ChatSidebarProps {
    conversations: Conversation[];
    currentConversationId?: number;
}

export function ChatSidebar({ conversations, currentConversationId }: ChatSidebarProps) {
    return (
        <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto flex flex-col">
            <div className="p-4">
                <Link
                    href="/chat"
                    className="block w-full text-center bg-blue-600 text-white rounded p-2 text-sm font-medium hover:bg-blue-700"
                >
                    + New Chat
                </Link>
            </div>
            <div className="flex-1 px-3">
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Recent</div>
                {conversations.map((conv) => (
                    <Link
                        key={conv.id}
                        href={`/chat/${conv.id}`}
                        className={`block p-2 rounded text-sm mb-1 truncate ${currentConversationId === conv.id ? 'bg-gray-200 font-medium' : 'hover:bg-gray-100'}`}
                    >
                        {conv.title}
                    </Link>
                ))}
            </div>
        </div>
    );
}
