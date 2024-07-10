import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericMenu from '../../../../../components/GenericMenu/GenericMenu';
import { GenericTableCell, GenericTableRow } from '../../../../../components/GenericTable';

const ContactGroupsTableRow = ({ _id, name, contacts, archived }) => {
	const t = useTranslation();
	const directoryRoute = useRoute('omnichannel-directory');

	const onRowClick = useEffectEvent((id) =>
		directoryRoute.push({
			id,
			tab: 'groups',
			context: 'info',
		}),
	);

	const handleAddContacts = (groupId: string) => directoryRoute.push({ tab: 'groups', context: 'add', id: groupId });

	const menuSections = [
		{
			items: [
				{ id: 'add', icon: 'user', content: t('Add_contacts'), onClick: () => handleAddContacts(_id) } as const,
				{ id: 'remove', icon: 'trash', variant: 'danger', content: t('Remove_from_group') } as const,
			],
		},
	];

	return (
		<GenericTableRow action tabIndex={0} role='link' onClick={() => onRowClick(_id)}>
			<GenericTableCell withTruncatedText>{name}</GenericTableCell>
			<GenericTableCell withTruncatedText>{contacts}</GenericTableCell>
			<GenericTableCell withTruncatedText>{archived ? t('Archived') : t('Active')}</GenericTableCell>
			<GenericTableCell>
				<GenericMenu title={t('More')} detached sections={menuSections} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ContactGroupsTableRow;
