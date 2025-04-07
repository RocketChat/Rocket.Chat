import { Mongo } from 'meteor/mongo';
import { create } from 'zustand';

export type MinimongoSelector<T> = Mongo.Selector<T>;
export type MinimongoOptions<T> = Mongo.Options<T>;

interface IDocumentMapStore<T extends { _id: string }> {
	records: T[];
	get(_id: T['_id']): T | undefined;
	find<U extends T>(predicate: (record: T) => record is U): U | undefined;
	find(predicate: (record: T) => boolean): T | undefined;
}

export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
	protected declare _collection: Mongo.Collection<T> & {
		queries: Record<number, { __brand: 'query' }>;
		_docs: {
			_idStringify: (id: string) => string;
			_map: Map<T['_id'], T>;
		};
		_recomputeResults: (query: { __brand: 'query' }) => void;
	};

	readonly use = create<IDocumentMapStore<T>>()((_set, get) => ({
		records: [],
		get: (id: T['_id']) => get().records.find((record) => record._id === id),
		find: (predicate: (record: T) => boolean) => get().records.find(predicate),
	}));

	constructor() {
		super(null);

		let internal = false;

		this.find({}).observe({
			added: (record) => {
				internal = true;
				this.use.setState((state) => ({ records: [...state.records, record] }));
			},
			changed: (record) => {
				internal = true;
				this.use.setState((state) => {
					const records = [...state.records];
					const index = records.findIndex((r) => r._id === record._id);
					if (index !== -1) {
						records[index] = { ...record };
					}
					return { records };
				});
			},
			removed: (record) => {
				internal = true;
				this.use.setState((state) => ({
					records: state.records.filter((r) => r._id !== record._id),
				}));
			},
		});

		this.use.subscribe((state) => {
			if (internal) {
				internal = false;
				return;
			}
			this._collection._docs._map = new Map(state.records.map((record) => [this._collection._docs._idStringify(record._id), record]));
		});
	}

	recomputeQueries() {
		for (const query of Object.values(this._collection.queries)) {
			this._collection._recomputeResults(query);
		}
	}

	async bulkMutate(fn: () => Promise<void>) {
		const { queries } = this._collection;
		this._collection.queries = {};
		await fn();
		this._collection.queries = queries;
		this.recomputeQueries();
	}

	replaceAll(records: T[]) {
		this.use.setState({ records });
		this.recomputeQueries();
	}
}
