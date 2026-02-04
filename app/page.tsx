import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Home() {
  // 1. Instanciamos el cliente de Supabase en el Servidor (Server Component)
  // Nota: Usamos 'await cookies()' porque en Next.js 15+ es asíncrono
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // El método setAll puede fallar en Server Components si no es una Server Action,
            // pero para lectura (getUser) esto es suficiente.
          }
        },
      },
    }
  );

  // 2. Verificamos si hay sesión
  const { data: { user } } = await supabase.auth.getUser();

  // CASO A: No hay usuario -> Mandar al Login
  if (!user) {
    redirect('/login');
  }

  // CASO B: Hay usuario -> Verificar Rol para redirigir al Dashboard correcto
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'superadmin') {
    // Si eres tú (Superadmin) -> Al Backoffice
    redirect('/admin');
  } else {
    // Si es un cliente -> A su Dashboard (que haremos luego)
    redirect('/dashboard');
  }

  // Este return casi nunca se ve, pero es necesario para que sea un componente válido
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-slate-500 animate-pulse">Redireccionando...</p>
    </div>
  );
}