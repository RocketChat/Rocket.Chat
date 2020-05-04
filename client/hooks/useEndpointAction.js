import { useCallback } from 'react';

import { useEndpoint, useUpload } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointAction = (httpMethod, endpoint, params = {}, successMessage) => {
	const sendData = httpMethod !== 'UPLOAD' ? useEndpoint(httpMethod, endpoint) : useUpload(endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(async (...args) => {
		try {
			let data = sendData(params, ...args);

			data = data.promise ? await data.promise : await data;

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
