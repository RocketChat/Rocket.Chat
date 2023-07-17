import { useContext } from 'react';

import { ActionManagerContext } from '../contexts/ActionManagerContext';

export const useUiKitActionManager = () => {
	const actionManager = useContext(ActionManagerContext);
	if (!actionManager) {
		throw new Error('ActionManagerContext is not provided');
	}
	return actionManager;
};
