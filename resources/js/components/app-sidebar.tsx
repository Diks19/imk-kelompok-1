import { Link, usePage, router } from '@inertiajs/react';
import { LayoutGrid, MessageSquare, Plus, PanelLeft, Settings, LogOut, Trash2, Pencil } from 'lucide-react';
import React, { useState } from 'react';

interface Conversation {
    id: number;
    title: string | null;
}

export function AppSidebar() {
    const { props, url } = usePage<any>();
    const conversations = (props.conversations as Conversation[]) || [];
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        }
        return false;
    });

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', String(newState));
    };

    const handleDeleteChat = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Are you sure you want to delete this chat?')) {
            router.delete(`/chat/${id}`);
        }
    };

    const handleRenameChat = (e: React.MouseEvent, id: number, currentTitle: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        
        const newTitle = prompt('Enter a new title for this chat:', currentTitle || '');
        if (newTitle !== null && newTitle.trim() !== '') {
            router.patch(`/chat/${id}/title`, {
                title: newTitle.trim()
            }, {
                preserveScroll: true
            });
        }
    };

    return (
        <aside 
            className={`flex flex-col bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 h-screen shrink-0 ${
                isCollapsed ? 'w-20' : 'w-72'
            }`}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between min-h-[72px]">
                {!isCollapsed ? (
                    <>
                        <Link href="/" className="flex items-center gap-2 px-2 shrink-0">
                            <div className="size-8 rounded-lg bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                                <span className="text-white font-bold">L</span>
                            </div>
                            <span className="text-zinc-900 dark:text-zinc-100 font-bold tracking-tight text-xl text-nowrap font-serif">LarAI</span>
                        </Link>
                        <button 
                            onClick={toggleCollapse}
                            className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors"
                            title="Collapse Sidebar"
                        >
                            <PanelLeft className="size-5" />
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={toggleCollapse}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors mx-auto"
                        title="Expand Sidebar"
                    >
                        <PanelLeft className="size-5" />
                    </button>
                )}
            </div>

            {/* New Chat Button */}
            <div className="px-4 py-2">
                <Link
                    href="/chat"
                    className={`flex items-center gap-3 bg-purple-600 dark:bg-purple-500 hover:bg-purple-500 dark:hover:bg-purple-400 text-white rounded-xl transition-all h-12 ${
                        isCollapsed ? 'justify-center w-12 mx-auto' : 'px-4 w-full'
                    }`}
                >
                    <Plus className="size-5 shrink-0" />
                    {!isCollapsed && <span className="font-medium text-nowrap">New Chat</span>}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">
                <div>
                    {!isCollapsed && (
                        <h3 className="px-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">
                            History
                        </h3>
                    )}
                    <div className="space-y-1">
                        {conversations.map((conv) => (
                            <Link
                                key={conv.id}
                                href={`/chat/${conv.id}`}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all group relative ${
                                    url === `/chat/${conv.id}`
                                        ? 'bg-zinc-200 dark:bg-zinc-900 text-purple-600 dark:text-purple-400'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                                } ${isCollapsed ? 'justify-center w-12 mx-auto' : ''}`}
                            >
                                <MessageSquare className={`size-5 shrink-0 ${
                                     url === `/chat/${conv.id}` ? 'text-purple-600 dark:text-purple-500' : ''
                                }`} />
                                {!isCollapsed && (
                                    <>
                                        <span className="truncate text-sm font-medium pr-14">
                                            {conv.title || 'Untitled Chat'}
                                        </span>
                                        <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleRenameChat(e, conv.id, conv.title)}
                                                className="p-1 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                                title="Rename Chat"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteChat(e, conv.id)}
                                                className="p-1 rounded-md hover:bg-red-500/10 dark:hover:bg-red-500/20 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                                title="Delete Chat"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 space-y-1">
                <Link
                    href="/settings/profile"
                    className={`flex items-center gap-3 p-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all ${
                        isCollapsed ? 'justify-center w-12 mx-auto' : ''
                    }`}
                >
                    <Settings className="size-5 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium text-nowrap">Settings</span>}
                </Link>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className={`flex items-center gap-3 p-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-red-500/10 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-all w-full text-left ${
                        isCollapsed ? 'justify-center w-12 mx-auto' : ''
                    }`}
                >
                    <LogOut className="size-5 shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium text-nowrap">Logout</span>}
                </Link>
            </div>
        </aside>
    );
}