import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

import type { AvailableViews } from '../context/MediaCallInstanceContext';

const filter = (view: AvailableViews, _index: number, array: AvailableViews[]) => {
	switch (view) {
		case 'widget':
			return !array.includes('room');
		case 'popout':
		case 'room':
		default:
			return true;
	}
};

const useAvailableViewTracker = () => {
	const viewsRef = useRef<Set<AvailableViews>>(new Set<AvailableViews>());
	const filteredViewsRef = useRef<AvailableViews[]>([]);

	const [registerView, unregisterView, subscribeToViews] = useMemo(() => {
		let flushScheduled = false;

		let sub: (() => void) | undefined = undefined;
		const subscribeToViews = (onStoreChange: () => void) => {
			sub = onStoreChange;
			return () => {
				sub = undefined;
			};
		};

		const flush = () => {
			flushScheduled = false;
			const viewsArray = [...viewsRef.current].filter(filter);
			if (viewsArray.length === filteredViewsRef.current.length && viewsArray.every((view) => filteredViewsRef.current.includes(view))) {
				return;
			}
			filteredViewsRef.current = viewsArray;
			return sub?.();
		};

		const scheduleFlush = () => {
			if (flushScheduled) {
				return;
			}
			flushScheduled = true;
			queueMicrotask(flush);
		};

		const unregisterView = (view: AvailableViews) => {
			if (!viewsRef.current.has(view)) {
				return;
			}
			viewsRef.current.delete(view);
			scheduleFlush();
		};

		const registerView = (view: AvailableViews) => {
			if (viewsRef.current.has(view)) {
				return;
			}
			viewsRef.current.add(view);
			scheduleFlush();
		};

		return [registerView, unregisterView, subscribeToViews];
	}, []);

	const currentViews = useSyncExternalStore(
		subscribeToViews,
		useCallback(() => filteredViewsRef.current, []),
		useCallback(() => filteredViewsRef.current, []),
	);

	return {
		currentViews,
		registerView,
		unregisterView,
	};
};

export default useAvailableViewTracker;
