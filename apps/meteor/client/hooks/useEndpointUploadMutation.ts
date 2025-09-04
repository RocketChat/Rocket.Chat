import type { PathFor, PathPattern } from '@rocket.chat/rest-typings';
import { useToastMessageDispatch, useUpload } from '@rocket.chat/ui-contexts';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

type UseEndpointUploadOptions = Omit<UseMutationOptions<void, Error, FormData>, 'mutationFn'>;

export const useEndpointUploadMutation = <TPathPattern extends PathPattern>(endpoint: TPathPattern, options?: UseEndpointUploadOptions) => {
	const sendData = useUpload(endpoint as PathFor<'POST'>);
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async (formData: FormData) => {
			const data = sendData(formData);
			const promise = data instanceof Promise ? data : data.promise;
			const result = await promise;

			if (!result.success) {
				throw new Error(String(result.status));
			}
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		...options,
	});
};
