import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { QueryKey } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useContactRoute } from '../../hooks/useContactRoute';

export const useCreateContact = (invalidateQueries: QueryKey) => {
	const { t } = useTranslation();
	const createContact = useEndpoint('POST', '/v1/omnichannel/contacts');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const handleNavigate = useContactRoute();

	return useMutation({
		mutationFn: createContact,
		onSuccess: async ({ contactId }) => {
			handleNavigate({ context: 'details', id: contactId });
			dispatchToastMessage({ type: 'success', message: t('Contact_has_been_created') });
			await queryClient.invalidateQueries({ queryKey: invalidateQueries });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
