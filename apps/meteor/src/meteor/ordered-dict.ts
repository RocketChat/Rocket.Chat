import { Package } from './package-registry';

interface IOrderedDictElement<K, V> {
	key: K;
	value: V;
	next: IOrderedDictElement<K, V> | null;
	prev: IOrderedDictElement<K, V> | null;
}

export class OrderedDict<K = string, V = unknown> {
	public static BREAK = { break: true };

	private _dict: Record<string, IOrderedDictElement<K, V>>;

	private _first: IOrderedDictElement<K, V> | null;

	private _last: IOrderedDictElement<K, V> | null;

	private _size: number;

	private _stringify: (key: K) => string;

	constructor(stringify?: ((key: K) => string) | [K, V], ...rest: [K, V][]) {
		this._dict = Object.create(null);
		this._first = null;
		this._last = null;
		this._size = 0;

		const args: (typeof stringify | [K, V])[] = [];
		if (stringify !== undefined) {
			args.push(stringify);
		}
		args.push(...rest);

		if (args.length > 0 && typeof args[0] === 'function') {
			this._stringify = args.shift() as (key: K) => string;
		} else {
			this._stringify = function (x: K) {
				return String(x);
			};
		}

		(args as [K, V][]).forEach((kv) => this.putBefore(kv[0], kv[1], null));
	}

	_k(key: K): string {
		return ` ${this._stringify(key)}`;
	}

	empty(): boolean {
		return !this._first;
	}

	size(): number {
		return this._size;
	}

	_linkEltIn(elt: IOrderedDictElement<K, V>) {
		if (!elt.next) {
			elt.prev = this._last;

			if (this._last) {
				this._last.next = elt;
			}

			this._last = elt;
		} else {
			elt.prev = elt.next.prev;
			elt.next.prev = elt;

			if (elt.prev) {
				elt.prev.next = elt;
			}
		}

		if (this._first === null || this._first === elt.next) {
			this._first = elt;
		}
	}

	_linkEltOut(elt: IOrderedDictElement<K, V>) {
		if (elt.next) {
			elt.next.prev = elt.prev;
		}
		if (elt.prev) {
			elt.prev.next = elt.next;
		}
		if (elt === this._last) {
			this._last = elt.prev;
		}
		if (elt === this._first) {
			this._first = elt.next;
		}
	}

	putBefore(key: K, item: V, before: K | null = null) {
		if (this._dict[this._k(key)]) {
			throw new Error(`Item ${key} already present in OrderedDict`);
		}

		let next: IOrderedDictElement<K, V> | undefined | null = null;
		if (before) {
			next = this._dict[this._k(before)];
			if (next === undefined) {
				throw new Error('could not find item to put this one before');
			}
		}

		const elt: IOrderedDictElement<K, V> = {
			key,
			value: item,
			next,
			prev: null,
		};

		this._linkEltIn(elt);
		this._dict[this._k(key)] = elt;
		this._size++;
	}

	append(key: K, item: V) {
		this.putBefore(key, item, null);
	}

	remove(key: K): V {
		const elt = this._dict[this._k(key)];

		if (typeof elt === 'undefined') {
			throw new Error(`Item ${key} not present in OrderedDict`);
		}

		this._linkEltOut(elt);
		this._size--;
		delete this._dict[this._k(key)];

		return elt.value;
	}

	get(key: K): V | undefined {
		if (this.has(key)) {
			return this._dict[this._k(key)].value;
		}
		return undefined;
	}

	has(key: K): boolean {
		return Object.prototype.hasOwnProperty.call(this._dict, this._k(key));
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	forEach(iter: (value: V, key: K, index: number) => any, context: any = null) {
		let i = 0;
		let elt = this._first;

		while (elt !== null) {
			const b = iter.call(context, elt.value, elt.key, i);

			if (b === OrderedDict.BREAK) return;

			elt = elt.next;
			i++;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	async forEachAsync(asyncIter: (value: V, key: K, index: number) => Promise<any>, context: any = null) {
		let i = 0;
		let elt = this._first;

		while (elt !== null) {
			// eslint-disable-next-line no-await-in-loop
			const b = await asyncIter.call(context, elt.value, elt.key, i);

			if (b === OrderedDict.BREAK) return;

			elt = elt.next;
			i++;
		}
	}

	first(): K | undefined {
		return this._first?.key;
	}

	firstValue(): V | undefined {
		return this._first?.value;
	}

	last(): K | undefined {
		return this._last?.key;
	}

	lastValue(): V | undefined {
		return this._last?.value;
	}

	prev(key: K): K | null {
		if (this.has(key)) {
			const elt = this._dict[this._k(key)];

			if (elt.prev) return elt.prev.key;
		}

		return null;
	}

	next(key: K): K | null {
		if (this.has(key)) {
			const elt = this._dict[this._k(key)];

			if (elt.next) return elt.next.key;
		}

		return null;
	}

	moveBefore(key: K, before: K | null) {
		const elt = this._dict[this._k(key)];
		const eltBefore = before ? this._dict[this._k(before)] : null;

		if (typeof elt === 'undefined') {
			throw new Error('Item to move is not present');
		}

		if (before !== null && typeof eltBefore === 'undefined') {
			throw new Error('Could not find element to move this one before');
		}

		if (eltBefore === elt.next) return;

		this._linkEltOut(elt);
		elt.next = eltBefore;
		this._linkEltIn(elt);
	}

	indexOf(key: K): number | null {
		let ret: number | null = null;

		this.forEach((_v, k, i) => {
			if (this._k(k) === this._k(key)) {
				ret = i;

				return OrderedDict.BREAK;
			}
		});

		return ret;
	}

	_checkRep() {
		Object.keys(this._dict).forEach((k) => {
			const v = this._dict[k];

			if (v.next === v) {
				throw new Error('Next is a loop');
			}

			if (v.prev === v) {
				throw new Error('Prev is a loop');
			}
		});
	}
}

Package['ordered-dict'] = {
	OrderedDict,
};
