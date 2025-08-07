import { Tracker } from 'meteor/tracker';

import type { LocalCollection } from './LocalCollection';
import type { Query } from './Query';

export class ObserveHandle<T extends { _id: string }> {
	isReady: boolean;

	isReadyPromise: Promise<void>;

	constructor(public collection: LocalCollection<T>) {
		this.collection.observeQueue.drain();

		this.isReady = true;
		this.isReadyPromise = Promise.resolve();
	}

	stop() {
		// Do nothing by default
	}
}

export class ReactiveObserveHandle<T extends { _id: string }> extends ObserveHandle<T> {
	constructor(
		private query: Query<T>,
		collection: LocalCollection<T>,
	) {
		super(collection);

		if (Tracker.active) {
			Tracker.onInvalidate(() => {
				this.stop();
			});
		}
	}

	stop() {
		this.collection.queries.delete(this.query);
	}
}
