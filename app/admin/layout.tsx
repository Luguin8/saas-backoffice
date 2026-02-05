'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isDashboard = pathname === '/admin';

    // Cliente para cerrar sesión
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header del Superadmin */}
            <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {!isDashboard && (
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
                                title="Volver atrás"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <Link href="/admin" className="font-bold text-lg tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-blue-400" />
                            SaaS Superadmin
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/settings"
                            className={`p-2 rounded-lg transition-colors ${pathname === '/admin/settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            title="Configuración Global"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>

                        <div className="h-6 w-px bg-slate-700 mx-2 hidden sm:block"></div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm font-medium text-red-300 hover:text-red-100 transition-colors px-3 py-1.5 rounded-md hover:bg-red-900/20"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Contenido de la página */}
            <main>
                {children}
            </main>
        </div>
    );
}