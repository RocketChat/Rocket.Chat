import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useMutationState, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getErrorMessage } from '../../../lib/errorHandling';
import { contactsQueryKeys } from '../../../lib/queryKeys';

export const useContactFavorite = (contact: Serialized<IContactPublic>) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const setFavoriteEndpoint = useEndpoint('POST', '/v1/contacts.favorite');

	const mutationKey = [...contactsQueryKeys.all, 'favorite', contact._id];

	const { mutate } = useMutation({
		mutationKey,
		mutationFn: (favorite: boolean) => setFavoriteEndpoint({ contactId: contact._id, favorite }),
		onSuccess: (_data, favorite) =>
			dispatchToastMessage({
				type: 'success',
				message: favorite
					? t('Contact_added_to_favorites', { name: contact.displayName })
					: t('Contact_removed_from_favorites', { name: contact.displayName }),
			}),
		onError: (error) => dispatchToastMessage({ type: 'error', message: getErrorMessage(error, 'Contact_favorite_failed') }),
		onSettled: () => queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all }),
	});

	const pending = useMutationState({
		filters: { mutationKey, status: 'pending' },
		select: ({ state }) => state.variables as boolean,
	});

	return {
		favorite: pending.length ? pending[pending.length - 1] : Boolean(contact.favorite),
		setFavorite: mutate,
	};
};
