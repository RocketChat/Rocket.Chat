import type { IContact, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu, GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useContactCall } from './hooks/useContactCall';
import { useContactLabel } from './hooks/useContactLabel';
import { getEndpointErrorMessage } from '../../lib/errorHandling';

export type ContactMenuProps = {
	contact: Serialized<IContact>;
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

	const { canCall, call } = useContactCall();

	const remove = useMutation({
		mutationFn: () => deleteContact({ contactId: contact._id }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Contact_deleted') });
			onDeleted?.();
		},
		onError: async (error) =>
			dispatchToastMessage({ type: 'error', message: await getEndpointErrorMessage(error, 'Failed_to_save_settings') }),
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: ['contacts', 'list'] });

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

			return {
				id: `call-${index}`,
				icon: 'phone' as const,
				content: resolved ? `${t('Call')} (${resolved}) ${raw}` : `${t('Call')} ${raw}`,
				disabled: !canCall,
				onClick: () => call(raw),
			};
		}),
		...contact.emails.map(({ address, label }, index) => {
			const resolved = labelOf(label);

			return {
				id: `email-${index}`,
				icon: 'mail' as const,
				content: resolved ? `${t('Email')} (${resolved}) ${address}` : `${t('Email')} ${address}`,
				onClick: () => window.open(`mailto:${address}`, '_self'),
			};
		}),
	];

	const sections: { items: GenericMenuItemProps[] }[] = reachItems.length ? [{ items: reachItems }] : [];

	if (contact.source === 'local') {
		sections.push({
			items: [
				{ id: 'edit', icon: 'edit', content: t('Edit'), onClick: onEdit },
				{ id: 'delete', icon: 'trash', iconColor: 'danger', content: <Box color='danger'>{t('Delete')}</Box>, onClick: handleDelete },
			],
		});
	}

	if (!sections.length) {
		return null;
	}

	return <GenericMenu title={t('Options')} icon='kebab' sections={sections} />;
};

export default ContactMenu;
