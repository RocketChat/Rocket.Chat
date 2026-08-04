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

const FLUSH_DELAY = 100;

const useAvailableViewTracker = () => {
	const viewsRef = useRef<Set<AvailableViews>>(new Set<AvailableViews>());
	const filteredViewsRef = useRef<AvailableViews[]>([]);

	const [registerView, unregisterView, subscribeToViews] = useMemo(() => {
		let timeout: NodeJS.Timeout | undefined;

		let sub: (() => void) | undefined = undefined;
		const subscribeToViews = (onStoreChange: () => void) => {
			sub = onStoreChange;
			return () => {
				sub = undefined;
			};
		};

		// TODO maybe we don't need to debounce this
		// It is used to prevent an useEffect from unregistering the view too early
		// Specially when the view will be re-registered when the effect runs again
		// meaning it should not have unregistered at all
		const flushDebounced = () => {
			if (timeout) {
				clearTimeout(timeout);
				timeout = undefined;
			}

			timeout = setTimeout(() => {
				const viewsArray = [...viewsRef.current].filter(filter);
				if (viewsArray.length === filteredViewsRef.current.length && viewsArray.every((view) => filteredViewsRef.current.includes(view))) {
					return;
				}
				filteredViewsRef.current = viewsArray;
				return sub?.();
			}, FLUSH_DELAY);
		};

		const unregisterView = (view: AvailableViews) => {
			if (!viewsRef.current.has(view)) {
				return;
			}
			viewsRef.current.delete(view);
			flushDebounced();
		};

		const registerView = (view: AvailableViews) => {
			if (viewsRef.current.has(view)) {
				return;
			}
			viewsRef.current.add(view);
			flushDebounced();
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
