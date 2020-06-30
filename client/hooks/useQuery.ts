import { Tracker } from 'meteor/tracker';
import { useCallback, useMemo, useRef } from 'react';
import { useSubscription } from 'use-subscription';
import { Mongo } from 'meteor/mongo';

const allQuery = {};

export const useQuery = <T>(collection: Mongo.Collection<T>, query: object = allQuery, options?: object): T[] => {
	const queryHandle = useMemo(() => collection.find(query, options), [collection, query, options]);
	const resultRef = useRef<T[]>([]);
	resultRef.current = Tracker.nonreactive(() => queryHandle.fetch()) as unknown as T[];

	const subscribe = useCallback((cb) => {
		const computation = Tracker.autorun(() => {
			resultRef.current = queryHandle.fetch();
			cb(resultRef.current);
		});

		return (): void => {
			computation.stop();
		};
	}, [queryHandle]);

	const subscription = useMemo(() => ({
		getCurrentValue: (): T[] => resultRef.current ?? [],
		subscribe,
	}), [subscribe]);

	return useSubscription(subscription);
};
