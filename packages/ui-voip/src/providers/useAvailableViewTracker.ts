import { useCallback, useRef, useState } from 'react';

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
	const [currentViews, setCurrentViews] = useState<Set<AvailableViews>>(new Set<AvailableViews>());

	const registerView = useCallback((view: AvailableViews) => {
		if (viewsRef.current.has(view)) return;

		viewsRef.current.add(view);
		const filteredViews = new Set([...viewsRef.current].filter(filter));
		setCurrentViews((prev) => {
			if (filteredViews.size === prev.size && filteredViews.isSubsetOf(prev)) {
				return prev;
			}
			return filteredViews;
		});
	}, []);

	const unregisterView = useCallback((view: AvailableViews) => {
		if (!viewsRef.current.has(view)) return;

		viewsRef.current.delete(view);
		const filteredViews = new Set([...viewsRef.current].filter(filter));
		setCurrentViews((prev) => {
			if (filteredViews.size === prev.size && filteredViews.isSubsetOf(prev)) {
				return prev;
			}
			return filteredViews;
		});
	}, []);

	return {
		currentViews,
		registerView,
		unregisterView,
	};
};

export default useAvailableViewTracker;
