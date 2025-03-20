import type { Mongo } from 'meteor/mongo';
import type { Document } from 'mongodb';

export type MinimongoCollection<T extends Document> = Mongo.Collection<T> & {
	_collection: Mongo.Collection<T> & {
		queries: Record<string, unknown>;
		_docs: {
			_idStringify: (id: string) => string;
			_map: Map<string, T>;
		};
		_recomputeResults: (query: unknown) => void;
	};
	queries: unknown[];
};
