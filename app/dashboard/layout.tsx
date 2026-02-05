import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
    LayoutDashboard,
    ArrowLeftRight, // Para movimientos
    PieChart,       // Para reportes
    Settings,
    LogOut,
    Users
} from 'lucide-react';
import { DashboardProvider } from './context/DashboardContext';

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
                setAll(cookiesToSet) {
                    // En Next.js Server Components, setAll no se usa típicamente para lectura
                },
            },
        }
    );

    // 1. Verificar Sesión
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Obtener datos de la Empresa y Perfil
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

    // Seguridad: Si no tiene empresa asignada, fuera.
    if (!profile || !profile.organizations) {
        redirect('/');
    }

    const org = profile.organizations;

    // 3. Definir variables CSS dinámicas
    const brandStyle = {
        '--brand-primary': org.primary_color || '#0f172a',
        '--brand-secondary': org.secondary_color || '#3b82f6',
    } as React.CSSProperties;

    return (
        <div className="flex h-screen bg-slate-50" style={brandStyle}>

            {/* SIDEBAR DINÁMICO */}
            <aside className="w-64 flex-shrink-0 flex flex-col transition-all duration-300 shadow-xl z-10"
                style={{ backgroundColor: 'var(--brand-primary)' }}>

                {/* Logo de la Empresa */}
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} className="h-8 object-contain brightness-0 invert" />
                    ) : (
                        <span className="text-white font-bold text-lg truncate">{org.name}</span>
                    )}
                </div>

                {/* Navegación */}
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

                    <Link href="/dashboard/team" className="flex items-center gap-3 px-3 py-2.5 text-white/70 rounded-lg hover:bg-white/10 transition-colors group">
                        <Users className="w-5 h-5 group-hover:text-white" />
                        <span className="font-medium">Equipo</span>
                    </Link>
                </nav>

                {/* Footer del Sidebar */}
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
                </div>

                {/* Footer del Sidebar */}
                <div className="p-4 border-t border-white/10">

                    {/* ... (código del perfil de usuario) ... */}

                    <form action="/auth/signout" method="post">
                        {/* ... botón salir ... */}
                    </form>

                    {/* NUEVO: Branding "Powered by Cajix" */}
                    <div className="mt-6 pt-4 border-t border-white/5 text-center">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">Powered by</p>
                        <p className="text-white/60 text-lg" style={{ fontFamily: 'var(--font-revalia)' }}>Cajix</p>
                    </div>

                </div>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Envolvemos el contenido con el Provider */}
                <DashboardProvider userRole={profile.role}>
                    <div className="flex-1 overflow-auto p-6 md:p-8">
                        {children}
                    </div>
                </DashboardProvider>
            </main>
        </div>
    );
}