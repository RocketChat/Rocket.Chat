
const MetaCache = new Map<string, string | null>();
export const getPageMeta = (name: string): string | null => {
	if (typeof window === 'undefined') return null;
	const cached = MetaCache.get(name);
	if (cached !== undefined) return cached;
	try {
		const value = window.document?.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ?? null;
		MetaCache.set(name, value);
		return value;
	} catch {
		return null;
	}
};
