'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createCompanyUser, getCompanyUsers, deleteCompanyUser } from '@/app/actions/admin-user-actions'
import { UserPlus, Trash2, Stethoscope, ArrowLeft, Mail, Lock, User, Briefcase, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditCompanyPage() {
    const params = useParams()
    const router = useRouter()
    const [org, setOrg] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [creatingUser, setCreatingUser] = useState(false)

    // Estado formulario nuevo usuario
    const [newUser, setNewUser] = useState({
        email: '', password: '', fullName: '', role: 'employee', isProfessional: false
    })

    useEffect(() => {
        loadData()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    async function loadData() {
        try {
            const { data: orgData, error } = await supabase.from('organizations').select('*').eq('id', params.id).single()
            if (error) throw error
            setOrg(orgData)

            const usersData = await getCompanyUsers(params.id as string)
            setUsers(usersData || [])
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setCreatingUser(true)
        const formData = new FormData()
        Object.entries(newUser).forEach(([k, v]) => formData.append(k, String(v)))
        if (newUser.isProfessional) formData.append('isProfessional', 'on')
        formData.append('organizationId', params.id as string)

        try {
            await createCompanyUser(formData)
            setNewUser({ email: '', password: '', fullName: '', role: 'employee', isProfessional: false })
            await loadData() // Recargar lista
            alert('Usuario creado exitosamente')
        } catch (e: any) {
            alert(e.message)
        } finally {
            setCreatingUser(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("¿Eliminar este usuario? Perderá acceso inmediatamente.")) return;
        await deleteCompanyUser(userId, params.id as string);
        setUsers(users.filter(u => u.id !== userId));
    }

    if (loading) return <div className="p-10 text-center text-slate-500 flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Cargando empresa...</div>

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <Link href="/admin/companies" className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
                        <ArrowLeft size={16} /> Volver al listado
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Gestionar: {org?.name}</h1>
                    <p className="text-slate-500 text-sm">Administra los accesos y configuraciones de esta organización.</p>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded text-xs font-mono text-slate-600">
                    ID: {org?.id}
                </div>
            </div>

            {/* Sección: Gestión de Usuarios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Columna Izquierda: Formulario Crear */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            Nuevo Usuario
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input required type="text" placeholder="Ej: Maria Gonzalez"
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none"
                                        value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Email Corporativo</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input required type="email" placeholder="maria@empresa.com"
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none"
                                        value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Contraseña Inicial</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <input required type="text" placeholder="Mínimo 6 caracteres"
                                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 outline-none"
                                        value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Rol</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <select className="w-full pl-9 p-2 border border-slate-300 rounded-lg text-sm bg-white"
                                            value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                            <option value="employee">Empleado</option>
                                            <option value="owner">Dueño</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <input type="checkbox" id="isProf" className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900 cursor-pointer"
                                    checked={newUser.isProfessional} onChange={e => setNewUser({ ...newUser, isProfessional: e.target.checked })} />
                                <label htmlFor="isProf" className="text-sm text-slate-700 cursor-pointer flex-1">
                                    ¿Es Profesional?
                                    <span className="block text-xs text-slate-400">Aparecerá en el turnero público</span>
                                </label>
                            </div>

                            <button type="submit" disabled={creatingUser} className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 flex justify-center items-center gap-2">
                                {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Crear Usuario
                            </button>
                        </form>
                    </div>
                </div>

                {/* Columna Derecha: Tabla Lista */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Personal Activo ({users.length})</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Usuario</th>
                                        <th className="px-6 py-3 font-medium">Rol</th>
                                        <th className="px-6 py-3 font-medium text-center">¿Atiende?</th>
                                        <th className="px-6 py-3 font-medium text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">No hay usuarios cargados aún.</td>
                                        </tr>
                                    ) : users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{u.full_name}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                                    ${u.role === 'owner' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'}
                                                `}>
                                                    {u.role === 'owner' ? 'Dueño' : 'Empleado'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {u.is_professional ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
                                                        <Stethoscope size={12} /> Sí
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    title="Eliminar usuario"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}