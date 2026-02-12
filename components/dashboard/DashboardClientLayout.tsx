'use client';

import { DashboardProvider } from '@/app/dashboard/context/DashboardContext';
import { ToastProvider } from '@/app/dashboard/context/ToastContext';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileHeader from '@/components/dashboard/MobileHeader';

type Props = {
    children: React.ReactNode;
    org: any;
    profile: any;
};

export default function DashboardClientLayout({ children, org, profile }: Props) {
    // Estilos de marca dinámicos
    const brandStyle = {
        '--brand-primary': org.primary_color || '#0f172a',
        '--brand-secondary': org.secondary_color || '#3b82f6',
    } as React.CSSProperties;

    return (
        <DashboardProvider organization={org} profile={profile} userRole={profile.role}>
            <ToastProvider>
                <div className="flex h-screen bg-slate-50 overflow-hidden" style={brandStyle}>

                    {/* 1. Sidebar: Ya no necesita props, usa el DashboardContext internamente */}
                    <Sidebar />

                    {/* 2. Área de Contenido */}
                    <main className="flex-1 flex flex-col w-full relative overflow-hidden">

                        {/* Header: Ya no necesita props, usa el DashboardContext internamente */}
                        <MobileHeader />

                        {/* Contenido Scrollable */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
                            <div className="max-w-7xl mx-auto w-full">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </ToastProvider>
        </DashboardProvider>
    );
}