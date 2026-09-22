import { Emitter } from '@rocket.chat/emitter';

export type MirroredCollectionChange<T> = { action: 'added' | 'changed'; id: string; record: T } | { action: 'removed'; id: string };

/**
 * An in-memory copy of a collection whose source of truth lives in another process. Consumers replay the current
 * records and then follow the changes. Every set is reported, as added or changed depending on whether the id was
 * already held; removing an id that is not held reports nothing.
 */
export class MirroredCollection<T> {
	private readonly records = new Map<string, T>();

	private readonly changes = new Emitter<{ change: MirroredCollectionChange<T> }>();

	set(id: string, record: T): void {
		const action = this.records.has(id) ? 'changed' : 'added';
		this.records.set(id, record);
		this.changes.emit('change', { action, id, record });
	}

	remove(id: string): void {
		if (!this.records.delete(id)) {
			return;
		}
		this.changes.emit('change', { action: 'removed', id });
	}

	entries(): IterableIterator<[string, T]> {
		return this.records.entries();
	}

	onChange(handler: (change: MirroredCollectionChange<T>) => void): () => void {
		return this.changes.on('change', handler);
	}
}
