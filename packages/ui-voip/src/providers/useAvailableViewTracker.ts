import { useCallback, useMemo, useState } from 'react';

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
	const [views, setViews] = useState<Set<AvailableViews>>(new Set<AvailableViews>());

	const registerView = useCallback((view: AvailableViews) => {
		setViews((prev) => {
			if (prev.has(view)) {
				return prev;
			}

			prev.add(view);

			return new Set(prev);
		});
	}, []);

	const unregisterView = useCallback((view: AvailableViews) => {
		setViews((prev) => {
			if (!prev.has(view)) {
				return prev;
			}

			prev.delete(view);

			return new Set(prev);
		});
	}, []);

	const currentViews = useMemo(() => [...views].filter(filter), [views]);

	return {
		currentViews,
		registerView,
		unregisterView,
	};
};

export default useAvailableViewTracker;
