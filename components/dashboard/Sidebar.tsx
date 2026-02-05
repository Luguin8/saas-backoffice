'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ArrowLeftRight,
    PieChart,
    Users,
    LogOut,
    HelpCircle,
    Box,
    X
} from 'lucide-react';
import CompanyLogo from './CompanyLogo';

type SidebarProps = {
    org: any;
    userProfile: any;
    activeModules: any[];
    isOpen?: boolean;        // Nuevo prop
    onClose?: () => void;    // Nuevo prop
};

export default function Sidebar({ org, userProfile, activeModules, isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { label: 'Tablero Principal', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Movimientos', href: '/dashboard/movements', icon: ArrowLeftRight },
        { label: 'Reportes', href: '/dashboard/reports', icon: PieChart },
        { label: 'Equipo', href: '/dashboard/teams', icon: Users },
    ];

    if (activeModules) {
        const stockModule = activeModules.find((m: any) => m.module_key === 'stock');
        if (stockModule) {
            menuItems.push({ label: 'Inventario', href: '/dashboard/stock', icon: Box });
        }
    }

    return (
        <>
            {/* OVERLAY MÓVIL (Fondo oscuro al abrir menú) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            {/* SIDEBAR CONTAINER */}
            <aside
                className={`
            fixed inset-y-0 left-0 z-50 w-64 flex flex-col h-full
            bg-[var(--brand-primary)] text-white shadow-2xl 
            transform transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:translate-x-0 md:relative md:shadow-xl
        `}
            >

                {/* HEADER SIDEBAR */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
                    <CompanyLogo url={org.logo_url} name={org.name} />
                    {/* Botón cerrar solo en móvil */}
                    <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* NAVEGACIÓN SCROLLABLE */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose} // Cerrar menú al hacer clic en móvil
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden ${isActive ? 'text-white font-bold shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'
                                    }`}
                                style={isActive ? { backgroundColor: 'var(--brand-secondary)' } : {}}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                                <span className="relative z-10">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* FOOTER */}
                <div className="p-4 border-t border-white/10 space-y-4 shrink-0 bg-[var(--brand-primary)]">
                    <a
                        href="mailto:soporte@cajix.com"
                        className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors px-2"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>Ayuda y Soporte</span>
                    </a>

                    <div className="flex items-center gap-3 px-2">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold border border-white/20">
                            {userProfile.full_name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{userProfile.full_name}</p>
                            <p className="text-xs text-white/50 capitalize truncate">{userProfile.role}</p>
                        </div>
                    </div>

                    <form action="/auth/signout" method="post">
                        <button className="flex items-center justify-center gap-2 px-3 py-2 w-full text-white/80 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors border border-white/10">
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Cerrar Sesión</span>
                        </button>
                    </form>

                    <div className="pt-2 text-center opacity-50 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] uppercase tracking-wider mb-1">Powered by</p>
                        <p className="text-lg leading-none" style={{ fontFamily: 'var(--font-revalia)' }}>Cajix</p>
                    </div>
                </div>
            </aside>
        </>
    );
}