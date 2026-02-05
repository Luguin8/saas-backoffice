import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
    LayoutDashboard,
    ArrowLeftRight,
    PieChart,
    LogOut,
    Users
} from 'lucide-react';
import { DashboardProvider } from './context/DashboardContext';
import { ToastProvider } from './context/ToastContext'; // <--- IMPORT NUEVO
import CompanyLogo from '@/components/dashboard/CompanyLogo';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
      *,
      organizations (
        name,
        slug,
        logo_url,
        primary_color,
        secondary_color
      )
    `)
        .eq('id', user.id)
        .single();

    if (!profile || !profile.organizations) {
        redirect('/');
    }

    const org = profile.organizations;

    const brandStyle = {
        '--brand-primary': org.primary_color || '#0f172a',
        '--brand-secondary': org.secondary_color || '#3b82f6',
    } as React.CSSProperties;

    return (
        <div className="flex h-screen bg-slate-50" style={brandStyle}>
            <aside className="w-64 flex-shrink-0 flex flex-col transition-all duration-300 shadow-xl z-10"
                style={{ backgroundColor: 'var(--brand-primary)' }}>

                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <CompanyLogo url={org.logo_url} name={org.name} />
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-white/90 rounded-lg hover:bg-white/10 transition-colors group">
                        <LayoutDashboard className="w-5 h-5 text-white/70 group-hover:text-white" />
                        <span className="font-medium">Tablero Principal</span>
                    </Link>
                    <Link href="/dashboard/movements" className="flex items-center gap-3 px-3 py-2.5 text-white/70 rounded-lg hover:bg-white/10 transition-colors group">
                        <ArrowLeftRight className="w-5 h-5 group-hover:text-white" />
                        <span className="font-medium">Movimientos</span>
                    </Link>
                    <Link href="/dashboard/reports" className="flex items-center gap-3 px-3 py-2.5 text-white/70 rounded-lg hover:bg-white/10 transition-colors group">
                        <PieChart className="w-5 h-5 group-hover:text-white" />
                        <span className="font-medium">Reportes</span>
                    </Link>
                    <Link href="/dashboard/teams" className="flex items-center gap-3 px-3 py-2.5 text-white/70 rounded-lg hover:bg-white/10 transition-colors group">
                        <Users className="w-5 h-5 group-hover:text-white" />
                        <span className="font-medium">Equipo</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-bold border border-white/20">
                            {profile.full_name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
                            <p className="text-xs text-white/50 capitalize truncate">{profile.role}</p>
                        </div>
                    </div>
                    <form action="/auth/signout" method="post">
                        <button className="flex items-center gap-3 px-3 py-2 w-full text-white/60 hover:text-red-300 transition-colors">
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Salir</span>
                        </button>
                    </form>
                    <div className="mt-6 pt-4 border-t border-white/5 text-center">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Powered by</p>
                        <p className="text-white/60 text-lg" style={{ fontFamily: 'var(--font-revalia)' }}>Cajix</p>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden relative">
                <DashboardProvider userRole={profile.role}>
                    {/* AQUI AGREGAMOS EL TOAST PROVIDER */}
                    <ToastProvider>
                        <div className="flex-1 overflow-auto p-6 md:p-8">
                            {children}
                        </div>
                    </ToastProvider>
                </DashboardProvider>
            </main>
        </div>
    );
}