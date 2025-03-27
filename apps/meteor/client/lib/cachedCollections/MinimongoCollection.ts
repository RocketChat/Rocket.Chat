import { Mongo } from 'meteor/mongo';

export type MinimongoSelector<T> = Mongo.Selector<T>;
export type MinimongoOptions<T> = Mongo.Options<T>;

export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
	protected declare _collection: Mongo.Collection<T> & {
		queries: Record<number, { __brand: 'query' }>;
		_docs: {
			_idStringify: (id: string) => string;
			_map: Map<string, T>;
		};
		_recomputeResults: (query: { __brand: 'query' }) => void;
	};

	constructor() {
		super(null);
	}

	recomputeQueries() {
		Object.values(this._collection.queries).forEach((query) => this._collection._recomputeResults(query));
	}

	async bulkMutate(fn: () => Promise<void>) {
		const { queries } = this._collection;
		this._collection.queries = {};
		await fn();
		this._collection.queries = queries;
		this.recomputeQueries();
	}

	replaceAll(records: T[]) {
		this._collection._docs._map = new Map(records.map((record) => [this._collection._docs._idStringify(record._id), record]));
		this.recomputeQueries();
	}
}
