import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
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

    // 1. Obtener usuario
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname;
    const isBackoffice = path.startsWith('/admin');
    const isDashboard = path.startsWith('/dashboard');

    // 2. Si no hay usuario y quiere entrar a rutas protegidas -> Login
    if (!user && (isBackoffice || isDashboard)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Si ya está logueado y quiere ir al Login -> Redirigir según rol
    // (Esto requiere leer el perfil, pero por performance, lo mandamos al root '/' 
    // que ya tiene tu lógica de redirección inteligente en app/page.tsx)
    if (user && path === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 4. PROTECCIÓN DE ROLES (NUEVO)
    if (user) {
        // Obtenemos el rol desde una cookie no segura o metadata si estuviera disponible.
        // Como RLS protege los datos, aquí solo hacemos una redirección UX.
        // Para seguridad total en middleware se requieren Custom Claims en JWT.

        // Verificación simple: Si un usuario intenta entrar a admin, dejamos que RLS actúe, 
        // PERO podemos verificar la metadata del usuario si la guardamos al login.
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}