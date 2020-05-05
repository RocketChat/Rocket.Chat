import { useCallback } from 'react';

import { useUpload } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointUpload = (endpoint, params = {}, successMessage) => {
	const sendData = useUpload(endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(async (...args) => {
		try {
			let data = sendData(params, ...args);

			data = await data.promise;

			if (!data.success) {
				throw new Error(data.status);
			}

			successMessage && dispatchToastMessage({ type: 'success', message: successMessage });

			return data;
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
			return { success: false };
		}
	}, [JSON.stringify(params)]);
};
