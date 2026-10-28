import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { Icon, IconButton, Stack } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useContactFavorite } from './hooks/useContactFavorite';
import { isContactFavoriteEditable } from '../../../lib/isContactFavoriteEditable';

export type ContactFavoriteToggleProps = {
	contact: Serialized<IContactPublic>;
	revealed: boolean;
};

const ContactFavoriteToggle = ({ contact, revealed }: ContactFavoriteToggleProps) => {
	const { t } = useTranslation();
	const { favorite, setFavorite } = useContactFavorite(contact);

	if (!isContactFavoriteEditable(contact)) {
		return (
			favorite && (
				<Stack direction='row' justify='center'>
					<Icon name='star' size='x20' title={t('Favorite_Outlook')} />
				</Stack>
			)
		);
	}

	if (!favorite && !revealed) {
		return;
	}

	const handleClick = (event: MouseEvent) => {
		event.stopPropagation();
		setFavorite(!favorite);
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
