export function LoadingState({ label = 'Loading...' }: { label?: string }) { return <div className="empty-state">{label}</div>; }
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) { return <section className="empty-state"><h3>{title}</h3>{children}</section>; }
