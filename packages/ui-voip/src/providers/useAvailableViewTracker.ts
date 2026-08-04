import { useCallback, useState } from 'react';

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
	// keep in mind views.currentViews is a stable set, so please if you are going to use it in a useEffect, make sure to create a new set from it, otherwise you will not be able to track changes in the set.
	const [views, setViews] = useState<{
		currentViews: Set<AvailableViews>;
		filteredViews: Set<AvailableViews>;
	}>({
		currentViews: new Set<AvailableViews>(),
		filteredViews: new Set<AvailableViews>(),
	});

	const registerView = useCallback((view: AvailableViews) => {
		setViews((prev) => {
			if (prev.currentViews.has(view)) return prev;

			prev.currentViews.add(view);
			return {
				currentViews: prev.currentViews,
				filteredViews: new Set(Array.from(prev.currentViews).filter(filter)),
			};
		});
	}, []);

	const unregisterView = useCallback((view: AvailableViews) => {
		setViews((prev) => {
			if (!prev.currentViews.has(view)) return prev;

			prev.currentViews.delete(view);
			return {
				currentViews: prev.currentViews,
				filteredViews: new Set(Array.from(prev.currentViews).filter(filter)),
			};
		});
	}, []);

	return {
		currentViews: views.filteredViews,
		registerView,
		unregisterView,
	};
};

export default useAvailableViewTracker;
