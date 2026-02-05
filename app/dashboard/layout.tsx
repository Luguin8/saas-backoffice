import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { DashboardProvider } from './context/DashboardContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from '@/components/dashboard/Sidebar'; // <--- Usamos el nuevo componente

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Traemos Perfil + Organización + Módulos Activos
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
      *,
      organizations (
        name, slug, logo_url, primary_color, secondary_color,
        organization_modules ( module_key, is_enabled )
      )
    `)
        .eq('id', user.id)
        .single();

    if (!profile || !profile.organizations) redirect('/');

    const org = profile.organizations;
    // Filtramos solo módulos habilitados
    const activeModules = org.organization_modules?.filter((m: any) => m.is_enabled) || [];

    const brandStyle = {
        '--brand-primary': org.primary_color || '#0f172a',
        '--brand-secondary': org.secondary_color || '#3b82f6',
    } as React.CSSProperties;

    return (
        <div className="flex h-screen bg-slate-50" style={brandStyle}>

            {/* Sidebar Inteligente (Client Component) */}
            <Sidebar
                org={org}
                userProfile={profile}
                activeModules={activeModules}
            />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                <DashboardProvider userRole={profile.role}>
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