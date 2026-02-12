import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente de Supabase unificado para Server Components y Server Actions.
 * Maneja automáticamente las cookies y la sesión.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
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
                        // El bloque try/catch es necesario porque en Server Components
                        // no se pueden setear cookies, pero el cliente auth lo intenta.
                        // Esto evita errores en consola.
                    }
                },
            },
        }
    );
}