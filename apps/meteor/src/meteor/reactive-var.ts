import { Package } from './package-registry.ts';
import { Dependency, Tracker } from './tracker.ts';

type EqualsFunc<T> = (oldValue: T, newValue: T) => boolean;

/**
 * @class
 * @instanceName reactiveVar
 * @summary Constructor for a ReactiveVar, which represents a single reactive variable.
 * @locus Client
 * @param {Any} initialValue The initial value to set.  `equalsFunc` is ignored when setting the initial value.
 * @param {Function} [equalsFunc] Optional.  A function of two arguments, called on the old value and the new value whenever the ReactiveVar is set.  If it returns true, no set is performed.  If omitted, the default `equalsFunc` returns true if its arguments are `===` and are of type number, boolean, string, undefined, or null.
 */
export class ReactiveVar<T> {
	private curValue: T;

	private equalsFunc?: EqualsFunc<T> | undefined;

	private dep: Dependency;

	constructor(initialValue: T, equalsFunc?: EqualsFunc<T>) {
		this.curValue = initialValue;
		this.equalsFunc = equalsFunc;
		this.dep = new Dependency();
	}

	/**
	 * @summary Returns the current value of the ReactiveVar, establishing a reactive dependency.
	 * @locus Client
	 */
	get(): T {
		if (Tracker.active) {
			this.dep.depend();
		}

		return this.curValue;
	}

	/**
	 * @summary Sets the current value of the ReactiveVar, invalidating the Computations that called `get` if `newValue` is different from the old value.
	 * @locus Client
	 * @param {Any} newValue
	 */
	set(newValue: T): void {
		const oldValue = this.curValue;

		if ((this.equalsFunc || ReactiveVar._isEqual)(oldValue, newValue)) {
			return;
		}

		this.curValue = newValue;
		this.dep.changed();
	}

	toString(): string {
		return `ReactiveVar{${this.get()}}`;
	}

	_numListeners(): number {
		// Tests want to know.
		// Accesses a private field of Tracker.Dependency.
		return Object.keys((this.dep as any)._dependentsById || {}).length;
	}

	static _isEqual(oldValue: any, newValue: any): boolean {
		const a = oldValue;
		const b = newValue;
		// Two values are "equal" here if they are `===` and are
		// number, boolean, string, undefined, or null.
		if (a !== b) {
			return false;
		}
		return !a || typeof a === 'number' || typeof a === 'boolean' || typeof a === 'string';
	}
}

Package['reactive-var'] = {
	ReactiveVar,
};
