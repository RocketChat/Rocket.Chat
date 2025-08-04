type ElementType<TKey, TValue> = {
	key: TKey;
	value: TValue;
	next: ElementType<TKey, TValue> | null;
	prev: ElementType<TKey, TValue> | null;
};

function element<TKey, TValue>(
	key: TKey,
	value: TValue,
	next: ElementType<TKey, TValue> | null,
	prev: ElementType<TKey, TValue> | null = null,
): ElementType<TKey, TValue> {
	return {
		key,
		value,
		next,
		prev,
	};
}

export class OrderedDict<TKey extends string, TValue> {
	private _dict: Record<string, ElementType<TKey, TValue>> = Object.create(null);

	private _first: ElementType<TKey, TValue> | null = null;

	private _last: ElementType<TKey, TValue> | null = null;

	private _size = 0;

	_k(key: TKey): string {
		return ` ${key}`;
	}

	empty(): boolean {
		return !this._first;
	}

	size(): number {
		return this._size;
	}

	_linkEltIn(elt: ElementType<TKey, TValue>): void {
		if (!elt.next) {
			elt.prev = this._last;
			if (this._last) this._last.next = elt;
			this._last = elt;
		} else {
			elt.prev = elt.next.prev;
			elt.next.prev = elt;
			if (elt.prev) elt.prev.next = elt;
		}
		if (this._first === null || this._first === elt.next) this._first = elt;
	}

	_linkEltOut(elt: ElementType<TKey, TValue>): void {
		if (elt.next) elt.next.prev = elt.prev;
		if (elt.prev) elt.prev.next = elt.next;
		if (elt === this._last) this._last = elt.prev;
		if (elt === this._first) this._first = elt.next;
	}

	putBefore(key: TKey, item: TValue, before: TKey | null): void {
		if (this._dict[this._k(key)]) throw new Error(`Item ${key} already present in OrderedDict`);
		const elt = before ? element(key, item, this._dict[this._k(before)]) : element(key, item, null);
		if (typeof elt.next === 'undefined') throw new Error('could not find item to put this one before');
		this._linkEltIn(elt);
		this._dict[this._k(key)] = elt;
		this._size++;
	}

	append(key: TKey, item: TValue): void {
		this.putBefore(key, item, null);
	}

	remove(key: TKey): TValue {
		const elt = this._dict[this._k(key)];
		if (typeof elt === 'undefined') throw new Error(`Item ${key} not present in OrderedDict`);
		this._linkEltOut(elt);
		this._size--;
		delete this._dict[this._k(key)];
		return elt.value;
	}

	get(key: TKey): TValue | undefined {
		if (this.has(key)) {
			return this._dict[this._k(key)].value;
		}
	}

	has(key: TKey): boolean {
		return Object.prototype.hasOwnProperty.call(this._dict, this._k(key));
	}

	forEach(iter: (value: TValue, key: TKey, index: number) => void | typeof OrderedDict.BREAK, context?: null): void;

	forEach<TContext>(
		iter: (this: TContext, value: TValue, key: TKey, index: number) => void | typeof OrderedDict.BREAK,
		context: TContext,
	): void;

	forEach<TContext>(
		iter: (this: TContext | null, value: TValue, key: TKey, index: number) => void | typeof OrderedDict.BREAK,
		context: TContext | null = null,
	): void {
		let i = 0;
		let elt = this._first;
		while (elt !== null) {
			const b = iter.call(context, elt.value, elt.key, i);
			if (b === OrderedDict.BREAK) return;
			elt = elt.next;
			i++;
		}
	}

	async forEachAsync(
		asyncIter: (value: TValue, key: TKey, index: number) => Promise<void | typeof OrderedDict.BREAK>,
		context?: null,
	): Promise<void>;

	async forEachAsync<TContext>(
		asyncIter: (this: TContext, value: TValue, key: TKey, index: number) => Promise<void | typeof OrderedDict.BREAK>,
		context: TContext,
	): Promise<void>;

	async forEachAsync<TContext>(
		asyncIter: (this: TContext | null, value: TValue, key: TKey, index: number) => Promise<void | typeof OrderedDict.BREAK>,
		context: TContext | null = null,
	): Promise<void> {
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

	first(): TKey | undefined {
		if (this.empty()) {
			return;
		}
		return this._first?.key;
	}

	firstValue(): TValue | undefined {
		if (this.empty()) {
			return;
		}
		return this._first?.value;
	}

	last(): TKey | undefined {
		if (this.empty()) {
			return;
		}
		return this._last?.key;
	}

	lastValue(): TValue | undefined {
		if (this.empty()) {
			return;
		}
		return this._last?.value;
	}

	prev(key: TKey): TKey | null {
		if (this.has(key)) {
			const elt = this._dict[this._k(key)];
			if (elt.prev) return elt.prev.key;
		}
		return null;
	}

	next(key: TKey): TKey | null {
		if (this.has(key)) {
			const elt = this._dict[this._k(key)];
			if (elt.next) return elt.next.key;
		}
		return null;
	}

	moveBefore(key: TKey, before: TKey | null): void {
		const elt = this._dict[this._k(key)];
		const eltBefore = before ? this._dict[this._k(before)] : null;
		if (typeof elt === 'undefined') {
			throw new Error('Item to move is not present');
		}
		if (typeof eltBefore === 'undefined') {
			throw new Error('Could not find element to move this one before');
		}
		if (eltBefore === elt.next) return;
		this._linkEltOut(elt);
		elt.next = eltBefore;
		this._linkEltIn(elt);
	}

	indexOf(key: TKey): number {
		let ret = -1;
		this.forEach((_v, k, i) => {
			if (this._k(k) === this._k(key)) {
				ret = i;
				return OrderedDict.BREAK;
			}
		});
		return ret;
	}

	_checkRep(): void {
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

	static readonly BREAK = { break: true } as const;
}
