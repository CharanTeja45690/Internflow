export const statuses = ['saved', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'joined'] as const;
export const workModes = ['remote', 'hybrid', 'onsite'] as const;
export function split(value: string) { return value.split(',').map((x) => x.trim()).filter(Boolean); }
export function num(value: string) { return value === '' ? undefined : Number(value); }
export function money(min?: number, max?: number, currency = 'INR') { if (!min && !max) return 'Stipend not listed'; const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }); return [min ? fmt.format(min) : null, max ? fmt.format(max) : null].filter(Boolean).join(' - '); }
