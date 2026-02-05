'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Save, Loader2, Check } from 'lucide-react';
import { createTransactionAction } from '@/app/actions/transaction-actions';
import { createCategoryAction, createPayeeAction } from '@/app/actions/config-actions';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    type: 'income' | 'expense';
    categories: any[];
    payees: any[];
    onSuccess: () => void; // Para recargar datos
};

export default function TransactionModal({ isOpen, onClose, type, categories: initialCategories, payees: initialPayees, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Estados locales para las listas (por si creamos uno nuevo on-the-fly)
    const [categories, setCategories] = useState(initialCategories);
    const [payees, setPayees] = useState(initialPayees);

    // Estados para inputs de creación rápida
    const [newCatName, setNewCatName] = useState('');
    const [showNewCatInput, setShowNewCatInput] = useState(false);
    const [newPayeeName, setNewPayeeName] = useState('');
    const [showNewPayeeInput, setShowNewPayeeInput] = useState(false);

    // Resetear form al abrir
    useEffect(() => {
        if (isOpen) {
            setCategories(initialCategories);
            setPayees(initialPayees);
            setShowNewCatInput(false);
            setShowNewPayeeInput(false);
        }
    }, [isOpen, initialCategories, initialPayees]);

    if (!isOpen) return null;

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);

        // Inyectamos el tipo (income/expense) que viene del botón presionado
        formData.set('type', type);

        const res = await createTransactionAction(formData);
        setLoading(false);

        if (res.success) {
            onSuccess(); // Recargar dashboard
            onClose();
        } else {
            alert('Error: ' + res.message);
        }
    };

    // Lógica de Creación Rápida de Categoría
    const handleQuickCategory = async () => {
        if (!newCatName.trim()) return;
        const res = await createCategoryAction(newCatName, type);
        if (res.success && res.data) {
            setCategories([...categories, res.data]);
            // Seleccionar la nueva categoría en el form (hack visual o controlando el value)
            // Por simplicidad, el usuario la seleccionará de la lista actualizada
            setShowNewCatInput(false);
            setNewCatName('');
        }
    };

    // Lógica de Creación Rápida de Proveedor
    const handleQuickPayee = async () => {
        if (!newPayeeName.trim()) return;
        const res = await createPayeeAction(newPayeeName);
        if (res.success && res.data) {
            setPayees([...payees, res.data]);
            setShowNewPayeeInput(false);
            setNewPayeeName('');
        }
    };

    const isExpense = type === 'expense';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className={`px-6 py-4 flex justify-between items-center ${isExpense ? 'bg-rose-50 border-b border-rose-100' : 'bg-emerald-50 border-b border-emerald-100'}`}>
                    <h2 className={`text-lg font-bold ${isExpense ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {isExpense ? 'Registrar Salida' : 'Registrar Ingreso'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form ref={formRef} action={handleSubmit} className="space-y-5">

                        {/* 1. Monto y Moneda */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Monto Total</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        step="0.01"
                                        required
                                        autoFocus
                                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                                <select name="currency" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium">
                                    <option value="ARS">ARS 🇦🇷</option>
                                    <option value="USD">USD 🇺🇸</option>
                                </select>
                            </div>
                        </div>

                        {/* 2. Categoría (Con creación rápida) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría / Motivo</label>
                            {showNewCatInput ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        placeholder="Nombre nueva categoría..."
                                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={handleQuickCategory} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setShowNewCatInput(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select name="category_id" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">-- Seleccionar --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCatInput(true)}
                                        className="p-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                        title="Crear nueva categoría"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 3. Proveedor / Cliente */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{isExpense ? 'Proveedor / Destinatario' : 'Cliente / Origen'}</label>
                            {showNewPayeeInput ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newPayeeName}
                                        onChange={(e) => setNewPayeeName(e.target.value)}
                                        placeholder="Nombre nuevo..."
                                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={handleQuickPayee} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check className="w-4 h-4" /></button>
                                    <button type="button" onClick={() => setShowNewPayeeInput(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <select name="payee_id" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">-- Seleccionar (Opcional) --</option>
                                        {payees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPayeeInput(true)}
                                        className="p-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                        title="Crear nuevo"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 4. Descripción y Fecha */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (Opcional)</label>
                                <input type="text" name="description" className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Detalle..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                        </div>

                        {/* 5. SWITCH FISCAL */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="text-sm font-semibold text-slate-800 block">¿Es una operación Fiscal?</span>
                                <span className="text-xs text-slate-500">Activa esto si hay factura o comprobante legal.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="is_fiscal" className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2
                    ${isExpense ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                            Guardar Movimiento
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}