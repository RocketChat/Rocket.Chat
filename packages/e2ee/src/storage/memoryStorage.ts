export class MemoryStorage {
	#data = new Map<string, string>();
	clear(): void {
		this.#data.clear();
	}
	getItem(key: string): string | null {
		return this.#data.has(key) ? this.#data.get(key)! : null;
	}
	key(index: number): string | null {
		return Array.from(this.#data.keys())[index] ?? null;
	}
	removeItem(key: string): void {
		this.#data.delete(key);
	}
	setItem(key: string, value: string): void {
		this.#data.set(key, value);
	}
	get length(): number {
		return this.#data.size;
	}
}
