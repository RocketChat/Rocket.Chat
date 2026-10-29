import { useCallback, useState } from 'react';

/**
 * Collects the ids that descendants announce, so a parent can reference them
 * in ARIA relationships without the consumer wiring ids by hand.
 */
export const useIdRegistry = () => {
	const [ids, setIds] = useState<string[]>([]);

	const register = useCallback((id: string) => {
		setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

		return () => {
			setIds((prev) => prev.filter((value) => value !== id));
		};
	}, []);

	return [ids, register] as const;
};
