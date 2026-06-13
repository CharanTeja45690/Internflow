import { useEffect, useState } from 'react';

export function useAsync<T>(loader: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setLoading(true); setError(''); loader().then((value) => active && setData(value)).catch((err) => active && setError(err.response?.data?.message ?? err.message ?? 'Request failed')).finally(() => active && setLoading(false)); return () => { active = false; }; }, deps);
  return { data, setData, loading, error };
}
