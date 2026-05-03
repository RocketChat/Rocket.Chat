/**
 * Lightweight in-memory LRU cache for translations.
 * Helps prevent redundant translation provider API calls.
 */
export class TranslationMemoryCache {
	private static map = new Map<string, string>();

	private static MAX_CACHE_SIZE = 10000;

	private static generateKey(provider: string, originalText: string, targetLanguage: string): string {
		return `${provider}:${targetLanguage}:${originalText}`;
	}

	static get(provider: string, originalText: string, targetLanguage: string): string | undefined {
		const key = this.generateKey(provider, originalText, targetLanguage);
		const cached = this.map.get(key);
		if (cached) {
			// Refresh LRU by re-inserting
			this.map.delete(key);
			this.map.set(key, cached);
		}
		return cached;
	}

	static set(provider: string, originalText: string, targetLanguage: string, translation: string): void {
		const key = this.generateKey(provider, originalText, targetLanguage);
		if (this.map.has(key)) {
			this.map.delete(key);
		} else if (this.map.size >= this.MAX_CACHE_SIZE) {
			// Evict the oldest entry (first item in Map)
			const firstKey = this.map.keys().next().value;
			if (firstKey) {
				this.map.delete(firstKey);
			}
		}
		this.map.set(key, translation);
	}

	static clear(): void {
		this.map.clear();
	}
}
