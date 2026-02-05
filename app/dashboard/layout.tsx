import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import DashboardClientLayout from '@/components/dashboard/DashboardClientLayout';

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
    const activeModules = org.organization_modules?.filter((m: any) => m.is_enabled) || [];

    return (
        <DashboardClientLayout org={org} profile={profile} activeModules={activeModules}>
            {children}
        </DashboardClientLayout>
    );
}