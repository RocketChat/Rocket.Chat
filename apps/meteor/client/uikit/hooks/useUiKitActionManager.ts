import { ActionManagerContext } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';

export const useUiKitActionManager = () => {
	const actionManager = useContext(ActionManagerContext);
	if (!actionManager) {
		throw new Error('ActionManagerContext is not provided');
	}
	return actionManager;
};
