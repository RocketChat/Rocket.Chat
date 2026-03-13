type Node<K, V> = {
	key: K;
	value: V;
	next?: Node<K, V>;
	prev?: Node<K, V>;
};

export class OrderedDict<K = string, V = unknown> implements Iterable<[K, V]> {
	readonly #map = new Map<K, Node<K, V>>();

	#head?: Node<K, V>;

	#tail?: Node<K, V>;

	constructor(entries?: Iterable<readonly [K, V]>) {
		if (entries) {
			for (const [k, v] of entries) this.append(k, v);
		}
	}

	*[Symbol.iterator](): Iterator<[K, V]> {
		yield* this.entries();
	}

	*entries(): IterableIterator<[K, V]> {
		for (let n = this.#head; n; n = n.next) yield [n.key, n.value];
	}

	*keys(): IterableIterator<K> {
		for (let n = this.#head; n; n = n.next) yield n.key;
	}

	*values(): IterableIterator<V> {
		for (let n = this.#head; n; n = n.next) yield n.value;
	}

	get size(): number {
		return this.#map.size;
	}

	get empty(): boolean {
		return this.#map.size === 0;
	}

	has(key: K): boolean {
		return this.#map.has(key);
	}

	get(key: K): V | undefined {
		return this.#map.get(key)?.value;
	}

	first(): K | undefined {
		return this.#head?.key;
	}

	last(): K | undefined {
		return this.#tail?.key;
	}

	next(key: K): K | undefined {
		return this.#map.get(key)?.next?.key;
	}

	prev(key: K): K | undefined {
		return this.#map.get(key)?.prev?.key;
	}

	set(key: K, value: V): void {
		const node = this.#map.get(key);
		if (node) node.value = value;
		else this.append(key, value);
	}

	append(key: K, value: V): void {
		if (this.#map.has(key)) throw new Error(`Item ${String(key)} already present.`);
		const node: Node<K, V> = { key, value };
		this.#insertTail(node);
		this.#map.set(key, node);
	}

	putBefore(key: K, value: V, beforeKey?: K | null): void {
		if (this.#map.has(key)) throw new Error(`Item ${String(key)} already present.`);
		const node: Node<K, V> = { key, value };

		if (!beforeKey) {
			this.#insertTail(node);
		} else {
			const ref = this.#map.get(beforeKey);
			if (!ref) throw new Error(`Reference item ${String(beforeKey)} not found.`);
			this.#insertBefore(node, ref);
		}
		this.#map.set(key, node);
	}

	remove(key: K): V {
		const node = this.#map.get(key);
		if (!node) throw new Error(`Item ${String(key)} not found.`);
		this.#unlink(node);
		this.#map.delete(key);
		return node.value;
	}

	moveBefore(key: K, beforeKey: K | null): void {
		if (key === beforeKey) return;

		const node = this.#map.get(key);
		if (!node) throw new Error(`Item to move ${String(key)} not found.`);

		this.#unlink(node);

		if (!beforeKey) {
			this.#insertTail(node);
		} else {
			const ref = this.#map.get(beforeKey);
			if (!ref) throw new Error(`Reference item ${String(beforeKey)} not found.`);
			this.#insertBefore(node, ref);
		}
	}

	forEach(callback: (value: V, key: K, index: number) => void | { break: boolean }): void {
		let index = 0;
		for (let n = this.#head; n; n = n.next) {
			const result = callback(n.value, n.key, index++);
			if (result && typeof result === 'object' && result.break) return;
		}
	}

	clear(): void {
		this.#map.clear();
		this.#head = undefined;
		this.#tail = undefined;
	}

	#unlink(node: Node<K, V>): void {
		if (node.prev) node.prev.next = node.next;
		else this.#head = node.next;

		if (node.next) node.next.prev = node.prev;
		else this.#tail = node.prev;

		node.next = undefined;
		node.prev = undefined;
	}

	#insertTail(node: Node<K, V>): void {
		node.prev = this.#tail;
		if (this.#tail) this.#tail.next = node;
		else this.#head = node;
		this.#tail = node;
	}

	#insertBefore(node: Node<K, V>, ref: Node<K, V>): void {
		node.next = ref;
		node.prev = ref.prev;

		if (ref.prev) ref.prev.next = node;
		else this.#head = node;

		ref.prev = node;
	}
}
