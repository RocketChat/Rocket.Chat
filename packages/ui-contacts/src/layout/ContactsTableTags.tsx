import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContactsTableTagsProps = {
	children: ReactNode;
};

/** Keeps a contact's tags on one line of its table row, hiding the ones that do not fit. */
const ContactsTableTags = ({ children }: ContactsTableTagsProps) => (
	<Box display='flex' flexWrap='wrap' gap='x4' maxHeight='x20' overflow='hidden'>
		{children}
	</Box>
);

export default ContactsTableTags;
