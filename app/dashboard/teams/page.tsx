'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // Cliente simple para fetch
import { createTeamMemberAction } from '@/app/actions/team-actions';
import { Plus, User, Shield, Briefcase, Trash2, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Cliente para Client Components (puedes usar el hook useSupabase si lo tienes, o createBrowserClient)
// Por simplicidad en el ejemplo, asumimos que tienes un cliente exportado o lo creamos inline
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TeamPage() {
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionResult, setActionResult] = useState<{ success: boolean, message: string, newPassword?: string } | null>(null);

    // Fetch de miembros
    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        // Obtenemos el usuario actual para saber su org_id (podría venir del layout, pero fetch es seguro)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();

        if (profile?.organization_id) {
            const { data: team } = await supabase
                .from('profiles')
                .select('*')
                .eq('organization_id', profile.organization_id)
                .order('created_at', { ascending: false });
            setMembers(team || []);
        }
        setLoading(false);
    };

    const handleCreateSubmit = async (formData: FormData) => {
        setActionResult(null);
        const result = await createTeamMemberAction(formData);
        setActionResult(result);

        if (result.success) {
            fetchMembers(); // Recargar lista
            // No cerramos el modal inmediatamente para mostrar la contraseña
        }
    };

    return (
        <div className="max-w-5xl mx-auto">

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Equipo de Trabajo</h1>
                    <p className="text-slate-500">Gestiona quién tiene acceso a tu empresa.</p>
                </div>
                <button
                    onClick={() => { setIsModalOpen(true); setActionResult(null); }}
                    className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors shadow-sm"
                    style={{ backgroundColor: 'var(--brand-secondary)' }}
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Miembro
                </button>
            </div>

            {/* Lista de Miembros */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-500">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Fecha Ingreso</th>
                            <th className="px-6 py-4 text-right">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border"
                                            style={{ color: 'var(--brand-primary)' }}>
                                            {member.full_name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{member.full_name}</p>
                                            {/* Nota: Auth email no está en public.profiles por defecto a menos que lo copies. 
                            Si lo necesitas, tendrías que haberlo guardado en profiles o hacer join con auth (solo posible con service role).
                            Por ahora mostramos el nombre. */}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                            member.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}
                    `}>
                                        {member.role === 'owner' && <Shield className="w-3 h-3" />}
                                        {member.role === 'admin' && <Briefcase className="w-3 h-3" />}
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(member.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded">Activo</span>
                                </td>
                            </tr>
                        ))}
                        {!loading && members.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8 text-slate-400">No hay miembros aún.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">

                        <h2 className="text-lg font-bold text-slate-900 mb-4">Agregar Miembro</h2>

                        {actionResult?.success ? (
                            // PANTALLA DE ÉXITO CON CONTRASEÑA
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center space-y-4">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <Check className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-emerald-800 font-bold">¡Usuario Creado!</h3>
                                    <p className="text-emerald-600 text-sm mt-1">Comparte estas credenciales con tu empleado. No podrás verlas de nuevo.</p>
                                </div>

                                <div className="bg-white border border-emerald-200 p-3 rounded text-left relative group">
                                    <p className="text-xs text-slate-400 mb-1">Contraseña Temporal:</p>
                                    <p className="font-mono text-lg font-bold text-slate-800 tracking-wide">{actionResult.newPassword}</p>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(actionResult.newPassword || '')}
                                        className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600"
                                        title="Copiar"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => { setIsModalOpen(false); setActionResult(null); }}
                                    className="w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            // FORMULARIO
                            <form action={handleCreateSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                                    <input name="fullName" type="text" required className="w-full px-3 py-2 border rounded-lg" placeholder="Juan Pérez" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                                    <input name="email" type="email" required className="w-full px-3 py-2 border rounded-lg" placeholder="juan@empresa.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                    <select name="role" className="w-full px-3 py-2 border rounded-lg bg-white">
                                        <option value="employee">Empleado (Acceso Limitado)</option>
                                        <option value="admin">Administrativo (Gestión)</option>
                                    </select>
                                </div>

                                {actionResult?.success === false && (
                                    <p className="text-red-500 text-sm">{actionResult.message}</p>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2 text-slate-700 hover:bg-slate-50 border rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: 'var(--brand-primary)' }}
                                    >
                                        Crear Usuario
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}