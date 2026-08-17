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

const withFilteredViews = (currentViews: Set<AvailableViews>) => ({
	currentViews,
	filteredViews: new Set(Array.from(currentViews).filter(filter)),
});

const useAvailableViewTracker = () => {
	const [views, setViews] = useState<{
		currentViews: Set<AvailableViews>;
		filteredViews: Set<AvailableViews>;
	}>(() => withFilteredViews(new Set<AvailableViews>()));

	const registerView = useCallback((view: AvailableViews) => {
		// the updater must not touch prev: StrictMode calls it twice, and a mutated set would make the second call bail out
		setViews((prev) => (prev.currentViews.has(view) ? prev : withFilteredViews(new Set(prev.currentViews).add(view))));
	}, []);

	const unregisterView = useCallback((view: AvailableViews) => {
		setViews((prev) => {
			if (!prev.currentViews.has(view)) {
				return prev;
			}

			const currentViews = new Set(prev.currentViews);
			currentViews.delete(view);
			return withFilteredViews(currentViews);
		});
	}, []);

	return {
		currentViews: views.filteredViews,
		registerView,
		unregisterView,
	};
};

export default useAvailableViewTracker;
