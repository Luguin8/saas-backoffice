'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Autenticación
            const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            if (!user) throw new Error('No se pudo iniciar sesión.');

            // 2. Verificación de Rol
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                router.push('/');
                return;
            }

            // 3. Redirección
            if (profile.role === 'superadmin') {
                router.push('/admin/companies');
            } else {
                router.push('/dashboard');
            }

        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al ingresar.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">

                {/* Header Cajix */}
                <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
                    {/* Elemento decorativo de fondo */}
                    <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-30 rotate-12 scale-150 pointer-events-none"></div>

                    <h1 className="relative text-4xl text-white font-revalia tracking-widest mb-2" style={{ fontFamily: 'var(--font-revalia)' }}>
                        Cajix
                    </h1>
                    <p className="relative text-slate-400 text-sm font-light">Tu Pyme, bajo control.</p>
                </div>

                {/* Formulario */}
                <div className="p-8 pt-10">
                    <form onSubmit={handleLogin} className="space-y-6">

                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none bg-slate-50 focus:bg-white"
                                    placeholder="usuario@empresa.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-900 transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none bg-slate-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-lg shadow-slate-900/20 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Ingresar al Sistema'
                            )}
                        </button>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        &copy; 2026 Cajix Platform. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}