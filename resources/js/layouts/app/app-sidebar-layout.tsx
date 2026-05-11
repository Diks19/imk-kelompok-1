import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
}: AppLayoutProps) {
    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 flex flex-col min-w-0 relative">
                {children}
            </main>
        </div>
    );
}
