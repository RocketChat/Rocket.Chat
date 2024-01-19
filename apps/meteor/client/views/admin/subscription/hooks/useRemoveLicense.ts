import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

import { useInvalidateLicense } from '../../../../hooks/useLicense';

export const useRemoveLicense = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const invalidateLicense = useInvalidateLicense();

	const removeLicense = useEndpoint('POST', '/v1/cloud.removeLicense');

	return useMutation({
		mutationFn: () => removeLicense(),
		onSuccess: () => {
			invalidateLicense(100);
			dispatchToastMessage({
				type: 'success',
				message: t('Removed'),
			});
		},
		onError: (error) => {
			dispatchToastMessage({
				type: 'error',
				message: error,
			});
		},
	});
};
