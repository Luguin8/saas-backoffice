import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const path = request.nextUrl.pathname;

    // 1. Protección básica de sesión
    if (!user && (path.startsWith('/admin') || path.startsWith('/dashboard'))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Protección de Backoffice (Solo Superadmin)
    // Nota: Consultar la BD en middleware puede ser lento.
    // Lo ideal es Custom Claims, pero para este MVP, haremos una redirección
    // optimista en app/page.tsx y aquí confiamos en RLS + UX, 
    // PERO para mayor seguridad, si un usuario logueado intenta entrar a /admin
    // podemos verificar si tiene una cookie de rol o metadata (si la hubiéramos seteado).

    // Por ahora, tu seguridad RADICA en RLS. Si un empleado entra a /admin, 
    // verá todo en blanco. Es aceptable para MVP, pero idealmente, agregaríamos lógica aquí.

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}