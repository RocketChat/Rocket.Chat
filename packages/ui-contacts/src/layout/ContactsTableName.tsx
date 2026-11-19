import { Box, Stack } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ContactsTableNameProps = {
	avatar: ReactNode;
	children: ReactNode;
};

const ContactsTableName = ({ avatar, children }: ContactsTableNameProps) => (
	<Stack direction='row' align='center' gap='x8'>
		<Box display='flex' flexShrink={0}>
			{avatar}
		</Box>
		{children}
	</Stack>
);

export default ContactsTableName;
