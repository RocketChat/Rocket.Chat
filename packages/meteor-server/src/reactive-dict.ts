/**
 * Minimal server-side ReactiveDict: a plain key-value store. There is no
 * reactivity on the server (Tracker computations never rerun), matching
 * Meteor's behavior outside an active computation.
 */
export class ReactiveDict<T extends Record<string, unknown> = Record<string, unknown>> {
	private values = new Map<string, unknown>();

	constructor(_dictName?: string | T, initialValue?: T) {
		const initial = typeof _dictName === 'object' ? _dictName : initialValue;
		if (initial) {
			for (const [key, value] of Object.entries(initial)) {
				this.values.set(key, value);
			}
		}
	}

	get(key: string): unknown {
		return this.values.get(key);
	}

	set(key: string | Record<string, unknown>, value?: unknown): void {
		if (typeof key === 'object') {
			for (const [k, v] of Object.entries(key)) {
				this.values.set(k, v);
			}
			return;
		}
		this.values.set(key, value);
	}

	setDefault(key: string, value: unknown): void {
		if (!this.values.has(key)) {
			this.values.set(key, value);
		}
	}

	equals(key: string, value: unknown): boolean {
		return this.values.get(key) === value;
	}

	all(): Record<string, unknown> {
		return Object.fromEntries(this.values);
	}

	delete(key: string): boolean {
		return this.values.delete(key);
	}

	clear(): void {
		this.values.clear();
	}
}
