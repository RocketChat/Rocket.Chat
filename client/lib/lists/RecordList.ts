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

	public items(): T[] {
		if (!this._cache) {
			this._cache = Array.from(this.index.values()).sort(this.compare);
		}

		return this._cache;
	}

	protected insert(item: T): void {
		this.index.set(item._id, item);
		this._cache = undefined;
		this.emit(`${ item._id }/inserted`, item);
	}

	protected update(item: T): void {
		this.index.set(item._id, item);
		this._cache = undefined;
		this.emit(`${ item._id }/updated`, item);
	}

	protected merge(partial: { _id: T['_id'] } & Partial<Omit<T, '_id'>>): void {
		const prevItem = this.index.get(partial._id);

		if (!prevItem) {
			return;
		}

		const newItem = { ...prevItem, ...partial };

		this.index.set(partial._id, newItem);
		this._cache = undefined;
		this.emit(`${ newItem._id }/updated`, newItem);
	}

	protected delete(_id: T['_id']): void {
		this.index.delete(_id);
		this._cache = undefined;
		this.emit(`${ _id }/deleted`);
	}

	protected push(item: T): void {
		const exists = this.index.has(item._id);
		const valid = this.filter(item);

		if (exists && !valid) {
			this.delete(item._id);
			return;
		}

		if (exists && valid) {
			this.update(item);
			return;
		}

		if (!exists && valid) {
			this.insert(item);
		}
	}

	public async pushMany(items: T[] | (() => (T[] | Promise<T[]>))): Promise<void> {
		try {
			this.emit('mutating');

			if (typeof items === 'function') {
				items = await items();
			}

			if (items.length === 0) {
				this.emit('mutated', false);
				return;
			}

			for (const item of items) {
				this.push(item);
			}

			this.emit('mutated', true);
		} catch (error) {
			this.emit('errored', error);
		}
	}

	public deleteMany(matchCriteria: (item: T) => boolean): void {
		try {
			this.emit('mutating');

			let hasChanged = false;

			for (const item of this.index.values()) {
				if (matchCriteria(item)) {
					this.delete(item._id);
					hasChanged = true;
				}
			}

			this.emit('mutated', hasChanged);
		} catch (error) {
			this.emit('errored', error);
		}
	}

	public async pushOne(item: T | (() => (T | Promise<T>))): Promise<void> {
		if (typeof item === 'function') {
			return this.pushMany(async () => [await item()]);
		}

		return this.pushMany(() => [item]);
	}

	public deleteOne(_id: T['_id']): void {
		try {
			this.emit('mutating');

			const item = this.index.get(_id);

			if (!item) {
				this.emit('mutated', false);
				return;
			}

			this.delete(item._id);
			this.emit('mutated', true);
		} catch (error) {
			this.emit('errored', error);
		}
	}

	public clear(): void {
		if (this.index.size === 0) {
			return;
		}

		this.index.clear();
		this._cache = undefined;
		this.emit('cleared');
	}
}
