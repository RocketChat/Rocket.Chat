import { useLayoutEffect, useMemo } from 'react';

import { useMediaCallInstance } from '.';
import type { AvailableViews } from './MediaCallInstanceContext';

const useRegisterView = (view: AvailableViews, filter?: (view: Set<AvailableViews>) => boolean): Set<AvailableViews> => {
	const { currentViews, setCurrentViews } = useMediaCallInstance();

	const shouldAddToSet = useMemo(() => {
		if (!filter) {
			return true;
		}

		return filter(currentViews);
	}, [currentViews, filter]);

	useLayoutEffect(() => {
		if (!shouldAddToSet) {
			return;
		}

		setCurrentViews((prev) => {
			if (prev.has(view)) {
				return prev;
			}

			prev.add(view);
			return new Set<AvailableViews>(prev);
		});

		return () => {
			setCurrentViews((prev) => {
				if (!prev.has(view)) {
					return prev;
				}

				prev.delete(view);
				return new Set<AvailableViews>(prev);
			});
		};
	}, [setCurrentViews, view, shouldAddToSet]);

	return currentViews;
};

export default useRegisterView;
