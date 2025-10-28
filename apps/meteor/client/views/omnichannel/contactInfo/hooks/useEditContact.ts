import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { QueryKey } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useContactRoute } from '../../hooks/useContactRoute';

export const useEditContact = (invalidateQueries?: QueryKey) => {
	const { t } = useTranslation();
	const updateContact = useEndpoint('POST', '/v1/omnichannel/contacts.update');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const handleNavigate = useContactRoute();

	return useMutation({
		mutationFn: updateContact,
		onSuccess: async ({ contact }) => {
			handleNavigate({ context: 'details', id: contact?._id });
			dispatchToastMessage({ type: 'success', message: t('Contact_has_been_updated') });
			await queryClient.invalidateQueries({ queryKey: invalidateQueries });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});
};
