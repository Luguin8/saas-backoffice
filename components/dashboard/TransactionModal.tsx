'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Save, Loader2, Check, Trash2 } from 'lucide-react';
import { createTransactionAction, updateTransactionAction, deleteTransactionAction } from '@/app/actions/transaction-actions';
import { createCategoryAction, createPayeeAction } from '@/app/actions/config-actions';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    type: 'income' | 'expense';
    categories: any[];
    payees: any[];
    onSuccess: () => void;
    initialData?: any; // <--- Nuevo: Para modo edición
};

export default function TransactionModal({ isOpen, onClose, type, categories: initialCategories, payees: initialPayees, onSuccess, initialData }: Props) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState(initialCategories);
    const [payees, setPayees] = useState(initialPayees);

    // Estados para creación rápida
    const [newCatName, setNewCatName] = useState('');
    const [showNewCatInput, setShowNewCatInput] = useState(false);
    const [newPayeeName, setNewPayeeName] = useState('');
    const [showNewPayeeInput, setShowNewPayeeInput] = useState(false);

    // Estados del Formulario (Controlados para permitir edición)
    const [formData, setFormData] = useState({
        amount: '',
        currency: 'ARS',
        category_id: '',
        payee_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        is_fiscal: false
    });

    // Efecto: Resetear o Cargar datos al abrir
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Modo Edición
                setFormData({
                    amount: initialData.amount,
                    currency: initialData.currency,
                    category_id: initialData.category_id || '',
                    payee_id: initialData.payee_id || '',
                    description: initialData.description || '',
                    date: initialData.transaction_date.split('T')[0],
                    is_fiscal: initialData.is_fiscal
                });
            } else {
                // Modo Creación (Reset)
                setFormData({
                    amount: '',
                    currency: 'ARS',
                    category_id: '',
                    payee_id: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    is_fiscal: false
                });
            }
            setCategories(initialCategories);
            setPayees(initialPayees);
            setShowNewCatInput(false);
            setShowNewPayeeInput(false);
        }
    }, [isOpen, initialData, initialCategories, initialPayees]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = new FormData();
        // Campos manuales
        payload.set('type', type);
        payload.set('amount', formData.amount);
        payload.set('currency', formData.currency);
        payload.set('category_id', formData.category_id);
        payload.set('payee_id', formData.payee_id);
        payload.set('description', formData.description);
        payload.set('date', formData.date);
        if (formData.is_fiscal) payload.set('is_fiscal', 'on');

        let res;
        if (initialData) {
            payload.set('id', initialData.id);
            res = await updateTransactionAction(payload);
        } else {
            res = await createTransactionAction(payload);
        }

        setLoading(false);

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Error: ' + res.message);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !confirm('¿Estás seguro de eliminar este movimiento?')) return;
        setLoading(true);
        const res = await deleteTransactionAction(initialData.id);
        setLoading(false);
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert(res.message);
        }
    };

    const handleQuickCategory = async () => {
        if (!newCatName.trim()) return;
        const res = await createCategoryAction(newCatName, type);
        if (res.success && res.data) {
            setCategories([...categories, res.data]);
            setFormData({ ...formData, category_id: res.data.id });
            setShowNewCatInput(false);
            setNewCatName('');
        }
    };

    const handleQuickPayee = async () => {
        if (!newPayeeName.trim()) return;
        const res = await createPayeeAction(newPayeeName);
        if (res.success && res.data) {
            setPayees([...payees, res.data]);
            setFormData({ ...formData, payee_id: res.data.id });
            setShowNewPayeeInput(false);
            setNewPayeeName('');
        }
    };

    const isExpense = type === 'expense';
    const colorClass = isExpense ? 'rose' : 'emerald';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center bg-${colorClass}-50 border-b border-${colorClass}-100`}>
                    <h2 className={`text-lg font-bold text-${colorClass}-700`}>
                        {initialData ? 'Editar Movimiento' : (isExpense ? 'Registrar Salida' : 'Registrar Ingreso')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Monto y Moneda */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Total</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        autoFocus={!initialData}
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                                <select
                                    value={formData.currency}
                                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
                                >
                                    <option value="ARS">ARS 🇦🇷</option>
                                    <option value="USD">USD 🇺🇸</option>
                                </select>
                            </div>
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                            {showNewCatInput ? (
                                <div className="flex gap-2">
                                    <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nueva categoría..." className="flex-1 px-3 py-2 border border-blue-300 rounded-lg" />
                                    <button type="button" onClick={handleQuickCategory} className="p-2 bg-blue-600 text-white rounded-lg"><Check className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setShowNewCatInput(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => setShowNewCatInput(true)} className="p-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Proveedor */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{isExpense ? 'Proveedor' : 'Cliente'}</label>
                            {showNewPayeeInput ? (
                                <div className="flex gap-2">
                                    <input type="text" value={newPayeeName} onChange={(e) => setNewPayeeName(e.target.value)} placeholder="Nuevo nombre..." className="flex-1 px-3 py-2 border border-blue-300 rounded-lg" />
                                    <button type="button" onClick={handleQuickPayee} className="p-2 bg-blue-600 text-white rounded-lg"><Check className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setShowNewPayeeInput(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select
                                        value={formData.payee_id}
                                        onChange={e => setFormData({ ...formData, payee_id: e.target.value })}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {payees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <button type="button" onClick={() => setShowNewPayeeInput(true)} className="p-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Fecha y Descripción */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                        </div>

                        {/* Switch Fiscal */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-sm font-semibold text-slate-800 block">¿Es Fiscal? (Blanco)</span>
                                <span className="text-xs text-slate-500">Visible para empleados.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_fiscal}
                                    onChange={e => setFormData({ ...formData, is_fiscal: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            {initialData && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                    title="Eliminar movimiento"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 py-3 rounded-lg text-white font-bold shadow-md hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2
                        bg-${colorClass}-600`}
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                                {initialData ? 'Guardar Cambios' : 'Registrar'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}