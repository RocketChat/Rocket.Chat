import type { PathFor, PathPattern } from '@rocket.chat/rest-typings';
import { useToastMessageDispatch, useUpload, type UploadResult } from '@rocket.chat/ui-contexts';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { t } from 'i18next';

type UseEndpointUploadOptions<TData extends UploadResult> = Omit<UseMutationOptions<TData, Error, FormData>, 'mutationFn'>;

export const useEndpointUploadMutation = <TPathPattern extends PathPattern, TData extends UploadResult = UploadResult>(
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
				if (result.status) {
					throw new Error(result.status);
				}

				if (typeof result.error === 'string') {
					throw new Error(result.error);
				}

				throw new Error(t('FileUpload_Error'));
			}
			return result as TData;
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		...options,
	});
};
