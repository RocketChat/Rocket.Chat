import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useErrorToast = () => {
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback((error: unknown) => dispatchToastMessage({ type: 'error', message: error }), [dispatchToastMessage]);
};
