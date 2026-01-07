import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchCache } from './useSearchCache';

export function useSmartSearch<T>(
	searchFn: (query: string, signal: AbortSignal) => Promise<T[]>,
	debounceMs = 300
) {
	const [results, setResults] = useState<T[]>([]);
	const [loading, setLoading] = useState(false);
	
	const abortRef = useRef<AbortController | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const cacheRef = useRef(new SearchCache<T>(50));

	const executeSearch = useCallback(async (query: string) => {
		if (!query.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}

		const cached = cacheRef.current.get(query);
		if (cached) {
			setResults(cached);
			setLoading(false);
			return;
		}

		abortRef.current?.abort(); 
		const controller = new AbortController();
		abortRef.current = controller;

		setLoading(true);
		try {
			const data = await searchFn(query, controller.signal);
			cacheRef.current.set(query, data);
			setResults(data);
		} catch (err: any) {
			if (err.name !== 'AbortError') {
				console.error('SmartSearch Error:', err);
			}
		} finally {
			if (!controller.signal.aborted) {
				setLoading(false);
			}
		}
	}, [searchFn]);

	const search = useCallback((query: string) => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			executeSearch(query);
		}, debounceMs);
	}, [debounceMs, executeSearch]);

	useEffect(() => {
		return () => {
			abortRef.current?.abort();
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, []);

	return { results, loading, search };
}