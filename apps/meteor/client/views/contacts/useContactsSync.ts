import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getEndpointErrorMessage } from '../../lib/errorHandling';

export const useContactsSync = () => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const syncMyContacts = useEndpoint('POST', '/v1/exchange.syncMyContacts');

	return useMutation({
		mutationFn: async () => {
			const result = await syncMyContacts();

			await queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] });

			return result;
		},
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Outlook_contact_sync_complete') }),
		onError: async (error) => dispatchToastMessage({ type: 'error', message: await getEndpointErrorMessage(error, 'Outlook_Sync_Failed') }),
	});
};
