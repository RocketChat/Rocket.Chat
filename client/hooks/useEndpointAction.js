import { useCallback } from 'react';

import { useEndpoint } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointAction = (httpMethod, endpoint, params = {}, successMessage) => {
	const sendData = useEndpoint(httpMethod, endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(async (...args) => {
		try {
			const data = await sendData(params, ...args);

			if (!data.success) {
				throw new Error(data.status);
			}

			successMessage && dispatchToastMessage({ type: 'success', message: successMessage });

			return data;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return { success: false };
		}
	}, [dispatchToastMessage, params, sendData, successMessage]);
};
