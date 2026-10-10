import type { IContactPublic, Serialized } from '@rocket.chat/core-typings';
import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { BaseAvatar } from '@rocket.chat/ui-avatar';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import type { KeyboardEvent } from 'react';

import ContactMenu from './ContactMenu';
import type { ContactsColumns } from './hooks/useContactsColumns';
import { getAvatarURL } from '../../lib/getAvatarURL';

export type ContactsTableRowProps = {
	contact: Serialized<IContactPublic>;
	columns: ContactsColumns;
	onClick: () => void;
	onEdit: () => void;
};

const ContactsTableRow = ({ contact, columns, onClick, onEdit }: ContactsTableRowProps) => {
	const { _id, source, displayName, emails, phones, categories, companyName, officeLocation } = contact;

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key !== 'Enter' && event.key !== ' ') {
			return;
		}

		event.preventDefault();
		onClick();
	};

	return (
		<GenericTableRow key={_id} tabIndex={0} role='link' action onClick={onClick} onKeyDown={handleKeyDown}>
			{columns.isVisible('displayName') && (
				<GenericTableCell withTruncatedText>
					<Box display='flex' alignItems='center'>
						<BaseAvatar size='x28' url={getAvatarURL({ contactId: _id }) ?? ''} />
						<Box marginInlineStart={8} fontScale='p2' withTruncatedText>
							{displayName}
						</Box>
					</Box>
				</GenericTableCell>
			)}
			{columns.isVisible('emails.address') && <GenericTableCell withTruncatedText>{emails[0]?.address}</GenericTableCell>}
			{columns.isVisible('phones.raw') && <GenericTableCell withTruncatedText>{phones[0]?.raw}</GenericTableCell>}
			{columns.isVisible('categories') && (
				<GenericTableCell>
					{source === 'local' ? (
						<Box display='flex'>
							<Tag variant='secondary' fontScale='c1' fontWeight='bold' icon={<Icon marginInlineEnd={2} name='address-book' size='x18' />}>
								Rocket.Chat
							</Tag>
						</Box>
					) : (
						<Box display='flex' flexWrap='wrap' gap={4} maxHeight='x20' overflow='hidden'>
							{categories?.map((category) => (
								<Tag fontScale='c1' fontWeight='bold' key={category} variant='secondary'>
									{category}
								</Tag>
							))}
						</Box>
					)}
				</GenericTableCell>
			)}
			{columns.isVisible('companyName') && <GenericTableCell withTruncatedText>{companyName}</GenericTableCell>}
			{columns.isVisible('officeLocation') && <GenericTableCell withTruncatedText>{officeLocation}</GenericTableCell>}
			<GenericTableCell>
				<ContactMenu contact={contact} onEdit={onEdit} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ContactsTableRow;
