import type { PathFor, PathPattern } from '@rocket.chat/rest-typings';
import { useToastMessageDispatch, useUpload } from '@rocket.chat/ui-contexts';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

interface IUploadResult {
	success: boolean;
	status?: string;
	[key: string]: any;
}

type UseEndpointUploadOptions<TData> = Omit<UseMutationOptions<TData, Error, FormData>, 'mutationFn'>;

export const useEndpointUploadMutation = <TPathPattern extends PathPattern, TData = IUploadResult>(
	endpoint: TPathPattern,
	options?: UseEndpointUploadOptions<TData>,
) => {
	const sendData = useUpload(endpoint as PathFor<'POST'>);
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: async (formData: FormData): Promise<TData> => {
			const data = sendData(formData);
			const promise = data instanceof Promise ? data : data.promise;
			const result = await promise;

			if (!result.success) {
				throw new Error(result.status || (typeof result.error === 'string' ? result.error : 'Unknown upload error'));
			}
			return result as TData;
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		...options,
	});
};
