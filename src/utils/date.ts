/**
 * Formatea cadenas de fecha (YYYY-MM-DD o ISO) al formato en español DD/MM/AAAA
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  // Extraer la parte YYYY-MM-DD si es ISO string
  const cleanDate = dateString.split('T')[0];
  const parts = cleanDate.split('-');
  
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  
  return dateString;
}

/**
 * Retorna la fecha de hoy en formato ISO (YYYY-MM-DD) para inputs HTML date
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Suma días a una fecha base (YYYY-MM-DD) y retorna en formato ISO (YYYY-MM-DD)
 */
export function addDaysISO(baseDateStr: string, days: number): string {
  const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
  const targetDate = new Date(baseDate.getTime() + days * 86400000);
  return targetDate.toISOString().split('T')[0];
}
