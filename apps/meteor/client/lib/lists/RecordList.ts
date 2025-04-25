import { Emitter } from '@rocket.chat/emitter';

import { AsyncStatePhase } from '../asyncState';

export type RecordListBatchChanges<T> = {
	items?: T[];
	itemCount?: number;
};

export class RecordList<T extends { _id: string; _updatedAt?: Date }> extends Emitter {
	#hasChanges = false;

	#index = new Map<T['_id'], T>();

	#phase: AsyncStatePhase.LOADING | AsyncStatePhase.UPDATING | AsyncStatePhase.RESOLVED = AsyncStatePhase.LOADING;

	#items: T[] | undefined = undefined;

	#itemCount: number | undefined = undefined;

	protected filter(_item: T): boolean {
		return true;
	}

	protected compare(a: T, b: T): number {
		const aUpdatedAt = typeof a._updatedAt === 'string' ? new Date(a._updatedAt) : a._updatedAt;
		const bUpdatedAt = typeof b._updatedAt === 'string' ? new Date(b._updatedAt) : b._updatedAt;
		return (bUpdatedAt?.getTime() ?? -1) - (aUpdatedAt?.getTime() ?? -1);
	}

	public get phase(): AsyncStatePhase {
		return this.#phase;
	}

	public get items(): T[] {
		if (!this.#items) {
			this.#items = Array.from(this.#index.values()).sort(this.compare);
		}

		return this.#items;
	}

	public get itemCount(): number {
		return this.#itemCount ?? this.#index.size;
	}

	private insert(item: T): void {
		this.#index.set(item._id, item);
		this.emit(`${item._id}/inserted`, item);
		if (typeof this.#itemCount === 'number') {
			this.#itemCount++;
		}
		this.#hasChanges = true;
	}

	private update(item: T): void {
		this.#index.set(item._id, item);
		this.emit(`${item._id}/updated`, item);
		this.#hasChanges = true;
	}

	private delete(_id: T['_id']): void {
		this.#index.delete(_id);
		this.emit(`${_id}/deleted`);
		if (typeof this.#itemCount === 'number') {
			this.#itemCount--;
		}
		this.#hasChanges = true;
	}

	private push(item: T): void {
		const exists = this.#index.has(item._id);
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

	#pedingMutation: Promise<void> = Promise.resolve();

	protected async mutate(mutation: () => void | Promise<void>): Promise<void> {
		try {
			if (this.#phase === AsyncStatePhase.RESOLVED) {
				this.#phase = AsyncStatePhase.UPDATING;
				this.emit('mutating');
			}

			this.#pedingMutation = this.#pedingMutation.then(mutation);
			await this.#pedingMutation;
		} catch (error) {
			this.emit('errored', error);
		} finally {
			const hasChanged = this.#hasChanges;
			this.#phase = AsyncStatePhase.RESOLVED;
			if (hasChanged) {
				this.#items = undefined;
				this.#hasChanges = false;
			}
			this.emit('mutated', hasChanged);
		}
	}

	public batchHandle(getInfo: () => Promise<RecordListBatchChanges<T>>): Promise<void> {
		return this.mutate(async () => {
			const info = await getInfo();

			if (info.items) {
				for (const item of info.items) {
					this.push(item);
				}
			}

			if (Number.isInteger(info.itemCount)) {
				this.#itemCount = info.itemCount;
				this.#hasChanges = true;
			}
		});
	}

	public prune(matchCriteria: (item: T) => boolean): Promise<void> {
		return this.mutate(() => {
			for (const item of this.#index.values()) {
				if (matchCriteria(item)) {
					this.delete(item._id);
				}
			}
		});
	}

	public handle(item: T): Promise<void> {
		return this.mutate(() => {
			this.push(item);
		});
	}

	public remove(_id: T['_id']): Promise<void> {
		return this.mutate(() => {
			if (!this.#index.has(_id)) {
				return;
			}

			this.delete(_id);
		});
	}

	public clear(): Promise<void> {
		return this.mutate(() => {
			if (this.#index.size === 0) {
				return;
			}

			this.#index.clear();
			this.#items = undefined;
			this.#itemCount = undefined;
			this.#hasChanges = true;
			this.emit('cleared');
		});
	}
}
