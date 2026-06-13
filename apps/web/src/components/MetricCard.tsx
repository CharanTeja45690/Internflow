export function MetricCard({ label, value }: { label: string; value: string | number }) { return <section className="card metric"><small>{label}</small><strong>{value}</strong></section>; }
