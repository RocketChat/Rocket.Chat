import { useToastMessageDispatch, UploadResult, useUpload } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

export const useEndpointUpload = (
	endpoint: string,
	params = {},
	successMessage: string,
): ((formData: FormData) => Promise<{ success: boolean }>) => {
	const sendData = useUpload(endpoint);
	const dispatchToastMessage = useToastMessageDispatch();

	return useCallback(
		async (formData: FormData) => {
			try {
				const data = sendData(params, formData);

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
