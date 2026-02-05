export const formatMoney = (amount: number, currency: 'ARS' | 'USD') => {
    // Formateador base para Argentina (es-AR usa puntos para miles y comas para decimales)
    const formatter = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    // Hack visual: Intl a veces devuelve "$100" o "ARS 100".
    // Nosotros queremos "$ 100,00" (con espacio).
    // Reemplazamos el símbolo estándar por "Símbolo + Espacio".
    const parts = formatter.formatToParts(amount);

    return parts.map(part => {
        if (part.type === 'currency') {
            return (currency === 'USD' ? 'U$S' : '$') + '\u00A0'; // \u00A0 es espacio no rompible
        }
        return part.value;
    }).join('');
};