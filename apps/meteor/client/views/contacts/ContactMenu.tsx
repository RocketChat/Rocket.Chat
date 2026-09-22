import type { IContact, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu, GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMediaCallAction } from '@rocket.chat/ui-voip';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import ContactModal from './ContactModal';
import { getEndpointErrorMessage } from '../../lib/errorHandling';

export type ContactMenuProps = {
	contact: Serialized<IContact>;
	onDeleted?: () => void;
};

const ContactMenu = ({ contact, onDeleted }: ContactMenuProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteContact = useEndpoint('POST', '/v1/contacts.delete');

	const number = contact.phones[0]?.raw;
	const address = contact.emails[0]?.address;

	const callAction = useMediaCallAction(number ? { number } : undefined);

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

	const handleEdit = () => setModal(<ContactModal contact={contact} onClose={() => setModal(null)} />);

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

	const handleEmail = () => {
		if (address) {
			window.open(`mailto:${address}`, '_self');
		}
	};

	const sections: { items: GenericMenuItemProps[] }[] = [
		{
			items: [
				{
					id: 'call',
					icon: 'phone',
					content: t('Call'),
					disabled: !number || !callAction,
					onClick: () => number && callAction?.action({ number }),
				},
				{ id: 'email', icon: 'mail', content: t('Email'), disabled: !address, onClick: handleEmail },
			],
		},
	];

	if (contact.source === 'local') {
		sections.push({
			items: [
				{ id: 'edit', icon: 'edit', content: t('Edit'), onClick: handleEdit },
				{ id: 'delete', icon: 'trash', iconColor: 'danger', content: <Box color='danger'>{t('Delete')}</Box>, onClick: handleDelete },
			],
		});
	}

	return <GenericMenu title={t('Options')} icon='kebab' sections={sections} />;
};

export default ContactMenu;
