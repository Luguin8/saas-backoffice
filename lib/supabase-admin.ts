import { createClient } from '@supabase/supabase-js';

// ADVERTENCIA: Este cliente tiene permisos totales (bypass RLS).
// Solo usar en Server Actions verificados y nunca exponer al cliente.
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);