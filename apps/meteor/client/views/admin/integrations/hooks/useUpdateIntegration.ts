import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useUpdateIntegration = (integrationType: 'webhook-incoming' | 'webhook-outgoing') => {
	const t = useTranslation();
	const router = useRouter();
	const updateIntegration = useEndpoint('PUT', '/v1/integrations.update');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: updateIntegration,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Integration_updated') });
			router.navigate(`/admin/integrations/${integrationType}`);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
