'use client';

import { useState } from 'react';
import { useDashboard } from '@/app/dashboard/context/DashboardContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, EyeOff } from 'lucide-react';
import TransactionModal from './TransactionModal';
import { useRouter } from 'next/navigation';

type Props = {
    transactions: any[];
    categories: any[];
    payees: any[];
};

export default function MovementsTable({ transactions, categories, payees }: Props) {
    const { showRealNumbers, canViewRealNumbers } = useDashboard();
    const router = useRouter();

    // Filtros locales
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    // Estado para el modal de edición
    const [editingTx, setEditingTx] = useState<any | null>(null);

    // Lógica de Filtrado
    const filteredTransactions = transactions.filter(t => {
        // 1. Filtro de Privacidad (El Ojo)
        // Si NO tengo activado "Ver Reales", oculto los que no son fiscales (Negros)
        if (!showRealNumbers && !t.is_fiscal) return false;

        // 2. Filtro de Tipo
        if (filterType !== 'all' && t.type !== filterType) return false;

        // 3. Filtro de Buscador
        const searchLower = searchTerm.toLowerCase();
        return (
            t.description?.toLowerCase().includes(searchLower) ||
            t.categories?.name?.toLowerCase().includes(searchLower) ||
            t.payees?.name?.toLowerCase().includes(searchLower) ||
            t.amount.toString().includes(searchLower)
        );
    });

    const handleRowClick = (tx: any) => {
        // Solo el dueño o admin debería poder editar, o todos (según tu regla de negocio).
        // Por ahora permitimos abrir, el backend valida permisos de update.
        setEditingTx(tx);
    };

    const handleEditSuccess = () => {
        router.refresh();
        setEditingTx(null);
    };

    return (
        <div className="space-y-4">

            {/* Barra de Herramientas */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por monto, motivo, proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm font-medium"
                    >
                        <option value="all">Todos</option>
                        <option value="income">Ingresos</option>
                        <option value="expense">Egresos</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Fecha</th>
                                <th className="px-6 py-4 font-medium">Motivo / Categoría</th>
                                <th className="px-6 py-4 font-medium">Quién</th>
                                <th className="px-6 py-4 font-medium text-right">Monto</th>
                                <th className="px-6 py-4 font-medium text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map((tx) => (
                                <tr
                                    key={tx.id}
                                    onClick={() => handleRowClick(tx)}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4 text-slate-500">
                                        {format(new Date(tx.transaction_date), 'dd MMM yyyy', { locale: es })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">
                                                {tx.categories?.name || 'Sin categoría'}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {tx.payees?.name} {tx.description ? `• ${tx.description}` : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2" title={tx.profiles?.full_name}>
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {tx.profiles?.full_name?.[0] || '?'}
                                            </div>
                                            <span className="text-xs text-slate-500 hidden sm:inline max-w-[100px] truncate">
                                                {tx.profiles?.full_name?.split(' ')[0]}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className={`font-bold flex items-center justify-end gap-1 ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {tx.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4 text-slate-400" />}
                                            {tx.currency === 'USD' ? 'USD' : '$'} {Number(tx.amount).toLocaleString('es-AR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {tx.is_fiscal ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                Fiscal
                                            </span>
                                        ) : (
                                            // Solo el dueño ve la etiqueta "Negro", aunque esté viendo la fila
                                            canViewRealNumbers && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    <EyeOff className="w-3 h-3" /> Interno
                                                </span>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-400">
                                        No hay movimientos visibles con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Edición */}
            {editingTx && (
                <TransactionModal
                    isOpen={!!editingTx}
                    onClose={() => setEditingTx(null)}
                    type={editingTx.type}
                    categories={categories}
                    payees={payees}
                    onSuccess={handleEditSuccess}
                    initialData={editingTx} // Pasamos los datos para editar
                />
            )}

        </div>
    );
}