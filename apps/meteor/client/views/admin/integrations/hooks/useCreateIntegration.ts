import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useCreateIntegration = (integrationType: 'webhook-incoming' | 'webhook-outgoing') => {
	const t = useTranslation();
	const router = useRouter();
	const createIntegration = useEndpoint('POST', '/v1/integrations.create');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: createIntegration,
		onSuccess: (data) => {
			dispatchToastMessage({ type: 'success', message: t('Integration_added') });
			router.navigate(
				`/admin/integrations/edit/${integrationType === 'webhook-incoming' ? 'incoming' : 'outgoing'}/${data.integration._id}`,
			);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
