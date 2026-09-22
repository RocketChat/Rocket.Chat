import type { IContact, Serialized } from '@rocket.chat/core-typings';
import { Box, Chip, Icon } from '@rocket.chat/fuselage';
import { BaseAvatar } from '@rocket.chat/ui-avatar';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import type { KeyboardEvent } from 'react';

import ContactMenu from './ContactMenu';
import type { ContactsColumns } from './useContactsColumns';
import { getAvatarURL } from '../../../app/utils/client/getAvatarURL';

export type ContactsTableRowProps = {
	contact: Serialized<IContact>;
	columns: ContactsColumns;
	onClick: () => void;
};

const ContactsTableRow = ({ contact, columns, onClick }: ContactsTableRowProps) => {
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
					<Box display='flex' flexWrap='wrap' gap={4}>
						{source === 'local' ? (
							<Chip>
								<Box display='flex' flexDirection='row' gap={4} margin={0}>
									<Icon name='address-book' size='x20' /> Rocket.Chat{' '}
								</Box>
							</Chip>
						) : (
							categories?.map((category) => <Chip key={category}>{category}</Chip>)
						)}
					</Box>
				</GenericTableCell>
			)}
			{columns.isVisible('companyName') && <GenericTableCell withTruncatedText>{companyName}</GenericTableCell>}
			{columns.isVisible('officeLocation') && <GenericTableCell withTruncatedText>{officeLocation}</GenericTableCell>}
			<GenericTableCell>
				<ContactMenu contact={contact} />
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default ContactsTableRow;
