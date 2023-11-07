import { useEndpoint, useRouter, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';

export const useDeleteIntegration = (integrationType: 'webhook-incoming' | 'webhook-outgoing') => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();

	const createIntegration = useEndpoint('POST', '/v1/integrations.remove');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: createIntegration,
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Your_entry_has_been_deleted') });
			router.navigate(`/admin/integrations/${integrationType}`);
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			setModal(null);
		},
	});
};
