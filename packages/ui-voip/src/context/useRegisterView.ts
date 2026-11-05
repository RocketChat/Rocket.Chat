import { useLayoutEffect } from 'react';

import type { AvailableViews } from './MediaCallInstanceContext.js';
import { useMediaCallInstance } from './index.js';

const useRegisterView = (view: AvailableViews) => {
	const { currentViews, registerView, unregisterView } = useMediaCallInstance();

	useLayoutEffect(() => {
		registerView(view);

		return () => unregisterView(view);
	}, [view, registerView, unregisterView]);

	return currentViews;
};

export default useRegisterView;
