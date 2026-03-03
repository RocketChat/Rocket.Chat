export type Element<K, V> = {
  key: K;
  value: V;
  next: Element<K, V> | null;
  prev: Element<K, V> | null;
};

export type Stringifier<K> = (key: K) => any;

export type IterationCallback<K, V> = (value: V, key: K, index: number) => any;

export type AsyncIterationCallback<K, V> = (value: V, key: K, index: number) => Promise<any>;

export class OrderedDict<K = any, V = any> {
  static readonly BREAK = { break: true };

  _dict: Record<string, Element<K, V>>;
  _first: Element<K, V> | null;
  _last: Element<K, V> | null;
  _size: number;
  _stringify: Stringifier<K>;

  constructor(...args: any[]) {
    this._dict = Object.create(null);
    this._first = null;
    this._last = null;
    this._size = 0;

    if (typeof args[0] === 'function') {
      this._stringify = args.shift() as Stringifier<K>;
    } else {
      this._stringify = (x: K) => x;
    }

    args.forEach((kv: [K, V]) => this.putBefore(kv[0], kv[1], null));
  }

  // Prefix keys with a space to avoid collision with standard Object properties
  _k(key: K): string {
    return ` ${String(this._stringify(key))}`;
  }

  empty(): boolean {
    return !this._first;
  }

  size(): number {
    return this._size;
  }

  _linkEltIn(elt: Element<K, V>): void {
    if (!elt.next) {
      elt.prev = this._last;
      if (this._last) {
        this._last.next = elt;
      }
      this._last = elt;
    } else {
      elt.prev = elt.next.prev;
      if (elt.next.prev) {
        elt.next.prev.next = elt;
      } else {
        // If elt.next.prev was null, elt is the new first element
        this._first = elt;
      }
      elt.next.prev = elt;
    }
    
    if (this._first === null || this._first === elt.next) {
      this._first = elt;
    }
  }

  _linkEltOut(elt: Element<K, V>): void {
    if (elt.next) elt.next.prev = elt.prev;
    if (elt.prev) elt.prev.next = elt.next;
    if (elt === this._last) this._last = elt.prev;
    if (elt === this._first) this._first = elt.next;
  }

  putBefore(key: K, item: V, before: K | null): void {
    if (this._dict[this._k(key)]) {
      throw new Error(`Item ${String(key)} already present in OrderedDict`);
    }

    const elt: Element<K, V> = before
      ? { key, value: item, next: this._dict[this._k(before)], prev: null }
      : { key, value: item, next: null, prev: null };

    if (before !== null && typeof elt.next === "undefined") {
      throw new Error("Could not find item to put this one before");
    }

    this._linkEltIn(elt);
    this._dict[this._k(key)] = elt;
    this._size++;
  }

  append(key: K, item: V): void {
    this.putBefore(key, item, null);
  }

  remove(key: K): V {
    const elt = this._dict[this._k(key)];
    if (typeof elt === "undefined") {
      throw new Error(`Item ${String(key)} not present in OrderedDict`);
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

  forEach(iter: IterationCallback<K, V>, context: any = null): void {
    let i = 0;
    let elt = this._first;
    while (elt !== null) {
      const b = iter.call(context, elt.value, elt.key, i);
      if (b === OrderedDict.BREAK) return;
      elt = elt.next;
      i++;
    }
  }

  async forEachAsync(asyncIter: AsyncIterationCallback<K, V>, context: any = null): Promise<void> {
    let i = 0;
    let elt = this._first;
    while (elt !== null) {
      const b = await asyncIter.call(context, elt.value, elt.key, i);
      if (b === OrderedDict.BREAK) return;
      elt = elt.next;
      i++;
    }
  }

  first(): K | undefined {
    if (this.empty() || !this._first) return undefined;
    return this._first.key;
  }

  firstValue(): V | undefined {
    if (this.empty() || !this._first) return undefined;
    return this._first.value;
  }

  last(): K | undefined {
    if (this.empty() || !this._last) return undefined;
    return this._last.key;
  }

  lastValue(): V | undefined {
    if (this.empty() || !this._last) return undefined;
    return this._last.value;
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

  moveBefore(key: K, before: K | null): void {
    const elt = this._dict[this._k(key)];
    const eltBefore = before ? this._dict[this._k(before)] : null;
    
    if (typeof elt === "undefined") {
      throw new Error("Item to move is not present");
    }
    if (before !== null && typeof eltBefore === "undefined") {
      throw new Error("Could not find element to move this one before");
    }
    if (eltBefore === elt.next) {
      return; // No moving necessary
    }
    
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
      return;
    });
    return ret;
  }

  _checkRep(): void {
    Object.keys(this._dict).forEach(k => {
      const v = this._dict[k];
      if (v.next === v) {
        throw new Error("Next is a loop");
      }
      if (v.prev === v) {
        throw new Error("Prev is a loop");
      }
    });
  }
}