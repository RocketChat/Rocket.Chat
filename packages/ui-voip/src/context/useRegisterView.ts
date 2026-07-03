import { useLayoutEffect } from 'react';

import { useMediaCallInstance } from '.';
import type { AvailableViews } from './MediaCallInstanceContext';

const useRegisterView = (view: AvailableViews): AvailableViews[] => {
	const { currentViews, registerView, unregisterView } = useMediaCallInstance();

	useLayoutEffect(() => {
		registerView(view);

		return () => unregisterView(view);
	}, [view, registerView, unregisterView]);

	return currentViews;
};

export default useRegisterView;
