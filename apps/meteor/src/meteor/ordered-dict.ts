/**
 * Internal interface for the Doubly Linked List Node.
 */
type Node<K, V> = {
	key: K;
	value: V;
	next: Node<K, V> | undefined;
	prev: Node<K, V> | undefined;
};

export class OrderedDict<K = string, V = unknown> implements Iterable<[K, V]> {
	// We use a native Map for O(1) lookups of nodes by key.
	// This removes the need for custom stringifiers and prefixing.
	private _map: Map<K, Node<K, V>>;

	// Pointers to head and tail of the list
	private _head: Node<K, V> | undefined;

	private _tail: Node<K, V> | undefined;

	constructor(entries?: Iterable<[K, V]>) {
		this._map = new Map();

		if (entries) {
			for (const [k, v] of entries) {
				this.append(k, v);
			}
		}
	}

	/**
	 * Standard Iterator support.
	 * Allows: for (const [k, v] of dict) { ... }
	 */
	*[Symbol.iterator](): Iterator<[K, V]> {
		let current = this._head;
		while (current) {
			yield [current.key, current.value];
			current = current.next;
		}
	}

	get size(): number {
		return this._map.size;
	}

	get empty(): boolean {
		return this._map.size === 0;
	}

	has(key: K): boolean {
		return this._map.has(key);
	}

	get(key: K): V | undefined {
		return this._map.get(key)?.value;
	}

	first(): K | undefined {
		return this._head?.key;
	}

	last(): K | undefined {
		return this._tail?.key;
	}

	next(key: K): K | undefined {
		return this._map.get(key)?.next?.key;
	}

	prev(key: K): K | undefined {
		return this._map.get(key)?.prev?.key;
	}

	/**
	 * Appends value to the end of the dictionary.
	 */
	append(key: K, value: V): void {
		if (this._map.has(key)) {
			throw new Error(`Item ${String(key)} already present.`);
		}

		const node: Node<K, V> = { key, value, next: undefined, prev: this._tail };

		if (!this._head) {
			this._head = node;
		}

		if (this._tail) {
			this._tail.next = node;
		}

		this._tail = node;
		this._map.set(key, node);
	}

	/**
	 * Inserts a value before a specific key.
	 * If `beforeKey` is null/undefined, appends to the end.
	 */
	putBefore(key: K, value: V, beforeKey?: K | null): void {
		if (this._map.has(key)) {
			throw new Error(`Item ${String(key)} already present.`);
		}

		// If no "before" key, just append (O(1))
		if (!beforeKey) {
			this.append(key, value);
			return;
		}

		const nextNode = this._map.get(beforeKey);
		if (!nextNode) {
			throw new Error(`Reference item ${String(beforeKey)} not found.`);
		}

		const newNode: Node<K, V> = {
			key,
			value,
			next: nextNode,
			prev: nextNode.prev,
		};

		if (nextNode.prev) {
			nextNode.prev.next = newNode;
		} else {
			// If nextNode was head, new node is now head
			this._head = newNode;
		}

		nextNode.prev = newNode;
		this._map.set(key, newNode);
	}

	/**
	 * Removes an item and returns its value.
	 */
	remove(key: K): V {
		const node = this._map.get(key);
		if (!node) {
			throw new Error(`Item ${String(key)} not found.`);
		}

		this._unlink(node);
		this._map.delete(key);
		return node.value;
	}

	/**
	 * Moves an existing key to a position before another key.
	 */
	moveBefore(key: K, beforeKey: K | null): void {
		const node = this._map.get(key);
		if (!node) {
			throw new Error(`Item to move ${String(key)} not found.`);
		}

		// Optimization: If moving before itself or if the structure dictates no change
		if (key === beforeKey) return;

		// Unlink the node from its current position
		this._unlink(node);

		// Relink it in the new position
		if (!beforeKey) {
			// Move to end
			node.prev = this._tail;
			node.next = undefined;

			if (this._tail) this._tail.next = node;
			this._tail = node;
			if (!this._head) this._head = node; // Edge case: list became empty during unlink (unlikely here but safe)
		} else {
			const nextNode = this._map.get(beforeKey);
			if (!nextNode) throw new Error(`Reference item ${String(beforeKey)} not found.`);

			node.next = nextNode;
			node.prev = nextNode.prev;

			if (nextNode.prev) nextNode.prev.next = node;
			else this._head = node;

			nextNode.prev = node;
		}
	}

	/**
	 * Legacy support for callback-based iteration.
	 * Recommending using `for (const [k, v] of dict)` instead.
	 */
	forEach(callback: (value: V, key: K, index: number) => void | { break: boolean }): void {
		let current = this._head;
		let index = 0;
		while (current) {
			const result = callback(current.value, current.key, index++);
			if (result && typeof result === 'object' && result.break) return;
			current = current.next;
		}
	}

	/**
	 * Internal helper to remove a node from the linked list chain
	 */
	private _unlink(node: Node<K, V>): void {
		if (node.prev) {
			node.prev.next = node.next;
		} else {
			this._head = node.next;
		}

		if (node.next) {
			node.next.prev = node.prev;
		} else {
			this._tail = node.prev;
		}
	}

	/**
	 * Clears the dictionary
	 */
	clear(): void {
		this._map.clear();
		this._head = undefined;
		this._tail = undefined;
	}
}
