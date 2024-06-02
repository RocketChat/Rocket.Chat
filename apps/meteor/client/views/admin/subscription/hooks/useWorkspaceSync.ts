import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export const useWorkspaceSync = () => {
	const { t } = useTranslation();
	const cloudSync = useEndpoint('POST', '/v1/cloud.syncWorkspace');
	const dispatchToastMessage = useToastMessageDispatch();

	return useMutation({
		mutationFn: () => cloudSync(),
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('Sync_success'),
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
