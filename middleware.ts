import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // 1. Crear cliente de Supabase para el contexto del servidor (Middleware)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 2. Obtener la sesión del usuario
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Definir rutas protegidas
    const path = request.nextUrl.pathname;
    const isBackoffice = path.startsWith('/admin');
    const isDashboard = path.startsWith('/dashboard');

    // CASO A: Usuario NO logueado intenta entrar a rutas privadas
    if (!user && (isBackoffice || isDashboard)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // CASO B: Usuario logueado intenta entrar a login (Lo mandamos a su lugar)
    if (user && path === '/login') {
        // Aquí idealmente verificaríamos el rol de nuevo, pero por performance 
        // podemos mandarlo al dashboard default o home.
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // CASO C: Protección específica de Rol (Backoffice solo para Superadmin)
    // Nota: Verificar el rol en middleware requiere una query a BD.
    // Para optimizar, se suele guardar el rol en los metadata del usuario o usar Custom Claims.
    // Por ahora, haremos una verificación básica de existencia de usuario.
    // IMPORTANTE: La seguridad real de datos la da RLS (Row Level Security) en la base de datos.

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}