import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { Text } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu, GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useContactCall } from './hooks/useContactCall';
import { useContactFavorite } from './hooks/useContactFavorite';
import { useContactLabel } from './hooks/useContactLabel';
import { isContactNotFoundError } from './lib/isContactNotFoundError';
import { getErrorMessage } from '../../lib/errorHandling';
import { contactsQueryKeys } from '../../lib/queryKeys';

export type ContactMenuProps = {
	contact: Serialized<IContactPublic>;
	onEdit: () => void;
	onDeleted?: () => void;
};

const ContactMenu = ({ contact, onEdit, onDeleted }: ContactMenuProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteContact = useEndpoint('POST', '/v1/contacts.delete');
	const labelOf = useContactLabel();

	const { canCall, isCallInProgress, call } = useContactCall();
	const { favorite, setFavorite } = useContactFavorite(contact);

	const remove = useMutation({
		mutationFn: () => deleteContact({ contactId: contact._id }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Contact_deleted') });
			onDeleted?.();
		},
		onError: (error) => {
			if (!isContactNotFoundError(error)) {
				dispatchToastMessage({ type: 'error', message: getErrorMessage(error, 'Contact_delete_failed') });
				return;
			}

			dispatchToastMessage({ type: 'error', message: t('Contact_not_found') });
			onDeleted?.();
		},
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: contactsQueryKeys.all });

			setModal(null);
		},
	});

	const handleDelete = () =>
		setModal(
			<GenericModal
				variant='danger'
				title={t('Delete_contact?')}
				confirmText={t('Delete')}
				onConfirm={() => remove.mutate()}
				onCancel={() => setModal(null)}
			>
				{t('Delete_contact_warning', { name: contact.displayName })}
			</GenericModal>,
		);

	const reachItems: GenericMenuItemProps[] = [
		...contact.phones.map(({ raw, label }, index) => {
			const resolved = labelOf(label);
			const content = resolved ? `${t('Call')} (${resolved}) ${raw}` : `${t('Call')} ${raw}`;

			return {
				id: `call-${index}`,
				icon: 'phone' as const,
				content,
				textValue: content,
				disabled: !canCall,
				tooltip: isCallInProgress ? t('Call_in_progress') : undefined,
				onClick: () => call(raw),
			};
		}),
		...contact.emails.map(({ address, label }, index) => {
			const resolved = labelOf(label);
			const content = resolved ? `${t('Email')} (${resolved}) ${address}` : `${t('Email')} ${address}`;

			return {
				id: `email-${index}`,
				icon: 'mail' as const,
				content,
				textValue: content,
				onClick: () => window.open(`mailto:${address}`, '_self'),
			};
		}),
	];

	const favoriteItem: GenericMenuItemProps =
		contact.source === 'local'
			? {
					id: 'favorite',
					icon: favorite ? 'star-filled' : 'star',
					content: favorite ? t('Unfavorite') : t('Favorite'),
					textValue: favorite ? t('Unfavorite') : t('Favorite'),
					onClick: () => setFavorite(!favorite),
				}
			: { id: 'favorite', icon: 'star', content: t('Favorite_Outlook'), textValue: t('Favorite_Outlook'), disabled: true };

	const sections: { items: GenericMenuItemProps[] }[] = [...(reachItems.length ? [{ items: reachItems }] : []), { items: [favoriteItem] }];

	if (contact.source === 'local') {
		sections.push({
			items: [
				{ id: 'edit', icon: 'edit', content: t('Edit'), textValue: t('Edit'), onClick: onEdit },
				{
					id: 'delete',
					icon: 'trash',
					iconColor: 'danger',
					content: (
						<Text is='span' color='danger'>
							{t('Delete')}
						</Text>
					),
					textValue: t('Delete'),
					onClick: handleDelete,
				},
			],
		});
	}

	return <GenericMenu title={t('Options')} icon='kebab' sections={sections} />;
};

export default ContactMenu;
