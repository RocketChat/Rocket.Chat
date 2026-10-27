import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { Icon, IconButton, Stack } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { getErrorMessage } from '../../lib/errorHandling';
import { contactsQueryKeys } from '../../lib/queryKeys';

export type ContactFavoriteToggleProps = {
	contact: Serialized<IContactPublic>;
	revealed: boolean;
};

const ContactFavoriteToggle = ({ contact, revealed }: ContactFavoriteToggleProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const setFavorite = useEndpoint('POST', '/v1/contacts.favorite');

	const toggle = useMutation({
		mutationFn: (favorite: boolean) => setFavorite({ contactId: contact._id, favorite }),
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

	const favorite = toggle.isPending ? toggle.variables : Boolean(contact.favorite);

	if (contact.source !== 'local') {
		return (
			favorite && (
				<Stack direction='row' justify='center'>
					<Icon name='star-filled' size='x20' title={t('Favorite')} />
				</Stack>
			)
		);
	}

	if (!favorite && !revealed) {
		return;
	}

	const handleClick = (event: MouseEvent) => {
		event.stopPropagation();
		toggle.mutate(!favorite);
	};

	return (
		<IconButton
			size='small'
			icon={favorite ? 'star-filled' : 'star'}
			title={favorite ? t('Remove_from_favorites') : t('Add_to_favorites')}
			aria-pressed={favorite}
			onClick={handleClick}
		/>
	);
};

export default ContactFavoriteToggle;
