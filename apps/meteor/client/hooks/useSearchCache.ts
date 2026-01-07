export interface CacheEntry<T> {
    query: string;
    results: T[];
    timestamp: number;
}

export class SearchCache<T> {
    private cache = new Map<string, CacheEntry<T>>();

    constructor(private maxSize = 50) {}

    get(query: string): T[] | null {
        const entry = this.cache.get(query);
        if (!entry) return null;

        this.cache.delete(query);
        this.cache.set(query, entry);
        return entry.results;
    }

    set(query: string, results: T[]): void {
        if (this.cache.has(query)) this.cache.delete(query);

        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(query, { query, results, timestamp: Date.now() });
    }
}