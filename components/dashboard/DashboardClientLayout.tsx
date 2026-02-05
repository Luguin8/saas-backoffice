'use client';

import { useState } from 'react';
import { DashboardProvider } from '@/app/dashboard/context/DashboardContext';
import { ToastProvider } from '@/app/dashboard/context/ToastContext';
import Sidebar from '@/components/dashboard/Sidebar';
import MobileHeader from '@/components/dashboard/MobileHeader';

type Props = {
    children: React.ReactNode;
    org: any;
    profile: any;
    activeModules: any[];
};

export default function DashboardClientLayout({ children, org, profile, activeModules }: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Estilos de marca dinámicos
    const brandStyle = {
        '--brand-primary': org.primary_color || '#0f172a',
        '--brand-secondary': org.secondary_color || '#3b82f6',
    } as React.CSSProperties;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden" style={brandStyle}>

            {/* 1. Sidebar Inteligente (Maneja PC y Móvil internamente) */}
            <Sidebar
                org={org}
                userProfile={profile}
                activeModules={activeModules}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* 2. Área de Contenido */}
            <main className="flex-1 flex flex-col w-full relative overflow-hidden">

                {/* Header: Solo visible en móvil */}
                <MobileHeader onOpen={() => setSidebarOpen(true)} org={org} />

                {/* Contenido Scrollable */}
                <DashboardProvider userRole={profile.role}>
                    <ToastProvider>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
                            {children}
                        </div>
                    </ToastProvider>
                </DashboardProvider>
            </main>
        </div>
    );
}