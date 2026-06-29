import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

export default function Welcome({ canRegister }: { canRegister: boolean }) {
    const { auth } = usePage<any>().props;

    return (
        <>
            <Head title="Welcome to LarAI" />
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-purple-500/30 transition-colors duration-300">
                <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-zinc-200 dark:border-zinc-900">
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold font-serif">L</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight font-serif text-zinc-900 dark:text-white">LarAI</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link href={auth.user.role === 'admin' ? '/dashboard' : '/chat'} className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-full transition-all">
                                {auth.user.role === 'admin' ? 'Dashboard' : 'Go to Chat'}
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link href="/register" className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-full transition-all">
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </nav>

                <main className="flex flex-col items-center justify-center px-6 text-center mt-32 md:mt-48">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold uppercase tracking-widest mb-8 animate-in slide-in-from-bottom-4 duration-700">
                        <span className="size-2 rounded-full bg-purple-600 dark:bg-purple-500 animate-pulse"></span>
                        Powered by Local AI
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 animate-in slide-in-from-bottom-6 duration-700 delay-100">
                        Your private, powerful AI assistant.
                    </h1>
                    
                    <p className="mt-6 text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        Experience blazing fast interactions, complete data privacy, and a beautiful interface powered by Laravel and local open-weights models.
                    </p>

                    <div className="mt-10 flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link 
                            href="/chat" 
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold px-8 py-3 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-900/10 dark:shadow-white/10"
                        >
                            Start Chatting
                        </Link>
                        <a 
                            href="https://github.com" 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium px-8 py-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95"
                        >
                            View Source
                        </a>
                    </div>
                </main>
            </div>
        </>
    );
}