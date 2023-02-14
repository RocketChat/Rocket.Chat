import type { Mongo } from 'meteor/mongo';

export type MinimongoCollection<T> = Mongo.Collection<T> & {
	_collection: Mongo.Collection<T> & {
		queries: Record<string, unknown>;
		_docs: {
			_idStringify: (id: string) => string;
			_map: Map<string, T>;
		};
		_recomputeResults: (query: unknown) => void;
	};
	direct: Mongo.Collection<T>;
	queries: unknown[];
};
