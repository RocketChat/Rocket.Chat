import { Mongo } from 'meteor/mongo';

import { createDocumentMapStore } from './DocumentMapStore';
import { LocalCollection } from './LocalCollection';

/**
 * Implements a minimal version of a MongoDB collection using Zustand for state management.
 *
 * It's a middle layer between the Mongo.Collection and Zustand aiming for complete migration to Zustand.
 */
export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
	/**
	 * A Zustand store that holds the records of the collection.
	 *
	 * It should be used as a hook in React components to access the collection's records and methods.
	 */
	readonly use = createDocumentMapStore<T>({
		onMutate: () => this.recomputeQueries(),
	});

	/**
	 * The internal collection that manages the queries and results.
	 *
	 * It overrides the default Mongo.Collection's methods to use Zustand for state management.
	 */
	protected _collection = new LocalCollection<T>(this.use);

	constructor() {
		super(null);
	}

	/**
	 * Returns the Zustand store state that holds the records of the collection.
	 *
	 * It's a convenience method to access the Zustand store directly i.e. outside of React components.
	 */
	get state() {
		return this.use.getState();
	}

	private recomputeQueries() {
		this._collection.recomputeAllResults();
	}
}
