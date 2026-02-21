import { Dependency, Tracker } from './tracker.ts';

type EqualsFunc<T> = (oldValue: T, newValue: T) => boolean;

const isEqual = (a: unknown, b: unknown): boolean => {
	if (a !== b) return false;
	return a === null || (typeof a !== 'object' && typeof a !== 'function');
};

export class ReactiveVar<T> {
	#value: T;

	readonly #equals: EqualsFunc<T>;

	readonly #dep = new Dependency();

	constructor(initialValue: T, equalsFunc: EqualsFunc<T> = isEqual) {
		this.#value = initialValue;
		this.#equals = equalsFunc;
	}

	get(): T {
		if (Tracker.active) this.#dep.depend();
		return this.#value;
	}

	set(newValue: T): void {
		if (this.#equals(this.#value, newValue)) return;

		this.#value = newValue;
		this.#dep.changed();
	}

	toString(): string {
		return `ReactiveVar{${this.get()}}`;
	}
}
