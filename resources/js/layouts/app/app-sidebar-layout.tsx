import { AppSidebar } from '@/components/app-sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
}: AppLayoutProps) {
    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-300">
            <AppSidebar />
            <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                {children}
            </main>
        </div>
    );
}
