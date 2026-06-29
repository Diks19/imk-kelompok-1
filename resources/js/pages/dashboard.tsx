import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Dashboard({ stats }: { stats: { users: number, conversations: number, messages: number, attachments: number } }) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 p-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, Admin. Here's a quick overview of your LarAI instance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Users</h3>
                        <p className="text-5xl font-black text-foreground">{stats.users}</p>
                    </div>
                    
                    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Chats</h3>
                        <p className="text-5xl font-black text-foreground">{stats.conversations}</p>
                    </div>

                    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Messages</h3>
                        <p className="text-5xl font-black text-foreground">{stats.messages}</p>
                    </div>

                    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Files Processed</h3>
                        <p className="text-5xl font-black text-foreground">{stats.attachments}</p>
                    </div>
                </div>
            </div>
        </>
    );
}