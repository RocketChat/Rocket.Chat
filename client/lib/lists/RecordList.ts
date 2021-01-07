import { Emitter } from '@rocket.chat/emitter';

import type { IRocketChatRecord } from '../../../definition/IRocketChatRecord';

export class RecordList<T extends IRocketChatRecord> extends Emitter {
	protected index = new Map<T['_id'], T>();

	protected filter(_item: T): boolean {
		return true;
	}

	protected compare(a: T, b: T): number {
		return a._updatedAt.getTime() - b._updatedAt.getTime();
	}

	private _cache: T[] | undefined;

	public push(...items: T[]): void {
		if (items.length === 0) {
			return;
		}

		const events: (() => void)[] = [];

		for (const item of items) {
			const upserted = this.filter?.(item) ?? true;

			if (!upserted) {
				this.index.delete(item._id);

				const eventName = `${ item._id }/deleted`;
				events.push(() => this.emit(eventName, item));
				continue;
			}

			const updated = this.index.has(item._id);

			this.index.set(item._id, item);

			const eventName = `${ item._id }/${ updated ? 'updated' : 'inserted' }`;
			events.push(() => this.emit(eventName, item));
		}

		this._cache = undefined;

		events.forEach((triggerEvent) => triggerEvent());
		this.emit('updated');
	}

	public items(): T[] {
		if (!this._cache) {
			this._cache = Array.from(this.index.values()).sort(this.compare);
		}

		return this._cache;
	}

	public clear(): void {
		this.index.clear();
		this._cache = undefined;
		this.emit('cleared');
	}
}
