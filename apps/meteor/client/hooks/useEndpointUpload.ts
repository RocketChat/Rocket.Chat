import { useCallback } from 'react';

import { UploadResult, useUpload } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';

export const useEndpointUpload = (
	endpoint: string,
	params = {},
	successMessage: string,
): ((...args: any[]) => Promise<{ success: boolean }>) => {
	const sendData = useUpload(endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (...args) => {
			try {
				const data = sendData(params, [...args]);

				const promise = data instanceof Promise ? data : data.promise;

				const result = await (promise as unknown as Promise<UploadResult>);

				if (!result.success) {
					throw new Error(String(result.status));
				}

				successMessage && dispatchToastMessage({ type: 'success', message: successMessage });

				return result as any;
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: String(error) });
				return { success: false };
			}
		},
		[dispatchToastMessage, params, sendData, successMessage],
	);
};
